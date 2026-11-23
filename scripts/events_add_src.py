import json, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'events_add.json')
BS="https://www.bigsight.jp/visitor/event/"
MK="https://www.m-messe.co.jp/event/"
PIA12="https://pia-arena-mm.jp/event@p1=2026&p2=12.html"
PIA01="https://pia-arena-mm.jp/event@p1=2027&p2=01.html"
AR12="https://ariake-arena.tokyo/event/next/"
AR01="https://ariake-arena.tokyo/event/two/"
KA12="https://k-arena.com/schedule/?y=2026&m=12"
KA01="https://k-arena.com/schedule/?y=2027&m=1"
OJ12="https://www.osaka-johall.com/event/?ym=202612"
OJ01="https://www.osaka-johall.com/event/?ym=202701"
AJ=lambda n:f"https://live-events.a-jp.org/soko/plc/{n}.html"
V={
 "bigsight":("東京ビッグサイト","Tokyo Big Sight"),
 "messe":("幕張メッセ","Makuhari Messe"),
 "pia":("ぴあアリーナMM","PIA Arena MM"),
 "ariake":("有明アリーナ","Ariake Arena"),
 "karena":("Kアリーナ横浜","K-Arena Yokohama"),
 "ojh":("大阪城ホール","Osaka-Jo Hall"),
 "budo":("日本武道館","Nippon Budokan"),
 "yoyogi":("国立代々木競技場 第一体育館","Yoyogi National Gymnasium"),
 "taikan":("東京体育館","Tokyo Metropolitan Gymnasium"),
 "gaishi":("日本ガイシホール","Nippon Gaishi Hall"),
 "asue":("Asueアリーナ大阪","Asue Arena Osaka"),
 "hga":("広島グリーンアリーナ","Hiroshima Green Arena"),
 "toyota":("TOYOTA ARENA TOKYO","TOYOTA ARENA TOKYO"),
 "kokuritsu":("MUFGスタジアム（国立競技場）","MUFG Stadium (Japan National Stadium)"),
 "pacifico":("パシフィコ横浜 国立大ホール","Pacifico Yokohama National Convention Hall"),
 "wc":("東京体育館・京王アリーナTOKYO","Tokyo Metropolitan Gymnasium / Keio Arena TOKYO"),
}
R=[]
def e(id,city,s,en,v,tj,te,cat,sc,url):
    R.append({"id":id,"city":city,"start":s,"end":en,"venue":{"ja":V[v][0],"en":V[v][1]},"title":{"ja":tj,"en":te},"category":cat,"scale":sc,"url":url})
