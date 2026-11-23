import json, sys

TD12 = "https://www.tokyo-dome.co.jp/system/files?file=facilities/dome/event/pdf/2026/domeevent_202612.pdf"
TD = "https://live-events.a-jp.org/soko/plc/14.html"
TDS = "https://www.tokyo-dome.co.jp/dome/event/schedule.html"
KD = "https://www.kyoceradome-osaka.jp/event/"
VD = "https://live-events.a-jp.org/soko/plc/44.html"
PP = "https://live-events.a-jp.org/soko/plc/38.html"
BRUNO = "https://realsound.jp/2026/06/post-2436387.html/amp"
OJH = "https://live-events.a-jp.org/soko/plc/78.html"
OJH_OFF = "https://www.osaka-johall.com/event/"
KA = "https://live-events.a-jp.org/soko/plc/694.html"
YA = "https://live-events.a-jp.org/soko/plc/63.html"
PIA = "https://live-events.a-jp.org/soko/plc/603.html"
IG = "https://live-events.a-jp.org/soko/plc/763.html"
GAISHI = "https://live-events.a-jp.org/soko/plc/70.html"
PM = "https://live-events.a-jp.org/soko/plc/383.html"
MM = "https://live-events.a-jp.org/soko/plc/71.html"
BUDO = "https://live-events.a-jp.org/soko/plc/87.html"
ARIAKE = "https://live-events.a-jp.org/soko/plc/663.html"
YOYOGI = "https://live-events.a-jp.org/soko/plc/84.html"
TGT = "https://live-events.a-jp.org/soko/plc/608.html"
GRANDI = "https://live-events.a-jp.org/soko/plc/75.html"
XEBIO = "https://live-events.a-jp.org/soko/plc/212.html"
HGA = "https://live-events.a-jp.org/soko/plc/79.html"
GLION = "https://live-events.a-jp.org/soko/plc/748.html"
KITAERU = "https://live-events.a-jp.org/soko/plc/76.html"
MESSE = "https://www.m-messe.co.jp/event/"
HATSU = "https://tabi-mag.jp/hatsumoude-best20/"

V = {
 "tdome": ("東京ドーム", "Tokyo Dome"),
 "kdome": ("京セラドーム大阪", "Kyocera Dome Osaka"),
 "vdome": ("バンテリンドーム ナゴヤ", "Vantelin Dome Nagoya"),
 "ppdome": ("みずほPayPayドーム福岡", "Mizuho PayPay Dome Fukuoka"),
 "sdome": ("大和ハウス プレミストドーム（札幌ドーム）", "Daiwa House Premist Dome (Sapporo Dome)"),
 "belluna": ("ベルーナドーム", "Belluna Dome"),
 "ojh": ("大阪城ホール", "Osaka-Jo Hall"),
 "karena": ("Kアリーナ横浜", "K-Arena Yokohama"),
 "yarena": ("横浜アリーナ", "Yokohama Arena"),
 "pia": ("ぴあアリーナMM", "PIA Arena MM"),
 "ig": ("IGアリーナ", "IG Arena"),
 "gaishi": ("日本ガイシホール", "Nippon Gaishi Hall"),
 "pm": ("ポートメッセなごや", "Port Messe Nagoya"),
 "mm": ("マリンメッセ福岡", "Marine Messe Fukuoka"),
 "budo": ("日本武道館", "Nippon Budokan"),
 "ariake": ("有明アリーナ", "Ariake Arena"),
 "yoyogi": ("国立代々木競技場 第一体育館", "Yoyogi National Gymnasium"),
 "tgt": ("東京ガーデンシアター", "Tokyo Garden Theater"),
 "grandi": ("セキスイハイムスーパーアリーナ（グランディ・21）", "Sekisui Heim Super Arena (Grandi 21)"),
 "xebio": ("ゼビオアリーナ仙台", "Xebio Arena Sendai"),
 "hga": ("広島グリーンアリーナ", "Hiroshima Green Arena"),
 "glion": ("GLION ARENA KOBE", "GLION ARENA KOBE"),
 "kitaeru": ("北海きたえーる", "Hokkai Kitaeru"),
 "messe": ("幕張メッセ", "Makuhari Messe"),
 "bigsight": ("東京ビッグサイト", "Tokyo Big Sight"),
 "kokuritsu": ("MUFGスタジアム（国立競技場）", "MUFG Stadium (Japan National Stadium)"),
 "intex": ("インテックス大阪", "INTEX Osaka"),
}

E = []
def add(id, city, start, end, v, tja, ten, cat, scale, url):
    if isinstance(v, str):
        vj, ve = V[v]
    else:
        vj, ve = v
    E.append({"id": id, "city": city, "start": start, "end": end or start,
              "venue": {"ja": vj, "en": ve}, "title": {"ja": tja, "en": ten},
              "category": cat, "scale": scale, "url": url})

