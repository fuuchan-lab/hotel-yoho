import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSourceSpecification, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef, useState } from 'react'
import { CITIES, type CityId } from '../cities.ts'
import { faceSvg } from '../face.ts'
import type { DayForecast } from '../forecast.ts'
import { useI18n } from '../i18n/useI18n.ts'

// のりものレーダーと同じ地図: 地理院タイル（淡色地図）に、日本の排他的経済水域（陸地を含む）の外を隠す層と境界の破線を重ねる
// 範囲は public/data/area.json（scripts/build-area.mjs で Marine Regions の EEZ から作る。のりものレーダーと同じもの）

interface Props {
  forecasts: DayForecast[]
  onCity: (id: CityId) => void
  moodLabel: (f: DayForecast) => string
}

type LngLat = [number, number]
interface AreaFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: 'MultiPolygon'; coordinates: LngLat[][][] }
}

const SEA = '#bed2ff' // 地理院タイル（淡色地図）の海の色
const PALETTE = {
  light: { sea: SEA, outside: '#ffffff', eez: '#3d6fb6' },
  dark: { sea: '#1a2332', outside: '#0b0f14', eez: '#7fa8e0' },
}

/** 最初に見せる範囲（北海道〜九州。都市の顔が見やすいように、沖縄は地図を動かすと見える） */
const MAINLAND: [LngLat, LngLat] = [
  [129.3, 31.0],
  [145.9, 45.6],
]

maplibregl.setWorkerUrl(workerUrl)

const style: StyleSpecification = {
  version: 8,
  sources: {
    gsi: {
      type: 'raster',
      tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 18,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院 GSI Japan</a>' +
        ' | EEZ: <a href="https://www.marineregions.org" target="_blank" rel="noopener">Marine Regions</a> (CC BY 4.0)',
    },
  },
  layers: [
    { id: 'sea', type: 'background', paint: { 'background-color': SEA } },
    { id: 'gsi', type: 'raster', source: 'gsi' },
  ],
}

/** 対象範囲の外を隠すマスク（広い四角形から範囲をくり抜く。のりものレーダーと同じ） */
function maskOf(area: AreaFeature): GeoJSONSourceSpecification['data'] {
  const world: LngLat[] = [
    [100, -10],
    [190, -10],
    [190, 70],
    [100, 70],
    [100, -10],
  ]
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [world, ...area.geometry.coordinates.map((p) => p[0])] },
  }
}

