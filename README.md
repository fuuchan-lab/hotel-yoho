# ホテル予報 / Hotel Forecast

日本の主要都市（人口 100 万人以上の 12 都市＋千歳・新潟・長野・富山・金沢・静岡・奈良・岡山・熊本・鹿児島・那覇の 23 都市）のホテルの空室・料金の高騰を、天気予報のように約 2 か月先まで予報する Web アプリ（PWA）です。
全国地図に各都市のその日のようすを顔のアイコンで出し、都市を押すと 1 週間の予報が見られます。ライブ・フェス・コンサート・スポーツの大型試合・展示会などの大型イベントをカレンダーに載せています。

LeadLog・海ログと同じ構成です（React + TypeScript + Vite、Google ログイン、Google ドライブ保存、日英切り替え）。地図はのりものレーダーと同じ（MapLibre GL ＋ 地理院タイル、日本の排他的経済水域の外は白）。

## 画面（下のメニュー）

| メニュー | 内容 |
| --- | --- |
| 予報地図 | 2 か月分の日付の帯から日を選ぶと、その日にチェックインして 1 泊の予報を、全国地図に顔で出す。地図の下に都市の一覧。顔を押すと 1 週間の予報・安いホテル 3 軒・予約サイトへのリンク |
| カレンダー | 都市ごとの月のカレンダーに、日ごとの顔とイベント（🎤ライブ 🎪フェス 🎻コンサート 🏟️スポーツ 🏢展示会 🏮祭り・行事） |
| イベント | 大型イベントの一覧。都市・種類で絞り込み、☆で印 |
| ウォッチ | ウォッチリスト。★ の都市（向こう 1 週間の顔）、カレンダー・1 週間の予報で ★ を付けた日と何泊かの予定（前に見た時から顔が変わると「悪化↓・改善↑」、メニューに「！」）、★ のイベント |
| 設定 | アカウント・言語・配色・お気に入りの都市・データの状況・ヘルプ・プライバシーポリシー・応援（PayPal） |

## 顔（5 段階）

0 空室多・お得（緑の満面の笑顔）／1 空室あり／2 ふつう／3 少なめ・高め／4 満室近く・高騰（赤い困った顔）。縁が点線の顔は推定。

## 予報のしくみ（`src/forecast.ts`）

- **実データ**: 中継サーバー（`worker/`）が楽天トラベルの空室検索 API（VacantHotelSearch）で、各都市の中心部（半径 3km）・日付ごとに、空室のあるホテルの数（`pagingInfo.recordCount`）と、安い順 30 軒の料金（大人 1 人・1 泊）の中央値を集める。
  料金はその都市の「ふだん」（観測した中央値のゆっくり動く平均 `ref`）と、空室数はその都市の上位 10% の日と比べて点数にし、顔にする。観測が 3 日より古ければ推定に戻す。
- **推定**: 曜日（土曜・休前日 +2、金曜 +1、休日の夜 −1）、時期（年末年始・お盆・GW・桜・京都の紅葉 +、1 月の閑散期 −）、大型イベント（規模の重み・都市のホテルの多さで割る・重なりは最大＋α・1 週間を超えるものは弱く）、近くの都市の大きなイベント、都市ごとの混みやすさ。
- じゃらん・Yahoo!トラベルは、自動で情報を集めることが利用規約で認められていないため（じゃらん Web サービスは新規の受付をしていない、Yahoo!トラベルは公開 API なし）、予約サイトへのリンクだけ。

## 中継サーバー（`worker/`、Cloudflare Workers 無料プラン）

