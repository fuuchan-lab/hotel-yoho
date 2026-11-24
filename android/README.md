# ホテル予報 Android（Play Store 用 TWA パッケージ）

海ログ・のりものレーダーと同じく、Bubblewrap で作った Trusted Web Activity。アプリ本体は https://hotel-yoho.doitmyself.net/ の PWA で、
サイトを更新すれば、Android アプリも自動で最新になる（Play への再提出は不要）。

## 作り直し（Windows / PowerShell）
```powershell
$env:JAVA_HOME = "C:\Users\user\.bubblewrap\jdk-17.0.20.1+1"
$env:Path = "$env:JAVA_HOME\bin;C:\Program Files\nodejs;C:\Users\user\HotelYoho\android;$env:Path"   # android を PATH に足すのは gradlew.bat を見つけさせるため
$pw = (Get-Content C:\Users\user\.bubblewrap\keys\hotelyoho-keystore-password.txt -Raw).Trim()
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = $pw; $env:BUBBLEWRAP_KEY_PASSWORD = $pw
cd C:\Users\user\HotelYoho\android
# 新しい版を出す時は twa-manifest.json の appVersionCode を 1 つ増やす（appVersionName は自由）
C:\Users\user\.bubblewrap\cli\node_modules\.bin\bubblewrap.cmd update --skipVersionUpgrade
C:\Users\user\.bubblewrap\cli\node_modules\.bin\bubblewrap.cmd build --skipPwaValidation      # → app-release-bundle.aab（Play にアップロード） / app-release-signed.apk（実機テスト）
```

## 署名鍵（アップロード鍵）
- ファイル: `C:\Users\user\.bubblewrap\keys\hotelyoho-upload.keystore`（別名 hotelyoho）、パスワードは同じフォルダーの `hotelyoho-keystore-password.txt`
- **この2つは Git に入れない。必ず別の場所にもバックアップする**（紛失すると更新を出せなくなる）
- Play アプリ署名を使うので、配布用の本当の署名鍵は Google が管理する。この鍵は「アップロード用」
- SHA-256: FE:14:25:C8:A2:5D:E1:28:91:0E:CB:2E:72:C0:37:64:33:7F:2E:4E:14:28:97:DC:2B:82:4D:4B:8A:FB:5A:0E

## サイトとの紐づけ（Digital Asset Links）
`public/.well-known/assetlinks.json` に、上のアップロード鍵の SHA-256 が入っている（実機に APK を直接入れて試す時に必要）。
Play に上げた後は、Play Console の「アプリの完全性 → アプリの署名」に表示される
**アプリ署名鍵の SHA-256** を、同じ配列に追加して再デプロイする（これが無いとアドレスバーが出てしまう）。
`/.well-known/` と `help.html`・`privacy.html` は、Service Worker がアプリの画面に差し替えないよう `vite.config.ts` の `navigateFallbackDenylist` で除外している。

## アプリの中だけの違い
- 起動した最初の読み込みで referrer が `android-app://` になるのを見て、アプリの中だと判定する（`index.html` の先頭のスクリプト）。
  判定は sessionStorage に覚え、ヘルプ（`public/help.html`）も同じ印を見る。
- アプリの中では、寄付（PayPal）への案内を出さない（Google Play の決済の決まりのため。`.in-app .donate-part`）。
- じゃらんへの予約のリンク（A8.net のアフィリエイト）はそのまま出す（デジタル商品の販売ではないため）。Play Console の「広告」は「あり」と申告する。

## Play Store 掲載用
`store/` に掲載文（listing-ja.md）、フィーチャーグラフィック、アイコン、スクリーンショットがある。
プライバシーポリシーは `public/privacy.html`（https://hotel-yoho.doitmyself.net/privacy.html ）。

## 公開までの流れ（個人の開発者アカウント）
1. Play Console でアプリを作成し、`app-release-bundle.aab` を「クローズドテスト」に上げる
2. 2023年11月以降に作った個人アカウントは、製品版の前に **12 人以上のテスターで 14 日間** のクローズドテストが必要
3. アプリ署名鍵の SHA-256 を `assetlinks.json` に足して公開する
4. 期間が過ぎたら、製品版の申請をする
