// public/.well-known/assetlinks.json に、アプリ（Android）の署名鍵の SHA-256 を足す。すでにある項目は壊さない（重複は足さない）。
// 使い方: node scripts/add-assetlinks.mjs <パッケージ名> <SHA-256> [<SHA-256> ...] [--file <assetlinks.json>]
//   例: node scripts/add-assetlinks.mjs net.doitmyself.hotelyoho.paid FE:14:25:...:5A:0E
// パッケージの項目がなければ作る。足したあとの差分は git diff で確かめてから、コミット・公開する
import fs from 'node:fs'

const args = process.argv.slice(2)
let file = new URL('../public/.well-known/assetlinks.json', import.meta.url)
const fi = args.indexOf('--file')
if (fi >= 0) {
  file = args[fi + 1]
  args.splice(fi, 2)
}
const [pkg, ...shas] = args
const SHA = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/
if (!pkg || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(pkg) || shas.length === 0) {
  console.error('使い方: node scripts/add-assetlinks.mjs <パッケージ名> <SHA-256> [<SHA-256> ...]')
  process.exit(1)
}
const fingerprints = shas.map((s) => s.trim().toUpperCase().replace(/\s+/g, ''))
for (const s of fingerprints) {
  if (!SHA.test(s)) {
    console.error(`SHA-256 の形式が違います（AA:BB:… の 32 組）: ${s}`)
    process.exit(1)
  }
}

const statements = JSON.parse(fs.readFileSync(file, 'utf8'))
if (!Array.isArray(statements)) throw new Error('assetlinks.json は配列のはずです')

let item = statements.find((st) => st?.target?.namespace === 'android_app' && st.target.package_name === pkg)
if (!item) {
  item = {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: pkg, sha256_cert_fingerprints: [] },
  }
  statements.push(item)
}
const list = (item.target.sha256_cert_fingerprints ??= [])
const added = fingerprints.filter((s) => !list.includes(s))
list.push(...added)

// 既存のファイルの書式（relation は 1 行、フィンガープリントは 1 行ずつ）をそろえて書く
const q = JSON.stringify
const out =
  '[\n' +
  statements
    .map((st) => {
      const t = st.target
      const fps = t.sha256_cert_fingerprints.map((s) => `        ${q(s)}`).join(',\n')
      return [
        '  {',
        `    "relation": [${st.relation.map(q).join(', ')}],`,
        '    "target": {',
        `      "namespace": ${q(t.namespace)},`,
        `      "package_name": ${q(t.package_name)},`,
        '      "sha256_cert_fingerprints": [',
        fps,
        '      ]',
        '    }',
        '  }',
      ].join('\n')
    })
    .join(',\n') +
  '\n]\n'
fs.writeFileSync(file, out)
console.log(added.length ? `${pkg} に ${added.length} 件を追加しました。git diff で確かめてください。` : `${pkg} には、すでに入っています（変更なし）。`)
