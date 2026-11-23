// アプリのアイコンを art/icon-source.png（ChatGPT で作った絵）から作る。Playwright（playwright-core）と Chromium が要る
// 使い方: node scripts/build-icons-rounded.mjs public （art/icon-source.png を icon-src.png としてカレントに置いて実行）
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const pub = process.argv[2]
const src = 'data:image/png;base64,' + fs.readFileSync('icon-src.png').toString('base64')
const exe = 'C:/Users/user/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'
const browser = await chromium.launch({ executablePath: exe })
const page = await browser.newPage()
// rounded: 角の黒を透明に（角丸で切り抜く）。full: 角まで絵で埋める（中央を拡大して角の黒を外に出す）
async function render(size, file, mode) {
  await page.setViewportSize({ width: size, height: size })
  const css = mode === 'rounded'
    ? `width:${size}px;height:${size}px;border-radius:17%;overflow:hidden;clip-path:inset(0.6% round 17%)`
    : `width:${size}px;height:${size}px;overflow:hidden`
  const img = mode === 'rounded'
    ? `<img src="${src}" style="width:100%;height:100%;display:block">`
    : `<img src="${src}" style="width:124%;height:124%;margin:-12% 0 0 -12%;display:block">`
  await page.setContent(`<html><body style="margin:0;background:transparent"><div style="${css}">${img}</div></body></html>`)
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${pub}/${file}`, omitBackground: true })
}
await render(512, 'icon-512.png', 'rounded')
await render(192, 'icon-192.png', 'rounded')
await render(32, 'favicon-32.png', 'rounded')
await render(512, 'icon-maskable-512.png', 'full')
await render(180, 'apple-touch-icon.png', 'full')
await render(64, 'icon-64.tmp.png', 'rounded')
const b64 = fs.readFileSync(`${pub}/icon-64.tmp.png`).toString('base64')
fs.unlinkSync(`${pub}/icon-64.tmp.png`)
fs.writeFileSync(`${pub}/icon.svg`, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64" height="64" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,${b64}"/></svg>\n`)
await browser.close()
