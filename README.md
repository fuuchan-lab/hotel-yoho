# ホテル予報 / Hotel Forecast

日本の主要都市（すべての県庁所在地・人口 50 万人以上の都市＋千歳・函館・松本・鈴鹿・伊勢の 61 都市）のホテルの空室・料金の高騰を、天気予報のように約 3 か月先まで予報する Web アプリ（PWA）です。
全国地図に各都市のその日のようすを顔のアイコンで出し、都市を押すと 1 週間の予報が見られます。ライブ・フェス・コンサート・スポーツの大型試合・展示会などの大型イベントをカレンダーに載せています。

LeadLog・海ログと同じ構成です（React + TypeScript + Vite、Google ログイン、Google ドライブ保存、日英切り替え）。地図はのりものレーダーと同じ（MapLibre GL ＋ 地理院タイル、日本の排他的経済水域の外は白）。

## 画面（下のメニュー）

| メニュー | 内容 |
| --- | --- |
| 予報地図 | 3 か月分の日付の帯から日を選ぶと、その日にチェックインして 1 泊の予報を、全国地図に顔で出す。地図の下に都市の一覧。顔を押すと 1 週間の予報・安いホテル 3 軒・じゃらんへの予約のリンク（その日・1 泊・大人 1 人で開く。A8.net のアフィリエイト、「PR」表示） |
| カレンダー | 都市ごとの月のカレンダーに、日ごとの顔とイベント（🎤ライブ 🎪フェス 🎻コンサート 🏟️スポーツ 🏢展示会 🏮祭り・行事） |
| イベント | 大型イベントの一覧。都市・種類で絞り込み、☆で印 |
| ウォッチ | ウォッチリスト。★ の都市（向こう 1 週間の顔）、カレンダー・1 週間の予報で ★ を付けた日と何泊かの予定（前に見た時から顔が変わると「悪化↓・改善↑」、メニューに「！」）、★ のイベント |
| 設定 | アカウント・言語・配色・お気に入りの都市・データの状況・ヘルプ・プライバシーポリシー・応援（PayPal） |

## 顔（5 段階）

0 空室多・お得（緑の満面の笑顔）／1 空室あり／2 ふつう／3 少なめ・高め／4 満室近く・高騰（赤い困った顔）。縁が点線の顔は推定。

## 予報のしくみ（`src/forecast.ts`）

- **実データ（live）**: 楽天トラベルの空室検索 API（VacantHotelSearch）で、各都市の中心部（半径 3km）・日付ごとに、空室のあるホテルの数と、安い順 30 軒の料金（大人 1 人・1 泊）を調べる。料金の中央値をその都市の「ふだん」（`ref`）と、空室数をその都市の空室の多い日（上位 10%）と比べて顔にする。観測が 3 日より古ければ推定に戻す。
- **推定（estimate、顔の縁が点線）**: 観光庁「宿泊旅行統計調査」2025 年の確定値（第 8 表）の、都道府県・月ごとのシティホテルとビジネスホテルの客室稼働率の平均（`src/occupancy.ts`）を土台に、都市の性格（`kind`）ごとの曜日・連休、時期、大型イベントを足し引きして、その夜の稼働率の目安（%）を出す。66%・76%・85%・92% を境に 5 段階。
- **料金の水準の推移のグラフ**（`TrendChart.tsx`）: ふだん = 100 の指数（金額は出さない）。実データの日は 料金の中央値 ÷ ふだんの料金、推定の日は 稼働率の目安 ÷ 年平均の稼働率。前後 7 日の平均で傾向を出す。
- 予約のリンクはじゃらんだけ（自動で情報を集めることは規約で認められていないので、リンクだけ）。A8.net のアフィリエイト（`src/booking.ts`）。

## 実データを、だれのキーで見るか（`src/access.ts`）

作者のキー 1 つに利用が集まると、楽天の回数の制限（1 秒に 1 回）で止まるので、長く安定して動かすために分けている。

| 区分 | 条件 | 見られるもの |
| --- | --- | --- |
| guest | ログインしていない | 推定だけ |
| trial | ログインして最初の 7 日間（`prefs.trialStart` から） | 中継サーバーが作者のキーで集めた、共有のデータ（`/forecast`・`/city`） |
| expired | お試しが終わり、キーを登録していない | 推定だけ |
| own | 設定で自分の楽天ウェブサービスのキーを登録した | 見ている都市・日付を、自分のキーで端末から楽天に直接問い合わせる（`src/ownData.ts`。1 秒に 1 件、6 時間は端末に覚える）。比べる基準だけ中継サーバーの `/baseline` を使う |

- キー（`prefs.rakuten`）は、利用者の端末と利用者自身の Google ドライブ（prefs.json）にだけ保存し、楽天の API にだけ送る。
- お試しの開始日は利用者の prefs.json に持つので、厳密な制限ではない（ドライブのファイルを消せばやり直せる）。
- キーの取り方は、ヘルプの「楽天トラベルの実データと、キーの登録」。

## 中継サーバー（`worker/`、Cloudflare Workers 無料プラン）

- 5 分ごと（cron）に 40 件ずつ検索（1 秒に 1 回まで）。直近 1 週間を毎回 8 件優先し、61 都市 × 92 日を約 15 時間で一巡。
- いまの観測は KV（`HOTEL`）のキー `state` に 1 つの JSON で保存（書き込みは 1 日約 290 回）。
- **集めた観測は 1 つも捨てない**: 1 時間ごとに `log:YYYY-MM-DDTHH` に書き出して残す（1 日 24 回の書き込み）。1 行が 1 回の観測で、列は `city, checkin, v（空室のあるホテル数）, n（料金の分かった軒数）, lo, q1, p（中央値）, q3, hi`。`node scripts/fetch-logs.mjs` で手元（`data/logs/`）に保存できる。予約の進み方・季節ごとの「ふだん」を、あとで学ぶためのもの。
- `GET /forecast`（全都市の要約）、`/city?id=tokyo`（安いホテル 3 軒。向こう 14 日）、`/baseline`（都市ごとのふだんの料金・空室）、`/status`（集め具合）、`/logs?prefix=`・`/log?key=`（記録）。
- 楽天ウェブサービスのアプリ ID・アクセスキーは secret。

### 楽天ウェブサービスの準備（作者が 1 回だけ）

1. https://webservice.rakuten.co.jp/ でアプリを登録し、アプリ ID とアクセスキーを受け取る（許可するWebサイトに `hotel-yoho.doitmyself.net` を入れる）
2. `cd worker && npx wrangler secret put RAKUTEN_APP_ID` と `npx wrangler secret put RAKUTEN_ACCESS_KEY`
3. `npx wrangler deploy`
4. `https://hotel-yoho.shinkansen-location-live.workers.dev/status` で `configured: true` と集め具合を確かめる

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
