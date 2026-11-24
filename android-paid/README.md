# ホテル予報 Android 有料版（Play Store 用 TWA パッケージ）

パッケージ名 `net.doitmyself.hotelyoho.paid`。無料版（`../android`、`net.doitmyself.hotelyoho`）と同じ Web アプリ（https://hotel-yoho.doitmyself.net/ の PWA）を、別のパッケージ名で出す。
サイトを更新すれば、アプリの中身も自動で新しくなる（Play への再提出は不要）。

## 手順（自分の PowerShell で。パスワードは画面で直接入力する）

1. **署名鍵を作る**（初回だけ）
   ```powershell
   powershell -ExecutionPolicy Bypass -File C:\Users\user\HotelYoho\android-paid\make-keystore.ps1
   ```
   パスワードを 2 回入力すると、キーストアができ、**SHA-256** が表示される。
2. **サイトとの紐づけに SHA-256 を足す**（assetlinks.json）
   ```powershell
   cd C:\Users\user\HotelYoho
   node scripts/add-assetlinks.mjs net.doitmyself.hotelyoho.paid <表示された SHA-256>
   git diff public/.well-known/assetlinks.json     # 差分を確かめてから、コミット・公開する
   ```
3. **AAB を作る**
   ```powershell
   powershell -ExecutionPolicy Bypass -File C:\Users\user\HotelYoho\android-paid\build.ps1
   ```
   できるもの: `app-release-bundle.aab`（Play Console にアップロード）、`app-release-signed.apk`（実機テスト用）。
4. **Play Console にアップロード**（クローズドテスト）。
5. **アプリ署名鍵の SHA-256 を足す**: Play Console の「アプリの完全性」→「アプリの署名」にある「アプリ署名鍵の証明書」の SHA-256 を、2 と同じコマンドで足して、公開する。これがないと、アプリの上にアドレスバーが出る。
   ```powershell
   node scripts/add-assetlinks.mjs net.doitmyself.hotelyoho.paid <Play のアプリ署名鍵の SHA-256>
   ```
   （同じパッケージに 2 つ目の値として足される。すでにある値・ほかのパッケージの項目は変わらない）

## 署名鍵
- ファイル: `C:\Users\user\.bubblewrap\keys\hotelyoho-paid-upload.keystore`（別名 `hotelyoho-paid`）。**Git に入れない**（`.gitignore` の `*.keystore`）。
- **紛失するとアップデートを出せなくなる。** キーストアのファイルを別の場所（USB・別の PC・クラウドの保管庫など）にもバックアップし、パスワードは別にパスワード管理ツールなどに控える。
- パスワードは、どのファイル・スクリプト・ログにも書かない（スクリプトは実行中のメモリにだけ置き、終わったら消す）。
- Play アプリ署名を使うので、配布用の本当の署名鍵は Google が管理する。この鍵は「アップロード用」。

## 新しい版を出す時
`twa-manifest.json` の `appVersionCode` を 1 つ増やして（`appVersionName` は自由）、`build.ps1` を実行する。

## 無料版との違い
- パッケージ名と署名鍵だけ。アプリの中身（Web アプリ）は同じ。
- アプリの中では、寄付（PayPal）への案内を出さない（`index.html` の `android-app://` の判定。無料版と同じ）。