# ---------------- TOKYO ----------------
add("giants-fanfesta-2026","tokyo","2026-11-23",None,"tdome","ジャイアンツ・ファンフェスタ2026","Giants Fan Festa 2026","sports",2,TDS)
add("chotokkyu-tokyo-dome","tokyo","2026-11-25","2026-11-26","tdome","超特急 BULLET TRAIN 1st DOME LIVE Signal","BULLET TRAIN (Chotokkyu) 1st Dome Live \"Signal\"","live",2,TDS)
add("haipa-game-final-tokyo-dome","tokyo","2026-11-28","2026-11-29","tdome","配信者ハイパーゲーム大会 FINAL","Streamer Hyper Game Tournament FINAL","expo",2,TDS)
add("enhypen-tokyo-dome","tokyo","2026-12-01","2026-12-02","tdome","ENHYPEN WORLD TOUR 'BLOOD SAGA' IN JAPAN","ENHYPEN World Tour 'BLOOD SAGA' in Japan","live",2,TD12)
add("yoasobi-tokyo-dome","tokyo","2026-12-05","2026-12-06","tdome","YOASOBI 11-CITY ASIA-OCEANIA TOUR 2026-2027 \"超惑星\"","YOASOBI Asia-Oceania Tour 2026-2027 \"Chouwakusei\"","live",2,TD12)
add("numberi-tokyo-dome","tokyo","2026-12-09","2026-12-10","tdome","Number_i LIVE TOUR No.III","Number_i Live Tour No.III","live",2,TD12)
add("bigbang-tokyo-dome","tokyo","2026-12-13","2026-12-15","tdome","BIGBANG 2026-2027 WORLD TOUR <XX : COSMOS> IN JAPAN","BIGBANG 2026-2027 World Tour <XX: COSMOS> in Japan","live",2,TD12)
add("fujiikaze-tokyo-dome","tokyo","2026-12-19","2026-12-20","tdome","藤井風 Prema World Tour","Fujii Kaze Prema World Tour","live",2,TD12)
add("snowman-tokyo-dome","tokyo","2026-12-23","2026-12-26","tdome","Snow Man DOME TOUR 2026-2027 ALL SUITE","Snow Man Dome Tour 2026-2027 ALL SUITE","live",2,TD12)
add("hsj-tokyo-dome-dec","tokyo","2026-12-29","2026-12-30","tdome","Hey! Say! JUMP DOME TOUR 2026-2027 Juliet","Hey! Say! JUMP Dome Tour 2026-2027 Juliet","live",2,TD12)
add("hsj-tokyo-dome-jan1","tokyo","2027-01-01",None,"tdome","Hey! Say! JUMP DOME TOUR 2026-2027 Juliet（元日公演）","Hey! Say! JUMP Dome Tour 2026-2027 Juliet (New Year's Day)","live",2,TD12)
add("txt-tokyo-dome","tokyo","2027-01-07","2027-01-08","tdome","TOMORROW X TOGETHER WORLD TOUR IN JAPAN","TOMORROW X TOGETHER World Tour in Japan","live",2,TD)
add("befirst-tokyo-dome","tokyo","2027-01-11","2027-01-12","tdome","BE:FIRST 5th Anniversary DOME TOUR 2027","BE:FIRST 5th Anniversary Dome Tour 2027","live",2,TD)
add("naniwa-tokyo-dome","tokyo","2027-01-15","2027-01-16","tdome","なにわ男子 DOME LIVE 2026-2027「ND⁵+」","Naniwa Danshi Dome Live 2026-2027 \"ND5+\"","live",2,TD)
add("equal-love-tokyo-dome","tokyo","2027-01-19","2027-01-20","tdome","＝LOVE in TOKYO DOME「全ては＝LOVE」","=LOVE in Tokyo Dome","live",2,TD)
add("laposta-2027","tokyo","2027-01-23","2027-01-24","tdome","LAPOSTA 2027（JO1・INI・ME:I ほか）","LAPOSTA 2027 (JO1, INI, ME:I and more)","live",2,TD)
add("bruno-mars-tokyo-dome","tokyo","2027-01-27","2027-01-28","tdome","ブルーノ・マーズ The Romantic Tour in Japan","Bruno Mars: The Romantic Tour in Japan","live",2,BRUNO)
add("comiket-c109","tokyo","2026-12-29","2026-12-31","bigsight","コミックマーケット109（C109）","Comic Market 109 (Comiket C109)","expo",3,"https://kai-you.net/article/94962")
add("countdown-japan-2627","tokyo","2026-12-26","2026-12-31","messe","COUNTDOWN JAPAN 26/27（12/28休演）","COUNTDOWN JAPAN 26/27 (no show Dec 28)","fes",3,MESSE)
add("jump-festa-2027","tokyo","2026-12-19","2026-12-20","messe","ジャンプフェスタ2027","Jump Festa 2027","expo",3,"https://animeanime.jp/article/2026/09/28/103297.html")
add("tokyo-comic-con-2026","tokyo","2026-12-11","2026-12-13","messe","東京コミコン2026","Tokyo Comic Con 2026","expo",2,MESSE)
add("tokyo-auto-salon-2027","tokyo","2027-01-15","2027-01-17","messe","東京オートサロン2027","Tokyo Auto Salon 2027","expo",3,"https://carview.yahoo.co.jp/news/detail/a582ee6b66f6df4a522f0c37b7136f52d6b96e33/?mode=top")
add("ecopro-2026","tokyo","2026-12-02","2026-12-04","bigsight","エコプロ2026","Eco-Products 2026","expo",2,"https://messe.nikkei.co.jp/images/ecopro26_fieldtripguide.pdf")
add("emperors-cup-final-2027","tokyo","2027-01-01",None,"kokuritsu","第106回天皇杯 決勝（皇后杯決勝 同日開催）","106th Emperor's Cup Final (with Empress's Cup Final)","sports",2,"https://jfa.jp/news/00035896/")
add("hs-soccer-opening-2026","tokyo","2026-12-28",None,"kokuritsu","第105回全国高校サッカー選手権 開会式・開幕戦","105th All Japan High School Soccer Tournament: Opening Match","sports",1,"https://l-tike.com/ntvzero/event/hs105.html")
add("hs-soccer-final-2027","tokyo","2027-01-11",None,"kokuritsu","第105回全国高校サッカー選手権 決勝","105th All Japan High School Soccer Tournament: Final","sports",2,"https://l-tike.com/ntvzero/event/hs105.html")
add("hakone-ekiden-2027","tokyo","2027-01-02","2027-01-03",("読売新聞東京本社前（大手町）発着","Yomiuri Shimbun HQ, Otemachi (start/finish)"),"第103回東京箱根間往復大学駅伝競走（箱根駅伝）","103rd Hakone Ekiden","sports",3,"https://sportiva.shueisha.co.jp/announce/ekiden2027/")
add("sumo-hatsu-basho-2027","tokyo","2027-01-10","2027-01-24",("両国国技館","Ryogoku Kokugikan"),"大相撲 一月場所（初場所）","Grand Sumo January Tournament (Hatsu Basho)","sports",1,"https://www.tabix.co.jp/domestic/special/sumo/january/")
add("haruko-volleyball-2027","tokyo","2027-01-05","2027-01-11",("東京体育館","Tokyo Metropolitan Gymnasium"),"春の高校バレー（第79回全日本バレーボール高等学校選手権大会）","Spring High School Volleyball (79th All Japan HS Championships)","sports",1,"https://spocale.com/blog/haruko/")
add("japan-cup-2026","tokyo","2026-11-29",None,("東京競馬場（府中）","Tokyo Racecourse (Fuchu)"),"ジャパンカップ（GI）","Japan Cup (G1)","sports",3,"https://www.jra.go.jp/datafile/ranking/g1/2026.html")
add("arima-kinen-2026","tokyo","2026-12-27",None,("中山競馬場（船橋）","Nakayama Racecourse (Funabashi)"),"有馬記念（GI）","Arima Kinen (G1)","sports",3,"https://jra.jp/news/202611/111301.html")
add("meiji-jingu-hatsumode-2027","tokyo","2027-01-01","2027-01-03",("明治神宮","Meiji Jingu"),"明治神宮 初詣（三が日）","New Year shrine visits at Meiji Jingu","festival",2,HATSU)
add("aimyon-budokan","tokyo","2026-11-30","2026-12-01","budo","あいみょん AIMYON 10th anniversary LIVE 2026","Aimyon 10th Anniversary Live 2026","live",1,BUDO)
add("yazawa-budokan-1203","tokyo","2026-12-03",None,"budo","矢沢永吉 2026 全国ツアー","Eikichi Yazawa 2026 Japan Tour","live",1,BUDO)
add("yazawa-budokan-1205","tokyo","2026-12-05","2026-12-06","budo","矢沢永吉 2026 全国ツアー","Eikichi Yazawa 2026 Japan Tour","live",1,BUDO)
add("yazawa-budokan-1209","tokyo","2026-12-09",None,"budo","矢沢永吉 2026 全国ツアー","Eikichi Yazawa 2026 Japan Tour","live",1,BUDO)
add("yazawa-budokan-1211","tokyo","2026-12-11","2026-12-12","budo","矢沢永吉 2026 全国ツアー","Eikichi Yazawa 2026 Japan Tour","live",1,BUDO)
add("alfee-budokan","tokyo","2026-12-23","2026-12-24","budo","THE ALFEE 2026 冬 全国アリーナツアー","THE ALFEE Winter 2026 Arena Tour","live",1,BUDO)
add("aiko-budokan","tokyo","2027-01-29","2027-01-30","budo","aiko Love Like Pop vol.26","aiko Love Like Pop vol.26","live",1,BUDO)
add("glay-ariake","tokyo","2026-11-28","2026-11-29","ariake","GLAY ARENA TOUR 2026-2027 \"EXOFIRE\"","GLAY Arena Tour 2026-2027 \"EXOFIRE\"","live",1,ARIAKE)
add("macaroni-ariake","tokyo","2026-12-05","2026-12-06","ariake","マカロニえんぴつ 2026 全国アリーナツアー","Macaroni Enpitsu 2026 Arena Tour","live",1,ARIAKE)
add("kawaii-lab-xmas-ariake","tokyo","2026-12-12","2026-12-13","ariake","KAWAII LAB. クリスマスイベント2026","KAWAII LAB. Christmas Event 2026","live",1,ARIAKE)
add("saucydog-ariake","tokyo","2026-12-15","2026-12-16","ariake","Saucy Dog 2026-2027 全国アリーナツアー","Saucy Dog 2026-2027 Arena Tour","live",1,ARIAKE)
add("hinatazaka-xmas-yoyogi","tokyo","2026-12-09","2026-12-11","yoyogi","日向坂46 クリスマスイベント2026","Hinatazaka46 Christmas Event 2026","live",1,YOYOGI)
add("generations-yoyogi","tokyo","2026-12-22","2026-12-23","yoyogi","GENERATIONS 2026 全国アリーナツアー","GENERATIONS 2026 Arena Tour","live",1,YOYOGI)
add("ayu-countdown-yoyogi","tokyo","2026-12-30","2026-12-31","yoyogi","浜崎あゆみ COUNTDOWN LIVE 2026-2027","Ayumi Hamasaki Countdown Live 2026-2027","live",1,YOYOGI)
add("sumika-tgt","tokyo","2026-12-12","2026-12-13","tgt","sumika 2026 秋冬全国ツアー","sumika Autumn/Winter 2026 Tour","live",1,TGT)

