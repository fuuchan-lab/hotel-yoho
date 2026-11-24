import * as maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, GeoJSONSourceSpecification, StyleSpecification } from 'maplibre-gl'
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
  /** 日付の帯で選んでいる都市（顔を目立たせる） */
  selected?: CityId | null
}

type LngLat = [number, number]
interface AreaFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: 'MultiPolygon'; coordinates: LngLat[][][] }
}

const SEA = '#bed2ff' // 地理院タイル（淡色地図）の海の色
const PALETTE = {
  light: { sea: SEA, outside: '#ffffff', eez: '#3d6fb6', casing: '#ffffff', text: '#222222', textMuted: '#4a5568', halo: '#ffffff' },
  dark: { sea: '#1a2332', outside: '#0b0f14', eez: '#7fa8e0', casing: '#0b0f14', text: '#e6edf3', textMuted: '#aab4c2', halo: '#0b0f14' },
}

/**
 * 最初に見せる範囲（北海道〜九州）。那覇（沖縄）は、天気予報の地図と同じく左下の囲み（MapPage.tsx）に出す。
 * 沖縄まで入れると縮尺が小さくなり、地理院タイルが出ない縮尺になって、都市の顔も重なるため
 */
const MAINLAND: [LngLat, LngLat] = [
  [129.3, 31.0],
  [145.9, 45.6],
]

/** 新幹線の路線・駅・空港（public/data/rail.json。scripts/build-rail.mjs でのりものレーダーのデータから作る） */
interface RailData {
  lines: { id: string; color: string; name: { ja: string; en: string }; coords: LngLat[] }[]
  stations: { name: { ja: string; en: string }; lng: number; lat: number; major: 0 | 1 }[]
  airports: { name: { ja: string; en: string }; code: string; hub: 0 | 1; lng: number; lat: number }[]
}

// 駅・空港のアイコン（のりものレーダーと同じ絵柄）
const STATION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <rect x="1.5" y="1.5" width="25" height="25" rx="6" fill="#0b1f3a" stroke="#fff" stroke-width="2"/>
  <path d="M5 17.5h13.5c3 0 5-1.1 5-2.4 0-1.2-1.9-2-4.7-2.9l-4.3-1.5c-1.2-.4-2.3-.6-3.5-.6H5z" fill="#fff"/>
  <path d="M7 12.4h3v1.8H7zM11.2 12.4h3v1.8h-3z" fill="#0b1f3a"/>
  <path d="M15.6 12.3l3 1.1c.4.2.2.8-.3.8h-2.7z" fill="#0b1f3a"/>
  <rect x="5" y="19.5" width="18" height="1.6" rx=".8" fill="#fff"/>
</svg>`
const AIRPORT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10.5" fill="#5b6b7f" stroke="#fff" stroke-width="2"/>
  <g transform="translate(12 12) rotate(45) scale(.62) translate(-12 -12)">
    <path fill="#fff" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </g>
</svg>`