function isDark(): boolean {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'dark') return true
  if (attr === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function applyMapTheme(map: maplibregl.Map) {
  if (!map.getLayer('mask')) return
  const dark = isDark()
  const c = PALETTE[dark ? 'dark' : 'light']
  map.setPaintProperty('sea', 'background-color', c.sea)
  // 地図画像は、ダークでは明暗を反転して色相を戻す（のりものレーダーと同じ）
  map.setPaintProperty('gsi', 'raster-brightness-min', dark ? 0.9 : 0)
  map.setPaintProperty('gsi', 'raster-brightness-max', dark ? 0.1 : 1)
  map.setPaintProperty('gsi', 'raster-hue-rotate', dark ? 180 : 0)
  map.setPaintProperty('gsi', 'raster-saturation', dark ? -0.2 : 0)
  map.setPaintProperty('mask', 'fill-color', c.outside)
  map.setPaintProperty('eez-line', 'line-color', c.eez)
}

/** 拡大するほど、顔をずらす量を小さくする（離れて見えるようになるため） */
function offsetScale(zoom: number): number {
  if (zoom <= 4.6) return 1
  if (zoom >= 7) return 0
  return (7 - zoom) / 2.4
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function pinHtml(name: string, svg: string, dx: number, dy: number): string {
  const line =
    dx || dy
      ? `<svg class="pin-line" width="1" height="1" aria-hidden="true"><line x1="0" y1="0" x2="${dx}" y2="${dy}"/></svg><span class="pin-dot"></span>`
      : ''
  return `${line}<div class="pin-bubble" style="transform:translate(${dx}px,${dy}px)">${svg}<span class="pin-name">${escapeHtml(name)}</span></div>`
}

/** 全国地図に、各都市の予報の顔を出す。顔を押すと onCity */
export function JapanMap({ forecasts, onCity, moodLabel }: Props) {
  const { lang, t } = useI18n()
  const holder = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markers = useRef(new Map<CityId, { marker: maplibregl.Marker; el: HTMLButtonElement }>())
  const onCityRef = useRef(onCity)
  useEffect(() => {
    onCityRef.current = onCity
  })
  const [zoom, setZoom] = useState(0)

  useEffect(() => {
    if (!holder.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: holder.current,
      style,
      bounds: MAINLAND,
      fitBoundsOptions: { padding: { top: 48, bottom: 56, left: 24, right: 24 } },
      // 対象範囲（EEZ: 東経122〜158度・北緯17〜48度）に少し余白を足した範囲（のりものレーダーと同じ）
      maxBounds: [
        [114, 12],
        [166, 53],
      ],
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      renderWorldCopies: false,
      cooperativeGestures: false,
    })
    map.touchZoomRotate.disableRotation()
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    mapRef.current = map
    setZoom(map.getZoom())
    map.on('zoom', () => setZoom(map.getZoom()))

    map.on('load', () => {
      fetch('./data/area.json')
        .then((r) => r.json() as Promise<AreaFeature>)
        .then((area) => {
          if (mapRef.current !== map) return
          map.addSource('mask', { type: 'geojson', data: maskOf(area) })
          map.addSource('area', { type: 'geojson', data: area as unknown as GeoJSONSourceSpecification['data'] })
          // 対象範囲（日本の排他的経済水域）の外は白く隠し、境界を破線で示す
          map.addLayer({ id: 'mask', type: 'fill', source: 'mask', paint: { 'fill-color': PALETTE.light.outside, 'fill-antialias': false } })
          map.addLayer({
            id: 'eez-line',
            type: 'line',
            source: 'area',
            layout: { 'line-join': 'round' },
            paint: {
              'line-color': PALETTE.light.eez,
              'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1, 8, 2],
              'line-dasharray': [3, 2],
              'line-opacity': 0.8,
            },
          })
          applyMapTheme(map)
        })
        .catch((e) => console.error('[area]', e))
      // 出典表記は長いので最初はたたむ（ⓘで開ける）
      holder.current?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
    })

    // 配色の切り替え（設定・端末）に合わせる
    const observer = new MutationObserver(() => applyMapTheme(map))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const onMedia = () => applyMapTheme(map)
    media?.addEventListener('change', onMedia)

    const markerMap = markers.current
    return () => {
      observer.disconnect()
      media?.removeEventListener('change', onMedia)
      map.remove()
      mapRef.current = null
      markerMap.clear()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const k = offsetScale(zoom)
    for (const f of forecasts) {
      const city = CITIES.find((c) => c.id === f.city)!
      const [ox, oy] = city.offset
      const label = `${city.name[lang]}: ${moodLabel(f)}`
      let entry = markers.current.get(f.city)
      if (!entry) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'city-pin'
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onCityRef.current(f.city)
        })
        const marker = new maplibregl.Marker({ element: el, anchor: 'top-left' }).setLngLat([city.lng, city.lat]).addTo(map)
        entry = { marker, el }
        markers.current.set(f.city, entry)
      }
      entry.el.setAttribute('aria-label', label)
      entry.el.innerHTML = pinHtml(
        city.name[lang],
        faceSvg(f.mood, 40, f.source === 'estimate', label),
        Math.round(ox * k),
        Math.round(oy * k),
      )
    }
  }, [forecasts, lang, moodLabel, zoom])

  return <div className="japan-map" ref={holder} role="region" aria-label={t('map.aria')} />
}