# ---------------- YOKOHAMA ----------------
add("yonezu-k-arena","yokohama","2026-12-16","2026-12-17","karena","米津玄師 2026 全国アリーナツアー","Kenshi Yonezu 2026 Arena Tour","live",1,KA)
add("fukuyama-k-arena-1226","yokohama","2026-12-26","2026-12-27","karena","福山雅治 冬の大感謝祭 2026","Masaharu Fukuyama Winter Thanksgiving Festival 2026","live",1,KA)
add("fukuyama-k-arena-1229","yokohama","2026-12-29",None,"karena","福山雅治 冬の大感謝祭 2026","Masaharu Fukuyama Winter Thanksgiving Festival 2026","live",1,KA)
add("fukuyama-k-arena-1231","yokohama","2026-12-31",None,"karena","福山雅治 冬の大感謝祭 2026（大晦日）","Masaharu Fukuyama Winter Thanksgiving Festival 2026 (NYE)","live",1,KA)
add("superbeaver-k-arena","yokohama","2027-01-16","2027-01-17","karena","SUPER BEAVER 2026-2027 全国ツアー","SUPER BEAVER 2026-2027 Tour","live",1,KA)
add("inaba-k-arena-0128","yokohama","2027-01-28",None,"karena","稲葉浩志 LIVE 2026-2027 ~enV~","Koshi Inaba LIVE 2026-2027 ~enV~","live",1,KA)
add("inaba-k-arena-0130","yokohama","2027-01-30","2027-01-31","karena","稲葉浩志 LIVE 2026-2027 ~enV~","Koshi Inaba LIVE 2026-2027 ~enV~","live",1,KA)
add("mrchildren-yokohama-arena","yokohama","2026-12-02","2026-12-03","yarena","Mr.Children 2026 全国アリーナツアー","Mr.Children 2026 Arena Tour","live",1,YA)
add("ryokushaka-yokohama-arena","yokohama","2026-12-05","2026-12-06","yarena","緑黄色社会 2026 全国アリーナツアー","Ryokuoushoku Shakai 2026 Arena Tour","live",1,YA)
add("kuwata-yokohama-arena-1228","yokohama","2026-12-28",None,"yarena","桑田佳祐 2026 全国アリーナツアー 追加公演","Keisuke Kuwata 2026 Arena Tour (added show)","live",1,YA)
add("kuwata-yokohama-arena-1230","yokohama","2026-12-30","2026-12-31","yarena","桑田佳祐 2026 全国アリーナツアー 追加公演（年越し）","Keisuke Kuwata 2026 Arena Tour (year-end shows)","live",1,YA)
add("travisjapan-yokohama-arena","yokohama","2027-01-04","2027-01-07","yarena","Travis Japan 2027 全国アリーナツアー","Travis Japan 2027 Arena Tour","live",1,YA)
add("milk-yokohama-arena","yokohama","2027-01-15","2027-01-17","yarena","M!LK 2026-2027 全国アリーナツアー","M!LK 2026-2027 Arena Tour","live",1,YA)
add("yamapi-pia-arena","yokohama","2026-11-28","2026-11-29","pia","山下智久 TOUR 2026 DREAMING","Tomohisa Yamashita Tour 2026 DREAMING","live",1,PIA)
add("mga-pia-arena","yokohama","2026-12-19","2026-12-20","pia","Mrs. GREEN APPLE Ringo Jam Tour \"SHADOWS\"","Mrs. GREEN APPLE Ringo Jam Tour \"SHADOWS\"","live",1,PIA)
add("sekaowa-pia-arena","yokohama","2026-12-22","2026-12-23","pia","SEKAI NO OWARI 2026 ファンクラブライブ","SEKAI NO OWARI 2026 Fan Club Live","live",1,PIA)
add("kitani-pia-arena","yokohama","2027-01-16","2027-01-17","pia","キタニタツヤ 2026-2027 アリーナツアー","Tatsuya Kitani 2026-2027 Arena Tour","live",1,PIA)