- 5 分ごと（cron）に 24 件ずつ検索（1 秒に 1 回まで）。直近 1 週間を毎回 5 件優先し、23 都市 × 61 日を約 6 時間で一巡。
- 観測は KV（`HOTEL`）のキー `state` に 1 つの JSON で保存（書き込みは 1 日約 290 回で無料枠の 1,000 回に収まる）。1 日 1 回 `hist:YYYY-MM-DD` に、その日の予報を残す（あとで精度を確かめ、季節ごとの「ふだん」を学ぶため）。
- `GET /forecast`（全都市の要約）、`GET /city?id=tokyo`（日ごとの安いホテル 3 軒）、`GET /status`（集め具合）。5 分キャッシュ。
- 楽天ウェブサービスのアプリ ID・アクセスキーは secret（利用者には求めない）。

### 楽天ウェブサービスの準備（作者が 1 回だけ）

1. https://webservice.rakuten.co.jp/ でアプリを登録し、アプリ ID とアクセスキーを受け取る（許可するWebサイトに `https://hotel-yoho.doitmyself.net/` を入れる）
2. `cd worker && npx wrangler secret put RAKUTEN_APP_ID` と `npx wrangler secret put RAKUTEN_ACCESS_KEY`
3. `npx wrangler deploy`
4. `https://hotel-yoho.shinkansen-location-live.workers.dev/status` で `configured: true` と集め具合を確かめる

楽天の API の URL・版が変わったら、`wrangler.toml` の `[vars]` に `RAKUTEN_ENDPOINT`・`RAKUTEN_VERSION` を入れて差し替える（既定は `https://openapi.rakuten.co.jp/engine/api/Travel` と `20170426`）。
楽天ウェブサービスの規約により、画面に「Supported by Rakuten Developers」を表示している（設定・ヘルプ）。

## イベント（`public/data/events.json`）

各会場・主催者の発表で日程を確かめたものだけを載せる。`scripts/events_src.py` で作った（出典 URL つき）。追加・修正は JSON を直接直すか、スクリプトを直して作り直す。
形式: `{ id, city, start, end, venue{ja,en}, title{ja,en}, category: live|fes|concert|sports|expo|festival, scale: 1|2|3, url }`

## Google ドライブのフォルダー（HotelYoho）

| ファイル | 内容 |
| --- | --- |
| `prefs.json` | 言語・配色・お気に入りの都市・カレンダーで最初に開く都市・ウォッチする日（`trips`。前に見た時の顔 `seen` つき）・印を付けたイベント（全端末で共通。新しく変えたほうを残す） |

## 開発

```sh
npm install
npm run dev      # 開発サーバー
npm test         # テスト（node --test。worker のテストも）
npm run lint     # oxlint
npm run build    # dist/ に出力
```

`main` に push すると GitHub Actions で GitHub Pages に公開します（`.github/workflows/deploy.yml`）。
公開先: https://hotel-yoho.doitmyself.net/ （GitHub Pages ＋ Value-Domain の CNAME。`public/CNAME`）
- Value-Domain で CNAME `hotel-yoho` → `fuuchan-lab.github.io` を設定する
- GitHub の Settings → Pages の「Custom domain」に `hotel-yoho.doitmyself.net` が入り、「Enforce HTTPS」をオンにする

### Google ログイン

当面は LeadLog と同じ OAuth クライアントを使います（承認済みの JavaScript 生成元に `https://fuuchan-lab.github.io` が登録済み。ログイン画面のアプリ名は「LeadLog」と出ます）。
`https://hotel-yoho.doitmyself.net` で Google ログインを使うには、その OAuth クライアントの「承認済みの JavaScript 生成元」に `https://hotel-yoho.doitmyself.net` を追加してください。専用にする場合は、Google Cloud で OAuth クライアント（Web）を作り、Drive API を有効にして、リポジトリの Variables に `VITE_GOOGLE_CLIENT_ID` を入れてください。

### 地図の範囲

`public/data/area.json` は、のりものレーダーと同じ日本の排他的経済水域（陸地を含む。Marine Regions の EEZ を `scripts/build-area.mjs` で加工）。

### 注意

予報は目安です。実際の空室・料金は予約サイトで確かめてください。
