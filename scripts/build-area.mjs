// アプリの対象範囲（陸地を含む日本の排他的経済水域）を生成する。範囲外を隠すマスクはこれからブラウザで作る。
// 使い方: node scripts/build-area.mjs <Marine Regions の EEZ GeoJSON>
//   取得例: https://geo.vliz.be/geoserver/MarineRegions/wfs?service=WFS&version=1.0.0&request=GetFeature
//           &typeName=MarineRegions:eez&outputFormat=application/json&propertyName=mrgid,geoname,the_geom
//           &cql_filter=mrgid%20IN%20(8487,48950,48954,48955,21796)
//   8487: 日本の EEZ / 48950: 北方領土 / 48954: 尖閣諸島 / 48955: 竹島（日本が主張する区域。周辺は下の takeshimaZone で補う）
//   21796: 日韓共同開発区域（日韓の中間線より日本側にあり、海上保安庁の領海等概念図では EEZ に含まれる）
//   参考: https://www1.kaiho.mlit.go.jp/ryokai/gainenzu.html（境界未画定の海域は地理的中間線で図示）
// 出力: public/data/area.json
import fs from 'node:fs';
import * as turf from '@turf/turf';

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/build-area.mjs <eez.geojson>');
  process.exit(1);
}
const features = JSON.parse(fs.readFileSync(src, 'utf8')).features;

// 竹島周辺: Marine Regions は竹島のごく近くしか日本側に含めないため、海上保安庁の概念図と同じく
// 竹島と、韓国（鬱陵島を含む）・北朝鮮・ロシアの海岸との中間線までを加える。
// 中間線は、各海岸の代表点とのボロノイ分割で近似する（[緯度, 経度]）
const TAKESHIMA = [37.241, 131.868];
const NEIGHBOR_COASTS = [
  // 鬱陵島・竹嶼
  [37.55, 130.87], [37.47, 130.92], [37.45, 130.8], [37.53, 130.94],
  // 韓国の東海岸
  [35.1, 129.1], [35.5, 129.45], [36.0, 129.57], [36.5, 129.45], [37.0, 129.42], [37.5, 129.12], [38.0, 128.7], [38.6, 128.35],
  // 北朝鮮・ロシアの沿岸
  [39.2, 127.6], [39.9, 128.3], [40.4, 129.2], [40.9, 129.7], [41.6, 129.8], [42.2, 130.3],
  [42.6, 131.2], [42.8, 132.3], [43.1, 133.5], [43.5, 134.5], [44.3, 135.5],
];
function takeshimaZone() {
  // 経度を緯度方向と同じ長さに縮めた平面で分割し、元に戻す
  const k = Math.cos((TAKESHIMA[0] * Math.PI) / 180);
  const pts = [TAKESHIMA, ...NEIGHBOR_COASTS].map(([lat, lon]) => turf.point([lon * k, lat]));
  const cell = turf.voronoi(turf.featureCollection(pts), { bbox: [120 * k, 30, 145 * k, 48] }).features[0];
  cell.geometry.coordinates = cell.geometry.coordinates.map((ring) => ring.map(([x, y]) => [x / k, y]));
  const within200nm = turf.circle([TAKESHIMA[1], TAKESHIMA[0]], 200, { units: 'nauticalmiles', steps: 128 });
  return turf.intersect(turf.featureCollection([cell, within200nm]));
}

const merged = turf.union(turf.featureCollection([...features, takeshimaZone()]));
// 外周だけを残す: 陸地（EEZ では穴になっている）や範囲内の抜けも対象範囲に含める
const polys = merged.geometry.type === 'Polygon' ? [merged.geometry.coordinates] : merged.geometry.coordinates;
const outer = turf.multiPolygon(polys.map((p) => [p[0]]));
const area = turf.simplify(outer, { tolerance: 0.01, highQuality: true });

const roundCoords = (f) => {
  f.geometry.coordinates = JSON.parse(JSON.stringify(f.geometry.coordinates, (_, v) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v)));
  return f;
};
area.properties = { attribution: 'Marine Regions (VLIZ) World EEZ, CC BY 4.0 を加工して作成' };
roundCoords(area);

fs.writeFileSync('public/data/area.json', JSON.stringify(area));
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0);
console.log(`area: ${area.geometry.coordinates.length} polygons, ${kb('public/data/area.json')} KB / bbox ${turf.bbox(area).map((x) => x.toFixed(2)).join(', ')}`);