# Big Sight
e("japan-build-tokyo-2026","tokyo","2026-12-02","2026-12-04","bigsight","JAPAN BUILD TOKYO 2026（建築・土木・不動産の先端技術展）","JAPAN BUILD TOKYO 2026","expo",1,BS)
e("semicon-japan-2026","tokyo","2026-12-09","2026-12-11","bigsight","SEMICON Japan 2026","SEMICON Japan 2026","expo",2,BS)
e("nanotech-enex-bigsight-2026","tokyo","2026-12-16","2026-12-18","bigsight","nano tech 2026 / ENEX2027 / 東京ケアウィーク'26 ほか同時開催展","nano tech 2026 / ENEX 2027 / Tokyo Care Week '26 and co-located shows","expo",2,BS)
# Makuhari
e("ipf-japan-2026","tokyo","2026-12-01","2026-12-05","messe","IPF Japan 2026 国際プラスチックフェア","IPF Japan 2026 International Plastic Fair","expo",1,MK)
e("winter-sports-festa-makuhari-2027","tokyo","2027-01-22","2027-01-24","messe","冬スポ!!WINTER SPORTS FESTA season26","Winter Sports Festa season26","expo",1,MK)
e("bluearchive-fes-makuhari-2027","tokyo","2027-01-23","2027-01-24","messe","ブルアカふぇす!～ろっく・うぃず・みー♪～","Blue Archive Fes ~Rock with Me~","live",1,MK)
e("sidem-battle-fes-makuhari-2027","tokyo","2027-01-23","2027-01-24","messe","315 Production presents F@NTASTIC BATTLE FES ～Wanna step in～ 幕張公演","315 Production presents F@NTASTIC BATTLE FES (Makuhari)","live",1,MK)
e("ijt-live-ent-expo-makuhari-2027","tokyo","2027-01-27","2027-01-29","messe","国際宝飾展・ライブ・エンターテイメントEXPO・クリエイターEXPO ほか同時開催展","International Jewellery Tokyo / Live Entertainment Expo / Creator Expo and co-located shows","expo",1,MK)
# Pia Arena MM
e("angerme-pia-arena","yokohama","2026-12-02","2026-12-02","pia","アンジュルム 2026秋 FINAL 風林火山・極","ANGERME Autumn 2026 FINAL","live",1,PIA12)
e("blackorwhite-pia-arena","yokohama","2026-12-05","2026-12-05","pia","NewsPicks Presents BLACK or WHITE 大天下獲り FESTIVAL2","NewsPicks Presents BLACK or WHITE Festival 2","fes",1,PIA12)
e("monstax-pia-arena","yokohama","2026-12-08","2026-12-09","pia","2026 MONSTA X WORLD TOUR THE:X NEXUS ENCORE in JAPAN","MONSTA X World Tour THE:X NEXUS Encore in Japan","live",1,PIA12)
e("fnc-kingdom-pia-arena","yokohama","2026-12-12","2026-12-13","pia","2026 FNC KINGDOM - THE FLOATING BAZAAR -","2026 FNC KINGDOM - THE FLOATING BAZAAR -","live",1,PIA12)
e("sakurazaka-backs-pia-arena","yokohama","2026-12-15","2026-12-16","pia","櫻坂46 16th Single BACKS LIVE!!","Sakurazaka46 16th Single BACKS LIVE!!","live",1,PIA12)
e("porno-pia-arena-1226","yokohama","2026-12-26","2026-12-27","pia","みなとみらいロマンスポルノ'26 〜鳥〜（ポルノグラフィティ）","Porno Graffitti Minatomirai Romance Porno '26","live",1,PIA12)
e("porno-pia-arena-1230","yokohama","2026-12-30","2026-12-31","pia","みなとみらいロマンスポルノ'26 〜鳥〜（ポルノグラフィティ）年末公演","Porno Graffitti Minatomirai Romance Porno '26 (year-end)","live",1,PIA12)
e("hanyu-icestory-pia-arena","yokohama","2027-01-09","2027-01-13","pia","羽生結弦 ICE STORY 4th WHITE BOX（1/9・11・13）","Yuzuru Hanyu ICE STORY 4th WHITE BOX (Jan 9/11/13)","live",1,PIA01)
e("nanajigen-pia-arena","yokohama","2027-01-23","2027-01-23","pia","劇場版 七次元生徒会！ ～ずっと一緒大作戦！～","Nanajigen Seitokai! live event","live",1,PIA01)
e("voltaction-pia-arena","yokohama","2027-01-24","2027-01-24","pia","VOLTACTION 2nd LIVE \"EVOLVE\"","VOLTACTION 2nd LIVE \"EVOLVE\"","live",1,PIA01)
e("colorfulpeach-pia-arena","yokohama","2027-01-30","2027-01-31","pia","カラフルピーチ からぴちパラダイスARENA TOUR 2026 追加公演","Colorful Peach Arena Tour 2026 (added shows)","live",1,PIA01)
# K-Arena
e("jx-k-arena","yokohama","2026-12-04","2026-12-06","karena","JX 2026 TOUR CONCERT「CORE」IN YOKOHAMA","JX 2026 Tour Concert \"CORE\" in Yokohama","live",1,KA12)
e("and2ble-k-arena","yokohama","2026-12-11","2026-12-12","karena","2026 AND2BLE FAN-CON <W!nter inside> In Yokohama","2026 AND2BLE FAN-CON <W!nter inside> in Yokohama","live",1,KA12)
e("yuuri-k-arena-1213","yokohama","2026-12-13","2026-12-13","karena","優里 2026年 単独公演（追加公演）","Yuuri 2026 solo show (added date)","live",1,KA12)
e("yuuri-k-arena-1219","yokohama","2026-12-19","2026-12-19","karena","優里 2026年 最後の単独公演","Yuuri final 2026 solo show","live",1,KA12)
e("suisei-k-arena","yokohama","2026-12-20","2026-12-20","karena","星降る晩餐会（tuki. / 星街すいせい）","Hoshifuru Bansankai (tuki. / Hoshimachi Suisei)","live",1,KA12)
e("hololive-records-k-arena","yokohama","2027-01-09","2027-01-10","karena","hololive RECORDS MUSIC STAGE 2027","hololive RECORDS MUSIC STAGE 2027","live",1,KA01)
e("starish-k-arena","yokohama","2027-01-23","2027-01-24","karena","ST☆RISH 15th Anniversary Live『WE LOVE ST☆RISH SHINING RAINBOW』","ST☆RISH 15th Anniversary Live \"WE LOVE ST☆RISH SHINING RAINBOW\"","live",1,KA01)
e("kitagawa-pacifico","yokohama","2027-01-14","2027-01-14","pacifico","北川悠仁 50th Birthday Special Live 2027 DRESS CODE","Yujin Kitagawa (Yuzu) 50th Birthday Special Live 2027","live",1,AJ(89))
# Ariake
e("ldh-kouhaku-ariake","tokyo","2026-12-10","2026-12-10","ariake","陣 presents『CL6th LDH紅白頂上決戦』","JIN presents CL6th LDH Kohaku Battle","live",1,AR12)
e("lunasea-ariake","tokyo","2026-12-19","2026-12-20","ariake","LUNA SEA TOUR 2026 UNENDING JOURNEY -TO RISE-","LUNA SEA Tour 2026 UNENDING JOURNEY -TO RISE-","live",1,AR12)
e("larc-ariake","tokyo","2026-12-24","2026-12-27","ariake","L'Arc-en-Ciel 35th L'Anniversary TOUR（12/24 FC限定・12/26-27）","L'Arc-en-Ciel 35th L'Anniversary Tour (Dec 24 FC-only, Dec 26-27)","live",1,AR12)
e("ado-ariake","tokyo","2027-01-10","2027-01-11","ariake","Adoの歌ってみたツアー2027","Ado Utattemita Tour 2027","live",1,AR01)
e("nogizaka-six-live-ariake","tokyo","2027-01-16","2027-01-17","ariake","乃木坂スター誕生！SIX LIVE","Nogizaka Star Tanjo! SIX LIVE","live",1,AR01)
e("toukenranbu-ariake","tokyo","2027-01-28","2027-01-31","ariake","ミュージカル『刀剣乱舞』～真剣乱舞祭2026～","Musical Touken Ranbu ~Shinken Ranbusai 2026~","live",1,AR01)
# Osaka-Jo Hall
e("daiku-10000-osakajo","osaka","2026-12-06","2026-12-06","ojh","サントリー1万人の第九","Suntory 10,000-Voice Beethoven's Ninth","live",1,OJ12)
e("toukenranbu-osakajo","osaka","2026-12-10","2026-12-11","ojh","ミュージカル『刀剣乱舞』～真剣乱舞祭2026～","Musical Touken Ranbu ~Shinken Ranbusai 2026~","live",1,OJ12)
e("zigzag-osakajo","osaka","2026-12-13","2026-12-13","ojh","-真天地開闢集団-ジグザグ 大阪城ホール公演","Zig Zag at Osaka-Jo Hall","live",1,OJ12)
e("larc-osakajo","osaka","2026-12-16","2026-12-17","ojh","L'Arc-en-Ciel 35th L'Anniversary TOUR","L'Arc-en-Ciel 35th L'Anniversary Tour","live",1,OJ12)
e("hotei-osakajo","osaka","2026-12-27","2026-12-27","ojh","布袋寅泰 大阪城ホール公演","Tomoyasu Hotei at Osaka-Jo Hall","live",1,OJ12)
e("gero-osakajo","osaka","2027-01-08","2027-01-08","ojh","Gero 大阪城ホール公演","Gero at Osaka-Jo Hall","live",1,OJ01)
e("aiko-asue","osaka","2027-01-09","2027-01-10","asue","aiko Love Like Pop vol.26","aiko Love Like Pop vol.26","live",1,AJ(128))
# Budokan / Yoyogi / Taikan / Toyota
e("ayaka-budokan","tokyo","2026-11-29","2026-11-29","budo","絢香 20th ANNIVERSARY LIVE TOUR","Ayaka 20th Anniversary Live Tour","live",1,AJ(87))
e("nogizaka-6ki-budokan","tokyo","2026-12-16","2026-12-16","budo","乃木坂46 6期生全国ツアー2026 FINAL","Nogizaka46 6th Generation Tour 2026 FINAL","live",1,AJ(87))
e("ayumu-imazu-budokan","tokyo","2027-01-31","2027-01-31","budo","Ayumu Imazu LIVE 2027 at 日本武道館","Ayumu Imazu LIVE 2027 at Nippon Budokan","live",1,AJ(87))
e("chotokkyu-dish-yoyogi","tokyo","2026-12-25","2026-12-25","yoyogi","超特急×DISH// 結成15周年記念イベント","BULLET TRAIN x DISH// 15th Anniversary Special Event","live",1,AJ(84))
e("yunho-tokyo-taikan","tokyo","2026-12-12","2026-12-13","taikan","U-KNOW PROJECT 26 : SCENE #1 – EDIT（東方神起 ユンホ）","U-KNOW (TVXQ Yunho) PROJECT 26 Japan","live",1,AJ(151))
e("ellegarden-toyota-arena","tokyo","2026-12-08","2026-12-08","toyota","ELLEGARDEN Bad For Education Tour II (2026) GRAND FINAL","ELLEGARDEN Bad For Education Tour II (2026) Grand Final","live",1,"https://eplus.jp/sf/venue/1351450/events")
# Nagoya (Gaishi)
e("kitani-gaishi","nagoya","2026-12-05","2026-12-05","gaishi","キタニタツヤ 2026-2027 アリーナツアー","Tatsuya Kitani 2026-2027 Arena Tour","live",1,AJ(70))
e("yunho-gaishi","nagoya","2026-12-08","2026-12-09","gaishi","U-KNOW PROJECT 26 : SCENE #1 – EDIT（東方神起 ユンホ）","U-KNOW (TVXQ Yunho) PROJECT 26 Japan","live",1,AJ(70))
e("macaroni-gaishi","nagoya","2026-12-26","2026-12-26","gaishi","マカロニえんぴつ 2026 全国アリーナツアー","Macaroni Enpitsu 2026 Arena Tour","live",1,AJ(70))
e("saucydog-gaishi","nagoya","2027-01-13","2027-01-14","gaishi","Saucy Dog 2026-2027 全国アリーナツアー","Saucy Dog 2026-2027 Arena Tour","live",1,AJ(70))
# Hiroshima
e("conti-new-fes-hiroshima-2026","hiroshima","2026-12-05","2026-12-06","hga","HIROSHIMA CONTI-NeW FeS 2026","HIROSHIMA CONTI-NeW FeS 2026","fes",1,"https://eplus.jp/sf/venue/7300060/events")
# Sports
e("wintercup-2026","tokyo","2026-12-23","2026-12-29","wc","SoftBank ウインターカップ2026（第79回全国高等学校バスケットボール選手権）","SoftBank Winter Cup 2026 (National High School Basketball Championship)","sports",1,"https://wintercup2026.japanbasketball.jp/outline/")
e("univ-rugby-semifinal-2027","tokyo","2027-01-02","2027-01-02","kokuritsu","第63回全国大学ラグビー選手権 準決勝","63rd All-Japan University Rugby Championship Semi-finals","sports",1,"https://ragasapu.com/news/university-championship-2026-27-schedule")
e("hs-soccer-semifinal-2027","tokyo","2027-01-09","2027-01-09","kokuritsu","第105回全国高校サッカー選手権 準決勝","105th All Japan High School Soccer Championship Semi-finals","sports",1,"https://l-tike.com/ntvzero/event/hs105.html")
e("univ-rugby-final-2027","tokyo","2027-01-10","2027-01-10","kokuritsu","第63回全国大学ラグビー選手権 決勝","63rd All-Japan University Rugby Championship Final","sports",2,"https://ragasapu.com/news/university-championship-2026-27-schedule")

ex={x['id'] for x in json.load(open(r'C:\Users\user\HotelYoho\public\data\events.json',encoding='utf-8'))}
ids=[x['id'] for x in R]
assert len(ids)==len(set(ids)) and not (set(ids)&ex)
with open(OUT,'w',encoding='utf-8',newline='\n') as f:
    f.write(json.dumps(R,ensure_ascii=False,indent=1))
from collections import Counter
print(len(R),dict(Counter(x['city'] for x in R)))