# ---------------- KAWASAKI ----------------
add("kawasaki-daishi-hatsumode-2027","kawasaki","2027-01-01","2027-01-03",("川崎大師 平間寺","Kawasaki Daishi Heikenji"),"川崎大師 初詣（三が日）","New Year temple visits at Kawasaki Daishi","festival",2,HATSU)

# ---------------- SAITAMA ----------------
add("bruno-mars-belluna","saitama","2027-01-15","2027-01-16","belluna","ブルーノ・マーズ The Romantic Tour in Japan","Bruno Mars: The Romantic Tour in Japan","live",2,BRUNO)
add("hikawa-hatsumode-2027","saitama","2027-01-01","2027-01-03",("武蔵一宮 氷川神社","Musashi Ichinomiya Hikawa Shrine"),"氷川神社 初詣（三が日）","New Year shrine visits at Hikawa Shrine","festival",2,HATSU)

# ---------------- OSAKA ----------------
add("bigbang-kyocera","osaka","2026-11-27","2026-11-29","kdome","BIGBANG 2026-2027 WORLD TOUR <XX : COSMOS> IN JAPAN","BIGBANG 2026-2027 World Tour <XX: COSMOS> in Japan","live",2,KD)
add("numberi-kyocera","osaka","2026-12-02",None,"kdome","Number_i LIVE TOUR No.III","Number_i Live Tour No.III","live",2,KD)
add("exile-kyocera","osaka","2026-12-05","2026-12-06","kdome","EXILE 25th ANNIVERSARY BEST LIVE ～LDH PERFECT YEAR 2026～","EXILE 25th Anniversary Best Live - LDH Perfect Year 2026","live",2,KD)
add("fujiikaze-kyocera-1210","osaka","2026-12-10",None,"kdome","藤井風 Prema World Tour","Fujii Kaze Prema World Tour","live",2,KD)
add("fujiikaze-kyocera-1212","osaka","2026-12-12","2026-12-13","kdome","藤井風 Prema World Tour","Fujii Kaze Prema World Tour","live",2,KD)
add("lesserafim-kyocera","osaka","2026-12-19","2026-12-20","kdome","2026 LE SSERAFIM TOUR 'PUREFLOW' IN KYOCERA DOME OSAKA","LE SSERAFIM Tour 'PUREFLOW' in Kyocera Dome Osaka","live",2,KD)
add("kismyft2-kyocera","osaka","2026-12-25","2026-12-26","kdome","Kis-My-Ft2 DOME TOUR 2026-2027 fan IS","Kis-My-Ft2 Dome Tour 2026-2027 \"fan IS\"","live",2,KD)
add("naniwa-kyocera-countdown","osaka","2026-12-31","2027-01-01","kdome","なにわ男子 DOME LIVE 2026-2027「ND⁵+」～あけおめぇ 初夢ぇ Stay with MEE～","Naniwa Danshi Dome Live 2026-2027 \"ND5+\" (Countdown)","live",2,KD)
add("snowman-kyocera","osaka","2027-01-04","2027-01-07","kdome","Snow Man DOME TOUR 2026-2027 ALL SUITE","Snow Man Dome Tour 2026-2027 ALL SUITE","live",2,KD)
add("hsj-kyocera","osaka","2027-01-10","2027-01-12","kdome","Hey! Say! JUMP DOME TOUR 2026-2027 Juliet","Hey! Say! JUMP Dome Tour 2026-2027 Juliet","live",2,KD)
add("befirst-kyocera","osaka","2027-01-16","2027-01-17","kdome","BE:FIRST 5th Anniversary DOME TOUR 2027","BE:FIRST 5th Anniversary Dome Tour 2027","live",2,KD)
add("bruno-mars-kyocera","osaka","2027-01-19","2027-01-20","kdome","ブルーノ・マーズ The Romantic Tour in Japan","Bruno Mars: The Romantic Tour in Japan","live",2,KD)
add("bump-kyocera","osaka","2027-01-23","2027-01-24","kdome","BUMP OF CHICKEN TOUR 2026-2027 Ratio Clavis","BUMP OF CHICKEN Tour 2026-2027 Ratio Clavis","live",2,KD)
add("txt-kyocera","osaka","2027-01-30","2027-01-31","kdome","TOMORROW X TOGETHER WORLD TOUR <STEAL THE WIND> IN JAPAN","TOMORROW X TOGETHER World Tour <STEAL THE WIND> in Japan","live",2,KD)
add("tomoo-osakajo","osaka","2026-11-23",None,"ojh","TOMOO 大阪城ホール公演","TOMOO at Osaka-Jo Hall","live",1,OJH_OFF)
add("generations-osakajo","osaka","2026-11-25","2026-11-26","ojh","GENERATIONS 2026 全国アリーナツアー","GENERATIONS 2026 Arena Tour","live",1,OJH)
add("yazawa-osakajo","osaka","2026-11-28","2026-11-29","ojh","矢沢永吉 2026 全国ツアー","Eikichi Yazawa 2026 Japan Tour","live",1,OJH)
add("uverworld-osakajo","osaka","2026-12-01","2026-12-02","ojh","UVERworld 大阪城ホール公演","UVERworld at Osaka-Jo Hall","live",1,OJH_OFF)
add("kobukuro-osakajo","osaka","2026-12-19",None,"ojh","KOBUKURO LIVE TOUR 2026 霞日和 追加公演","Kobukuro Live Tour 2026 (added show)","live",1,OJH)
add("kuwata-osakajo","osaka","2026-12-22","2026-12-23","ojh","桑田佳祐 2026 全国アリーナツアー 追加公演","Keisuke Kuwata 2026 Arena Tour (added shows)","live",1,OJH)
add("milk-osakajo","osaka","2026-12-25","2026-12-26","ojh","M!LK 2026-2027 全国アリーナツアー","M!LK 2026-2027 Arena Tour","live",1,OJH)
add("alfee-osakajo","osaka","2026-12-29",None,"ojh","THE ALFEE 2026 冬 全国アリーナツアー","THE ALFEE Winter 2026 Arena Tour","live",1,OJH)
add("aiko-osakajo-countdown","osaka","2026-12-31",None,"ojh","aiko カウントダウンライブ（Love Like Pop vol.26）","aiko Countdown Live (Love Like Pop vol.26)","live",1,OJH)
add("kansai-jr-osakajo","osaka","2027-01-03","2027-01-05","ojh","関西ジュニア 2027 コンサート","Kansai Junior 2027 Concert","live",1,OJH)
add("radio-crazy-2026","osaka","2026-12-26","2026-12-28","intex","FM802 ROCK FESTIVAL RADIO CRAZY 2026","FM802 Rock Festival RADIO CRAZY 2026","fes",2,"https://eplus.jp/radiocrazy2026/")
add("all-japan-figure-2026","osaka","2026-12-24","2026-12-27",("東和薬品RACTABドーム（門真）","Towa Pharmaceutical RACTAB Dome (Kadoma)"),"第95回全日本フィギュアスケート選手権大会","95th All Japan Figure Skating Championships","sports",2,"https://www.skatingjapan.or.jp/figure/event/detail.php?id=2419")
add("hanazono-hs-rugby-2026","osaka","2026-12-27","2027-01-07",("東大阪市花園ラグビー場","Hanazono Rugby Stadium (Higashiosaka)"),"第106回全国高等学校ラグビーフットボール大会（花園）","106th National High School Rugby Tournament (Hanazono)","sports",1,"https://www.kanaloco.jp/sports/misc/article-1318831.html")
add("osaka-womens-marathon-2027","osaka","2027-01-31",None,("ヤンマースタジアム長居 発着","Yanmar Stadium Nagai (start/finish)"),"第46回大阪国際女子マラソン","46th Osaka International Women's Marathon","sports",1,"https://www.osaka-marathon.jp/")
add("imamiya-tokaebisu-2027","osaka","2027-01-09","2027-01-11",("今宮戎神社","Imamiya Ebisu Shrine"),"今宮戎 十日戎","Toka Ebisu Festival at Imamiya Ebisu","festival",2,"https://osaka-info.jp/event/imamiyaebisu-tokaebisu/")
add("sumiyoshi-hatsumode-2027","osaka","2027-01-01","2027-01-03",("住吉大社","Sumiyoshi Taisha"),"住吉大社 初詣（三が日）","New Year shrine visits at Sumiyoshi Taisha","festival",2,HATSU)

