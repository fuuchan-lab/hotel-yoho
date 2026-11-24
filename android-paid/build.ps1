# ホテル予報（有料版）の署名済み AAB を作る
# 使い方（自分の PowerShell で）: powershell -ExecutionPolicy Bypass -File C:\Users\user\HotelYoho\android-paid\build.ps1
# パスワードは、この画面で直接入力する。ファイル・スクリプト・ログ・履歴には書かない（ビルドの間だけ、このプロセスのメモリに置く）
# 新しい版を出す時は twa-manifest.json の appVersionCode を 1 つ増やしてから実行する
# keytool・bubblewrap は、進行状況や警告を「エラー出力」に書く。Stop にすると、それだけで止まってしまう（NativeCommandError）ので Continue にして、成否は終了コード（$LASTEXITCODE）で判断する
$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$store = "C:\Users\user\.bubblewrap\keys\hotelyoho-paid-upload.keystore"
if (-not (Test-Path $store)) { throw "キーストアがありません。先に make-keystore.ps1 を実行してください: $store" }

function Read-Secret($prompt) {
  $s = Read-Host $prompt -AsSecureString
  $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}

try {
  $env:JAVA_HOME = "C:\Users\user\.bubblewrap\jdk-17.0.20.1+1"
  $env:Path = "$env:JAVA_HOME\bin;C:\Program Files\nodejs;$here;" + $env:Path   # android-paid を PATH に足すのは gradlew.bat を見つけさせるため
  $pw = Read-Secret "キーストアのパスワード（キーのパスワードも同じ）"
  $env:BUBBLEWRAP_KEYSTORE_PASSWORD = $pw
  $env:BUBBLEWRAP_KEY_PASSWORD = $pw
  Set-Location $here
  $bw = "C:\Users\user\.bubblewrap\cli\node_modules\.bin\bubblewrap.cmd"
  & $bw update --skipVersionUpgrade
  if ($LASTEXITCODE -ne 0) { throw "update に失敗しました" }
  & $bw build --skipPwaValidation
  if ($LASTEXITCODE -ne 0) { throw "build に失敗しました（パスワードが違う可能性）" }
  $aab = Join-Path $here "app-release-bundle.aab"
  Write-Host ""
  Write-Host "AAB     : $aab ($([math]::Round((Get-Item $aab).Length / 1MB, 1)) MB)  ← Play Console にアップロードするファイル"
  Write-Host "テスト用: $(Join-Path $here 'app-release-signed.apk')  ← 実機に入れて試す用"
} finally {
  $env:BUBBLEWRAP_KEYSTORE_PASSWORD = $null
  $env:BUBBLEWRAP_KEY_PASSWORD = $null
  $pw = $null
}