/** SVG を、画面の細かさ 2 倍の画像にして地図に登録する */
async function addSvgIcon(map: maplibregl.Map, name: string, svg: string, size: number) {
  if (map.hasImage(name)) return
  const img = new Image(size * 2, size * 2)
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/width="\d+" height="\d+"/, `width="${size * 2}" height="${size * 2}"`))}`
  await img.decode()
  if (!map.hasImage(name)) map.addImage(name, img, { pixelRatio: 2 })
}

/** 空港名の下に改行して 3 文字の空港コード（HND など。のりものレーダーと同じ） */
function airportLabel(lang: 'ja' | 'en'): ExpressionSpecification {
  return ['format', ['get', `name_${lang}`], {}, ['case', ['==', ['get', 'code'], ''], '', ['concat', '\n', ['get', 'code']]], { 'font-scale': 0.9 }]
}

/** 言語を切り替えたら、駅名・空港名も切り替える */
function applyLabelLang(map: maplibregl.Map, lang: 'ja' | 'en') {
  if (map.getLayer('station')) {
    map.setLayoutProperty('station', 'text-field', ['step', ['zoom'], '', 6.2, ['case', ['==', ['get', 'major'], 1], ['get', `name_${lang}`], ''], 7.5, ['get', `name_${lang}`]])
  }
  if (map.getLayer('airport')) {
    map.setLayoutProperty('airport', 'text-field', ['step', ['zoom'], '', 6.2, ['case', ['==', ['get', 'code'], ''], '', airportLabel(lang)], 7.5, airportLabel(lang)])
  }
}

async function addRailLayers(map: maplibregl.Map, rail: RailData, lang: 'ja' | 'en') {
  await Promise.all([addSvgIcon(map, 'station', STATION_ICON, 28), addSvgIcon(map, 'airport', AIRPORT_ICON, 24)])
  map.addSource('lines', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: rail.lines.map((l) => ({ type: 'Feature', properties: { id: l.id, color: l.color }, geometry: { type: 'LineString', coordinates: l.coords } })),
    },
  })
  map.addSource('stations', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: rail.stations.map((s) => ({
        type: 'Feature',
        properties: { name_ja: s.name.ja, name_en: s.name.en, major: s.major },
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      })),
    },
  })
  map.addSource('airports', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: rail.airports.map((a) => ({
        type: 'Feature',
        properties: { name_ja: a.name.ja, name_en: a.name.en, code: a.code, hub: a.hub },
        geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
      })),
    },
  })
  // 新幹線の路線（白い縁取り＋路線の色。のりものレーダーと同じ）
  map.addLayer({
    id: 'line-casing',
    type: 'line',
    source: 'lines',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 4.5, 8, 9, 12, 15] },
  })
  map.addLayer({
    id: 'line-main',
    type: 'line',
    source: 'lines',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': ['get', 'color'], 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 2.5, 8, 6, 12, 10] },
  })
  // 空港: 対象の都市の空の玄関（羽田・伊丹など）は全国表示から、定期便のある空港は少し拡大してから、そのほかの飛行場はさらに拡大してから。
  // 名前とコードは拡大してから
  map.addLayer({
    id: 'airport',
    type: 'symbol',
    source: 'airports',
    layout: {
      'icon-image': ['step', ['zoom'], ['case', ['==', ['get', 'hub'], 1], 'airport', ''], 5.6, ['case', ['==', ['get', 'code'], ''], '', 'airport'], 6.5, 'airport'],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.5, 6, 0.65, 10, 1],
      'icon-allow-overlap': true,
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
      'text-optional': true,
    },
    paint: { 'text-color': PALETTE.light.textMuted, 'text-halo-color': PALETTE.light.halo, 'text-halo-width': 1.5 },
  })
  // 駅: 主要駅（路線の接続駅・対象の都市の駅）は早めに、その他の駅は拡大してから
  map.addLayer({
    id: 'station',
    type: 'symbol',
    source: 'stations',
    layout: {
      'icon-image': ['step', ['zoom'], ['case', ['==', ['get', 'major'], 1], 'station', ''], 6, 'station'],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 4, ['case', ['==', ['get', 'major'], 1], 0.42, 0.3], 6, ['case', ['==', ['get', 'major'], 1], 0.6, 0.45], 10, 0.9],
      'icon-allow-overlap': true,
      'symbol-sort-key': ['-', 1, ['get', 'major']],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 7, 11, 11, 14],
      'text-offset': [0, 1.3],
      'text-anchor': 'top',
      'text-optional': true,
    },
    paint: { 'text-color': PALETTE.light.text, 'text-halo-color': PALETTE.light.halo, 'text-halo-width': 1.5 },
  })
  applyLabelLang(map, lang)
}

maplibregl.setWorkerUrl(workerUrl)

const style: StyleSpecification = {
  version: 8,
  // 駅名・空港名の文字（のりものレーダーと同じ。日本語の文字は端末のフォントで描く）
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    gsi: {
      type: 'raster',
      tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 18,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院 GSI Japan</a>' +
        ' | EEZ: <a href="https://www.marineregions.org" target="_blank" rel="noopener">Marine Regions</a> (CC BY 4.0)' +
        ' | 新幹線・空港: 国土数値情報 MLIT',
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
  if (map.getLayer('line-casing')) map.setPaintProperty('line-casing', 'line-color', c.casing)
  for (const [id, color] of [
    ['station', c.text],
    ['airport', c.textMuted],
  ] as const) {
    if (!map.getLayer(id)) continue
    map.setPaintProperty(id, 'text-color', color)
    map.setPaintProperty(id, 'text-halo-color', c.halo)
  }
}

/** 拡大するほど、顔をずらす量を小さくする（離れて見えるようになるため） */
function offsetScale(zoom: number): number {
  if (zoom <= 4.6) return 1
  if (zoom >= 7) return 0
  return (7 - zoom) / 2.4
}

/**
 * 人口 100 万人に満たない都市は、縮小した全国表示では隠す（顔が多すぎて見にくくなるため）。
 * 選んでいる都市は、いつも出す。那覇は地図の左上の枠に別に出す（MapPage.tsx）
 */
const SMALL_CITY_POP = 100
const SMALL_CITY_MIN_ZOOM = 5.6

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function pinHtml(name: string, svg: string, dx: number, dy: number): string {
  const line =
    dx || dy
      ? `<svg class="pin-line" width="1" height="1" aria-hidden="true"><line x1="0" y1="0" x2="${dx}" y2="${dy}"/></svg><span class="pin-dot"></span>`
      : ''
  return `${line}<div class="pin-bubble" style="transform:translate(${dx}px,${dy}px)">${svg}<span class="pin-name">${escapeHtml(name)}</span></div>`
}

/** 全国地図に、各都市の予報の顔を出す。顔を押すと onCity */
export function JapanMap({ forecasts, onCity, moodLabel, selected = null }: Props) {
  const { lang, t } = useI18n()
  const holder = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markers = useRef(new Map<CityId, { marker: maplibregl.Marker; el: HTMLButtonElement }>())
  const onCityRef = useRef(onCity)
  useEffect(() => {
    onCityRef.current = onCity
  })
  const [zoom, setZoom] = useState(0)
  const langRef = useRef(lang)
  useEffect(() => {
    langRef.current = lang
    if (mapRef.current) applyLabelLang(mapRef.current, lang)
  }, [lang])

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
          return fetch('./data/rail.json').then((r) => r.json() as Promise<RailData>)
        })
        .then((rail) => {
          if (mapRef.current !== map || !rail) return
          return addRailLayers(map, rail, langRef.current).then(() => applyMapTheme(map))
        })
        .catch((e) => console.error('[area/rail]', e))
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
      const hidden = city.pop < SMALL_CITY_POP && zoom < SMALL_CITY_MIN_ZOOM && f.city !== selected
      entry.el.style.display = hidden ? 'none' : ''
      entry.el.setAttribute('aria-label', label)
      entry.el.classList.toggle('selected', f.city === selected)
      entry.marker.getElement().style.zIndex = f.city === selected ? '5' : ''
      entry.el.innerHTML = pinHtml(
        city.name[lang],
        faceSvg(f.mood, 40, f.source === 'estimate', label),
        Math.round(ox * k),
        Math.round(oy * k),
      )
    }
  }, [forecasts, lang, moodLabel, zoom, selected])

  return <div className="japan-map" ref={holder} role="region" aria-label={t('map.aria')} />
}