# ---------------- NAGOYA ----------------
add("snowman-vantelin","nagoya","2026-11-26","2026-11-29","vdome","Snow Man DOME TOUR 2026-2027 ALL SUITE","Snow Man Dome Tour 2026-2027 ALL SUITE","live",2,VD)
add("bigbang-vantelin","nagoya","2026-12-05","2026-12-06","vdome","BIGBANG 2026-2027 WORLD TOUR IN JAPAN","BIGBANG 2026-2027 World Tour in Japan","live",2,VD)
add("hsj-vantelin","nagoya","2026-12-19","2026-12-20","vdome","Hey! Say! JUMP DOME TOUR 2026-2027 Juliet","Hey! Say! JUMP Dome Tour 2026-2027 Juliet","live",2,VD)
add("enhypen-vantelin","nagoya","2026-12-26","2026-12-27","vdome","ENHYPEN WORLD TOUR 'BLOOD SAGA' IN JAPAN","ENHYPEN World Tour 'BLOOD SAGA' in Japan","live",2,"https://prtimes.jp/main/html/rd/p/000000684.000045862.html")
add("rizin-nye-nagoya-2026","nagoya","2026-12-31",None,"vdome","RIZIN 大晦日 名古屋大会（RIZIN NYE in Nagoya）","RIZIN New Year's Eve in Nagoya","sports",2,"https://www.rizin.tv/products/rizin-nye-in-nagoya")
add("bruno-mars-vantelin","nagoya","2027-01-04","2027-01-05","vdome","ブルーノ・マーズ The Romantic Tour in Japan","Bruno Mars: The Romantic Tour in Japan","live",2,BRUNO)
add("numberi-vantelin","nagoya","2027-01-09","2027-01-11","vdome","Number_i LIVE TOUR No.III","Number_i Live Tour No.III","live",2,VD)
add("bleague-allstar-2027","nagoya","2027-01-15","2027-01-17","ig","B.LEAGUE ALL-STAR GAME WEEKEND 2027 IN AICHI-NAGOYA","B.LEAGUE All-Star Game Weekend 2027 in Aichi-Nagoya","sports",1,"https://www.nagoya-info.jp/upload/foundnewss/origin/2263546596ab48962c2d8b.pdf")
add("cutie-street-ig","nagoya","2026-11-28","2026-11-29","ig","CUTIE STREET 2026 アリーナツアー","CUTIE STREET 2026 Arena Tour","live",1,IG)
add("bump-ig","nagoya","2026-12-19","2026-12-20","ig","BUMP OF CHICKEN TOUR 2026-2027 Ratio Clavis","BUMP OF CHICKEN Tour 2026-2027 Ratio Clavis","live",1,IG)
add("aiko-gaishi","nagoya","2026-12-02","2026-12-03","gaishi","aiko Love Like Pop vol.26","aiko Love Like Pop vol.26","live",1,GAISHI)
add("kuwata-gaishi","nagoya","2026-12-16","2026-12-17","gaishi","桑田佳祐 2026 全国アリーナツアー 追加公演","Keisuke Kuwata 2026 Arena Tour (added shows)","live",1,GAISHI)
add("hinatazaka-gaishi","nagoya","2026-12-22","2026-12-24","gaishi","日向坂46 ひなくり2026","Hinatazaka46 \"Hinakuri 2026\" Christmas Event","live",1,GAISHI)
add("yonezu-portmesse","nagoya","2026-12-08","2026-12-09","pm","米津玄師 2026 全国アリーナツアー","Kenshi Yonezu 2026 Arena Tour","live",1,PM)
add("merry-rock-parade-2026","nagoya","2026-12-19","2026-12-20","pm","MERRY ROCK PARADE 2026","MERRY ROCK PARADE 2026","fes",1,PM)
add("yamapi-portmesse","nagoya","2026-12-26","2026-12-27","pm","山下智久 TOUR 2026 DREAMING","Tomohisa Yamashita Tour 2026 DREAMING","live",1,PM)
add("inaba-portmesse","nagoya","2027-01-16","2027-01-17","pm","稲葉浩志 LIVE 2026-2027 ~enV~","Koshi Inaba LIVE 2026-2027 ~enV~","live",1,PM)
add("atsuta-hatsumode-2027","nagoya","2027-01-01","2027-01-03",("熱田神宮","Atsuta Jingu"),"熱田神宮 初詣（三が日）","New Year shrine visits at Atsuta Jingu","festival",2,HATSU)

