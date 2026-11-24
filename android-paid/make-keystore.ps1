# ホテル予報（有料版）の署名キー（アップロード鍵）を作り、SHA-256 を表示する
# 使い方（自分の PowerShell で）: powershell -ExecutionPolicy Bypass -File C:\Users\user\HotelYoho\android-paid\make-keystore.ps1
# パスワードは、この画面で直接入力する。ファイル・スクリプト・ログ・履歴には書かない（実行中のこのプロセスのメモリにだけ置き、終わったら消す）
# keytool・bubblewrap は、進行状況や警告を「エラー出力」に書く。Stop にすると、それだけで止まってしまう（NativeCommandError）ので Continue にして、成否は終了コード（$LASTEXITCODE）で判断する
$ErrorActionPreference = "Continue"
$keytool = "C:\Users\user\.bubblewrap\jdk-17.0.20.1+1\bin\keytool.exe"
$store = "C:\Users\user\.bubblewrap\keys\hotelyoho-paid-upload.keystore"
$alias = "hotelyoho-paid"

function Read-Secret($prompt) {
  $s = Read-Host $prompt -AsSecureString
  $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}

try {
  if (Test-Path $store) {
    Write-Host "キーストアはすでにあります: $store"
    $pw = Read-Secret "キーストアのパスワード"
  } else {
    Write-Host "新しいキーストアを作ります: $store"
    $pw = Read-Secret "新しいパスワード（6文字以上。キーのパスワードも同じにします）"
    $pw2 = Read-Secret "もう一度"
    if ($pw -ne $pw2) { throw "パスワードが一致しません" }
    if ($pw.Length -lt 6) { throw "パスワードは 6 文字以上にしてください" }
    $env:HOTELYOHO_PAID_KS = $pw
    & $keytool -genkeypair -keystore $store -alias $alias -keyalg RSA -keysize 2048 -validity 10000 `
      -dname "CN=fuuchan-lab, O=doitmyself.net, C=JP" "-storepass:env" HOTELYOHO_PAID_KS "-keypass:env" HOTELYOHO_PAID_KS
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $store)) { throw "キーストアを作れませんでした" }
    Write-Host "作りました。"
  }
  $env:HOTELYOHO_PAID_KS = $pw
  $lines = & $keytool -list -v -keystore $store -alias $alias "-storepass:env" HOTELYOHO_PAID_KS
  if ($LASTEXITCODE -ne 0) { throw "キーストアを開けません（パスワードが違う可能性）" }
  $sha = ($lines | Select-String "SHA256:").Line.Trim() -replace "^SHA256:\s*", ""
  Write-Host ""
  Write-Host "キーストア : $store"
  Write-Host "別名       : $alias"
  Write-Host "SHA-256    : $sha"
  Write-Host ""
  Write-Host "次の手順:  cd C:\Users\user\HotelYoho"
  Write-Host "           node scripts/add-assetlinks.mjs net.doitmyself.hotelyoho.paid $sha"
  Write-Host ""
  Write-Host "【重要】キーストアは紛失するとアップデートできなくなります。次のファイルを、別の場所（USB・別の PC・クラウドの保管庫など）にもバックアップしてください:"
  Write-Host "  $store"
  Write-Host "パスワードも、パスワード管理ツールなどに別に控えてください（このファイルには入っていません）。"
} finally {
  $env:HOTELYOHO_PAID_KS = $null
  $pw = $null; $pw2 = $null
}
