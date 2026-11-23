// アプリのアイコンを art/icon-source.png（ChatGPT で作った絵）から作る。Playwright（playwright-core）と Chromium が要る
// 使い方: node scripts/build-icons-maskable.mjs public （art/icon-source.png を icon-src.png としてカレントに置いて実行）
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const pub = process.argv[2]
const src = 'data:image/png;base64,' + fs.readFileSync('icon-src.png').toString('base64')
const exe = 'C:/Users/user/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'
const browser = await chromium.launch({ executablePath: exe })
const page = await browser.newPage()
// Android の丸い切り抜きでも太陽まで入るよう、絵を 80% に縮め、まわりは同じ絵をぼかして広げたもので埋める
async function maskable(size, file) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0"><div style="position:relative;width:${size}px;height:${size}px;overflow:hidden;background:radial-gradient(circle at 50% 45%, #1a6cf0 0%, #0a3cc4 55%, #06217a 100%)">
    
    <img src="${src}" style="position:absolute;width:84%;height:84%;left:8%;top:8%;clip-path:inset(0.6% round 17%)">
  </div></body></html>`)
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${pub}/${file}` })
}
async function rounded(size, file) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:transparent"><img src="${src}" style="width:${size}px;height:${size}px;display:block;clip-path:inset(0.6% round 17%)"></body></html>`)
  await page.waitForTimeout(150)
  await page.screenshot({ path: `${pub}/${file}`, omitBackground: true })
}
await maskable(512, 'icon-maskable-512.png')
await rounded(16, 'favicon-16.png')
await rounded(32, 'favicon-32.png')
await rounded(48, 'favicon-48.tmp.png')
// favicon.ico（16・32・48 の PNG をまとめる）
const pngs = ['favicon-16.png', 'favicon-32.png', 'favicon-48.tmp.png'].map((f) => fs.readFileSync(`${pub}/${f}`))
const sizes = [16, 32, 48]
const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4)
let offset = 6 + 16 * pngs.length
const entries = pngs.map((p, i) => {
  const e = Buffer.alloc(16)
  e.writeUInt8(sizes[i] % 256, 0); e.writeUInt8(sizes[i] % 256, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3)
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(p.length, 8); e.writeUInt32LE(offset, 12)
  offset += p.length
  return e
})
fs.writeFileSync(`${pub}/favicon.ico`, Buffer.concat([header, ...entries, ...pngs]))
fs.unlinkSync(`${pub}/favicon-48.tmp.png`)
await browser.close()