# ---------------- FUKUOKA ----------------
add("yoasobi-paypay","fukuoka","2026-11-28","2026-11-29","ppdome","YOASOBI ASIA DOME & STADIUM TOUR 2026-2027","YOASOBI Asia Dome & Stadium Tour 2026-2027","live",2,PP)
add("snowman-paypay","fukuoka","2026-12-04","2026-12-06","ppdome","Snow Man DOME TOUR 2026-2027 ALL SUITE","Snow Man Dome Tour 2026-2027 ALL SUITE","live",2,PP)
add("hsj-paypay","fukuoka","2026-12-12","2026-12-13","ppdome","Hey! Say! JUMP DOME TOUR 2026-2027 Juliet","Hey! Say! JUMP Dome Tour 2026-2027 Juliet","live",2,PP)
add("txt-paypay","fukuoka","2026-12-19","2026-12-20","ppdome","TOMORROW X TOGETHER WORLD TOUR IN JAPAN","TOMORROW X TOGETHER World Tour in Japan","live",2,PP)
add("bigbang-paypay","fukuoka","2026-12-26","2026-12-27","ppdome","BIGBANG 2026-2027 WORLD TOUR IN JAPAN","BIGBANG 2026-2027 World Tour in Japan","live",2,PP)
add("numberi-paypay","fukuoka","2027-01-16","2027-01-17","ppdome","Number_i LIVE TOUR No.III","Number_i Live Tour No.III","live",2,PP)
add("bruno-mars-paypay","fukuoka","2027-01-23","2027-01-24","ppdome","ブルーノ・マーズ The Romantic Tour in Japan","Bruno Mars: The Romantic Tour in Japan","live",2,BRUNO)
add("yonezu-marinemesse","fukuoka","2026-11-27","2026-11-28","mm","米津玄師 2026 全国アリーナツアー","Kenshi Yonezu 2026 Arena Tour","live",1,MM)
add("yamapi-marinemesse","fukuoka","2026-12-06",None,"mm","山下智久 TOUR 2026 DREAMING","Tomohisa Yamashita Tour 2026 DREAMING","live",1,MM)
add("mga-marinemesse","fukuoka","2026-12-09","2026-12-10","mm","Mrs. GREEN APPLE Ringo Jam Tour \"SHADOWS\"","Mrs. GREEN APPLE Ringo Jam Tour \"SHADOWS\"","live",1,MM)
add("bump-marinemesse","fukuoka","2026-12-12","2026-12-13","mm","BUMP OF CHICKEN TOUR 2026-2027 Ratio Clavis","BUMP OF CHICKEN Tour 2026-2027 Ratio Clavis","live",1,MM)
add("glay-marinemesse","fukuoka","2026-12-19","2026-12-20","mm","GLAY ARENA TOUR 2026-2027 \"EXOFIRE\"","GLAY Arena Tour 2026-2027 \"EXOFIRE\"","live",1,MM)
add("saucydog-marinemesse","fukuoka","2026-12-23",None,"mm","Saucy Dog 2026-2027 全国アリーナツアー","Saucy Dog 2026-2027 Arena Tour","live",1,MM)
add("misia-marinemesse","fukuoka","2027-01-30","2027-01-31","mm","MISIA 2027 全国アリーナツアー","MISIA 2027 Arena Tour","live",1,MM)

# ---------------- SAPPORO ----------------
add("munich-xmas-sapporo-2026","sapporo","2026-11-20","2026-12-25",("大通公園 西1・2丁目","Odori Park (W1-2)"),"ミュンヘン・クリスマス市 in Sapporo","Munich Christmas Market in Sapporo","festival",1,"https://www.sapporo.travel/white-illumination/event/munich/")
add("glay-kitaeru","sapporo","2026-12-12","2026-12-13","kitaeru","GLAY ARENA TOUR 2026-2027 \"EXOFIRE\"","GLAY Arena Tour 2026-2027 \"EXOFIRE\"","live",1,KITAERU)
add("bruno-mars-sapporo","sapporo","2027-01-10","2027-01-11","sdome","ブルーノ・マーズ The Romantic Tour in Japan","Bruno Mars: The Romantic Tour in Japan","live",2,BRUNO)

# ---------------- SENDAI ----------------
add("yonezu-grandi21","sendai","2026-12-03","2026-12-04","grandi","米津玄師 2026 全国アリーナツアー","Kenshi Yonezu 2026 Arena Tour","live",1,GRANDI)
add("sendai-pageant-2026","sendai","2026-12-04","2026-12-27",("定禅寺通","Jozenji-dori Avenue"),"SENDAI光のページェント","SENDAI Pageant of Starlight","festival",2,"https://www.city.sendai.jp/kyoikukate/documents/20260819hikapeangels.pdf")
add("yamapi-xebio-sendai","sendai","2026-12-12","2026-12-13","xebio","山下智久 TOUR 2026 DREAMING","Tomohisa Yamashita Tour 2026 DREAMING","live",1,XEBIO)
add("mga-grandi21","sendai","2026-12-15","2026-12-16","grandi","Mrs. GREEN APPLE Ringo Jam Tour \"SHADOWS\"","Mrs. GREEN APPLE Ringo Jam Tour \"SHADOWS\"","live",1,GRANDI)
add("dontosai-sendai-2027","sendai","2027-01-14",None,("大崎八幡宮","Osaki Hachimangu"),"松焚祭（どんと祭）","Matsutaki Festival (Donto-sai)","festival",2,"https://www.oosaki-hachiman.or.jp/festival/matsutaki/pdf/donto.pdf")
add("travisjapan-grandi21","sendai","2027-01-16","2027-01-17","grandi","Travis Japan 2027 全国アリーナツアー","Travis Japan 2027 Arena Tour","live",1,GRANDI)
add("inaba-grandi21","sendai","2027-01-23",None,"grandi","稲葉浩志 LIVE 2026-2027 ~enV~","Koshi Inaba LIVE 2026-2027 ~enV~","live",1,GRANDI)

# ---------------- KOBE ----------------
add("macaroni-glion","kobe","2026-11-29",None,"glion","マカロニえんぴつ 2026 全国アリーナツアー","Macaroni Enpitsu 2026 Arena Tour","live",1,GLION)
add("mga-glion","kobe","2026-12-02","2026-12-03","glion","Mrs. GREEN APPLE Ringo Jam Tour \"SHADOWS\"","Mrs. GREEN APPLE Ringo Jam Tour \"SHADOWS\"","live",1,GLION)
add("omi-glion","kobe","2026-12-19","2026-12-20","glion","ØMI MOON NIGHT 2026 \"Ø to 3\" ～大忘年会SPECIAL～","OMI MOON NIGHT 2026 \"O to 3\" Year-End Special","live",1,GLION)
add("kobe-music-commons-2026","kobe","2026-12-30",None,"glion","KOBE MUSIC COMMONS 2026","KOBE MUSIC COMMONS 2026","fes",1,"https://prtimes.jp/main/html/rd/p/000000235.000086732.html")
add("ikuta-hatsumode-2027","kobe","2027-01-01","2027-01-03",("生田神社","Ikuta Shrine"),"生田神社 初詣（三が日）","New Year shrine visits at Ikuta Shrine","festival",2,HATSU)
add("inaba-glion","kobe","2027-01-09","2027-01-10","glion","稲葉浩志 LIVE 2026-2027 ~enV~","Koshi Inaba LIVE 2026-2027 ~enV~","live",1,GLION)
add("glay-glion","kobe","2027-01-16","2027-01-17","glion","GLAY ARENA TOUR 2026-2027 \"EXOFIRE\"","GLAY Arena Tour 2026-2027 \"EXOFIRE\"","live",1,GLION)
add("kitani-glion","kobe","2027-01-23","2027-01-24","glion","キタニタツヤ 2026-2027 アリーナツアー","Tatsuya Kitani 2026-2027 Arena Tour","live",1,GLION)
add("kobe-luminarie-2027","kobe","2027-01-29","2027-02-07",("東遊園地・旧居留地・メリケンパーク","Higashi Yuenchi, Former Foreign Settlement & Meriken Park"),"第32回 神戸ルミナリエ","32nd Kobe Luminarie","festival",3,"https://happyell.co.jp/event/kobe-luminarie2027")

# ---------------- KYOTO ----------------
add("zenkoku-hs-ekiden-2026","kyoto","2026-12-20",None,("たけびしスタジアム京都 発着","Takebishi Stadium Kyoto (start/finish)"),"全国高校駅伝（男子第77回・女子第38回）","All Japan High School Ekiden (Men 77th / Women 38th)","sports",1,"https://spocale.com/sports/7/game/365864")
add("fushimi-inari-hatsumode-2027","kyoto","2027-01-01","2027-01-03",("伏見稲荷大社","Fushimi Inari Taisha"),"伏見稲荷大社 初詣（三が日）","New Year shrine visits at Fushimi Inari Taisha","festival",2,HATSU)
add("womens-ekiden-kyoto-2027","kyoto","2027-01-17",None,("たけびしスタジアム京都 発着","Takebishi Stadium Kyoto (start/finish)"),"皇后盃 第45回全国都道府県対抗女子駅伝","45th Empress's Cup Inter-Prefectural Women's Ekiden","sports",1,"https://www.jaaf-miyagi.com/track-and-field/wp-content/uploads/2026/04/c0da3af366f645e2075b166fd04dc916.pdf")

# ---------------- HIROSHIMA ----------------
add("bump-hiroshima-green-arena","hiroshima","2026-11-28","2026-11-29","hga","BUMP OF CHICKEN TOUR 2026-2027 Ratio Clavis","BUMP OF CHICKEN Tour 2026-2027 Ratio Clavis","live",1,HGA)
add("dreamination-2026","hiroshima","2026-12-04","2027-01-24",("平和大通り ほか市内中心部","Peace Boulevard & central Hiroshima"),"ひろしまドリミネーション2026","Hiroshima Dreamination 2026","festival",1,"https://www.walkerplus.com/event/ar0834e17637/")
add("mens-ekiden-hiroshima-2027","hiroshima","2027-01-24",None,("平和記念公園前 発着","Peace Memorial Park (start/finish)"),"天皇盃 第32回全国都道府県対抗男子駅伝","32nd Emperor's Cup Inter-Prefectural Men's Ekiden","sports",1,"https://www.jaaf-miyagi.com/track-and-field/wp-content/uploads/2026/04/1339899c4c2075cd3370aaba2b6ed619.pdf")
add("glay-hiroshima-green-arena","hiroshima","2027-01-30","2027-01-31","hga","GLAY ARENA TOUR 2026-2027 \"EXOFIRE\"","GLAY Arena Tour 2026-2027 \"EXOFIRE\"","live",1,HGA)

ids = [e["id"] for e in E]
assert len(ids) == len(set(ids)), [i for i in ids if ids.count(i) > 1]
for e in E:
    assert e["start"] <= e["end"], e["id"]
E.sort(key=lambda e: (e["start"], e["city"], e["id"]))
out = sys.argv[1]
with open(out, "w", encoding="utf-8", newline="\n") as f:
    json.dump(E, f, ensure_ascii=False, indent=1)
from collections import Counter
print(len(E), Counter(e["city"] for e in E))
