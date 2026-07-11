# PRD: Český kompas 2026

Verze 1.0, červenec 2026. Zadání pro implementaci v Claude Code. Cíl: funkční web nasaditelný na GitHub Pages.

---

## 1. Co stavíme

Jednoduchá klikací webová aplikace: 20 výroků + 1 bonusový rozstřel, výsledkem je pozice na politické mapě Česka 2026, "politický dvojník" mezi českými osobnostmi a sdílecí kartička ke stažení.

Inspirace: britmonkey.com/2020s-political-compass (4 osy, párování s osobnostmi ve 4D prostoru). Naše verze je kratší (20 otázek místo 64) a česká.

**Cílový pocit:** hra, ne sociologie. Rychlé, drzé, screenshotovatelné. Celý průchod pod 3 minuty.

## 2. Co nestavíme (non-goals)

- Žádný backend, žádná databáze, žádné ukládání odpovědí na server. *(Revize červenec 2026: výsledky — nikoli odpovědi na jednotlivé otázky — se anonymně ukládají do Google Sheets přes Apps Script webhook, viz sekce 14.)*
- Žádná registrace, žádné cookies vyžadující lištu, žádný sběr osobních dat.
- Žádná analytika v v1 (případný Plausible/GoatCounter až ve v2).
- Žádná anglická verze.

## 3. Technické zadání

- **Stack:** vanilla HTML + CSS + JS. Bez frameworku, bez build kroku.
- **Struktura souborů:**
  - `index.html` - aplikace
  - `style.css` - styly
  - `app.js` - logika
  - `data/questions.json` - otázky
  - `data/figures.json` - osobnosti
  - `README.md` - jak upravit otázky a figury bez znalosti kódu
- **Hosting:** GitHub Pages, repo `cesky-kompas-2026` na účtu miloscermak. Vše musí fungovat přes `file://` i přes https (žádné CORS problémy: JSON načítat fetch-em s fallbackem, nebo data vložit jako JS modul `data.js`, což je preferovaná varianta kvůli file://).
- **Mobil first:** primární viewport 390 px. Desktop je jen širší varianta.
- **Výkon:** žádné externí knihovny kromě volitelného html2canvas NEBO vlastní kreslení kartičky přes Canvas API (preferováno, nulová závislost). Celkový payload pod 200 kB bez fontů.
- **Fonty:** systémový font stack, případně jeden variabilní font self-hosted. Žádný Google Fonts CDN.
- **Přístupnost:** ovladatelné klávesnicí (1 až 5 pro odpovědi, Enter pro pokračování), kontrast AA, aria-labely na tlačítkách.

## 4. Uživatelský průchod

1. **Intro obrazovka:** název, 3 věty úvodu, tlačítko "Chci hlasovat". Malým písmem disclaimer.
2. **Otázky 1 až 20:** jedna otázka na obrazovku. Nahoře progress bar (X/20), uprostřed výrok velkým písmem, pod ním 5 tlačítek nad sebou (mobil) / vedle sebe (desktop). Kliknutí = odpověď + automatický posun na další otázku (bez potvrzovacího tlačítka). Tlačítko zpět (šipka) pro opravu předchozí odpovědi.
3. **Rozstřel (otázka 21):** jiný vizuál (aby bylo jasné, že je to bonus), 5 možností, výběr jedné.
4. **Výsledek:** viz sekce 7.
5. **Sdílení:** tlačítko "Stáhnout kartičku" (PNG) + tlačítko "Zkopírovat odkaz" (URL s výsledkem) + "Zkusit znovu".

Pořadí otázek: **promíchané napříč osami** (ne 5 za sebou ze stejné osy). Pevné pořadí definované v datech, ne náhodné (aby všichni sdíleli stejný zážitek). Doporučené pořadí: 1, 11, 6, 16, 2, 12, 7, 17, 3, 13, 8, 18, 4, 14, 9, 19, 5, 15, 10, 20 (rotace os A-C-B-D).

## 5. Data: otázky

Škála odpovědí u všech výroků:

| Tlačítko | Hodnota |
|---|---|
| Rozhodně souhlasím | +2 |
| Spíš souhlasím | +1 |
| Nevím / je mi to jedno | 0 |
| Spíš nesouhlasím | -1 |
| Rozhodně nesouhlasím | -2 |

Struktura `questions` (pole objektů): `id`, `axis` (1 = X, 2 = Y), `text`, `pole` (+1 pokud souhlas táhne ke kladnému pólu osy, -1 pokud k zápornému).

Kladné póly os: osa X = Lepšolidi, osa Y = Já. *(Póly osy Y se uživateli ukazují jako „Já" a „My" — méně návodné a vtipnější než Jedinec/Kolektiv.)*

*(Velká revize červenec 2026: čtyři osy sloučeny do dvou. Původní osy Brusel/Trump a Kavárna/Zbytek Česka byly téměř dokonale korelované (r = 0,95 na odhadech figur) — sloučeny do osy Dezoláti/Lepšolidi. Druhá osa je ekonomická (Kolektiv/Jedinec), protože je na první ose nezávislá (r = 0,06), zatímco optimismus/pesimismus koreloval (r = 0,57) a mapa by degenerovala k diagonále. Otázka „Líp už bylo?" přesunuta do druhého rozstřelu.)*

### Osa X: DEZOLÁTI vs LEPŠOLIDI (kladný pól = Lepšolidi)

| id | text | pole |
|---|---|---|
| 1 | Rusko je agresor, napadlo Ukrajinu. | +1 |
| 2 | Brusel je horší než Trump. | -1 |
| 3 | Česko má přijmout euro. | +1 |
| 4 | Přistěhovalci jsou pro Česko přínos. | +1 |
| 5 | Čím víc solárních panelů a větrníků, tím líp. | +1 |
| 6 | Radši Fiala než Babiš. | +1 |
| 7 | Souhlasím s adopcí dětí homosexuálními páry. | +1 |
| 8 | Veřejnoprávní média jsou přežitek. | -1 |
| 9 | Kdo jí maso, přispívá k ničení planety. | +1 |
| 10 | Gender je pseudoproblém. | -1 |

### Osa Y: MY vs JÁ (kladný pól = Já)

| id | text | pole |
|---|---|---|
| 11 | Bohaté musíme víc zdanit. | -1 |
| 12 | Sociálních dávek je v Česku příliš moc, lidem to bere motivaci pracovat. | +1 |
| 13 | Lidi mají vlastnit jen byty, ve kterých sami bydlí. | -1 |
| 14 | Na vysokých školách se má platit školné. | +1 |
| 15 | Soukromé bazény a klimatizace jsou zlo. | -1 |
| 16 | Zdravotnictví má být zadarmo. | -1 |
| 17 | Kdo je chudý, může si za to většinou sám. | +1 |
| 18 | Úspěšní lidé si své bohatství zaslouží. | +1 |
| 19 | Je správné počítat pokuty a sankce podle příjmů. | -1 |
| 20 | Čím míň stát lidem zasahuje do života, tím líp. | +1 |

### Rozstřely (mimo skóre, dvě otázky za sebou)

1. **Co je největší hrozba pro Česko?** — Rusko / Přistěhovalci / AI / Trump / Změna klimatu.
2. **Líp už bylo, nebo ještě bude?** — Líp už bylo / Líp ještě bude.

## 6. Skórování

*(Revize červenec 2026: 2D metodika.)*

Pro každou osu: `skóre = součet (odpověď × pole)` přes 10 otázek osy. Rozsah -20 až +20 na osu.

Výsledek uživatele = bod `[x, y]` ve 2D.

**Dvojník:** euklidovská vzdálenost `d` ke každé figuře ve 2D. Dvojník = figura s nejmenší `d`. Shoda v procentech: `match = round(100 × (1 - d / 56,57))`, kde 56,57 je maximální možná vzdálenost (úhlopříčka mapy, sqrt(2 × 40²)). Zobrazit i druhého a třetího nejbližšího ("Blízko máš taky k: ...").

**Kvadrant:** určen znaménky os. Pokud je |skóre| na obou osách ≤ 4, zobrazit místo kvadrantu label "Strážce středu" (ochrana proti Britmonkeyho problému, kdy nulový střed nemá jméno).

**Odznaky:** zrušeny s přechodem na 2D (druhá dvojice os zmizela, slidery na výsledkovce také).

## 7. Obrazovka výsledku

Shora dolů:

1. **Název kvadrantu** velkým písmem + jedna vtipná charakteristika (viz texty níže).
2. **2D mapa:** čtverec, osa X: Dezoláti (vlevo) ↔ Lepšolidi (vpravo), osa Y: My (dole) ↔ Já (nahoře). Bod uživatele výrazný, animovaně "doletí" na místo. V rozích mapy popisky kvadrantů. Volitelně slabě zobrazené body figur (v1 stačí bez nich).
3. **Dvojník:** fotka nezobrazujeme (autorská práva), místo ní iniciály v barevném kolečku. Jméno, procento shody, jedna věta popisu figury. Pod tím menší "Blízko máš taky k: X (Y %), Z (W %)".
4. **Rozstřely:** "Tvoje hrozba: Rusko" s ikonkou + "Líp už bylo / Líp ještě bude" s ikonkou.
5. Tlačítka: Stáhnout kartičku / Zkopírovat odkaz / Zkusit znovu.

**Sdílení odkazem:** výsledek zakódovat do URL (`?r=` + base64 ze 2 skóre + index hrozby + index líp). Otevření takového odkazu zobrazí rovnou výsledkovou obrazovku s tlačítkem "Zkus to taky". Odpovědi na jednotlivé otázky se do URL nedávají.

## 8. Sdílecí kartička (PNG)

Generovat přes Canvas API, bez externích knihoven. Dva formáty:

- 1080 × 1350 px (Instagram/stories poměr 4:5) - primární
- 1200 × 630 px (X/Facebook link preview) - sekundární, stačí v2

Obsah kartičky: název testu, mini-mapa s bodem, název kvadrantu, "Můj politický dvojník: JMÉNO (XX %)", "Největší hrozba: X", "A jinak: líp už bylo / líp ještě bude", URL webu. Design konzistentní s webem, čitelné i jako miniatura.

## 9. Texty (mikrocopy)

**Název webu:** Český kompas 2026
**Podtitulek (revize červenec 2026):** Kde jsi na politické mapě Česka?

**Intro (revize červenec 2026 pro 2D osy — prostřední věta je návrh k Milošově revizi):**
"Pravice a levice jsou mrtvé. Skutečná mapa Česka 2026 je nakreslená jinak: dezoláti proti lepšolidem, každý sám za sebe proti všichni společně. Dvacet výroků, žádné přemýšlení, střílej od pasu. Na konci se dozvíš, kde jseš a který český politik je tvůj tajný dvojník. Jseš ready? Tak jedem."

**Disclaimer (patička, malé písmo, revize červenec 2026 kvůli ukládání odpovědí):**
"Tohle není sociologický výzkum, je to hra. Žádné cookies, žádné sledování — ukládáme jen anonymní odpovědi pro souhrnnou statistiku."

**Názvy a popisky kvadrantů (revize červenec 2026 pro 2D metodiku; popisky jsou první návrhy k revizi):**

| Kvadrant | Název | Popisek (1 věta na výsledkovce) |
|---|---|---|
| Lepšolidi + Já | Sluníčkový byznysmen | Věříš Evropě, trhu a hlavně sám sobě. Svět je podle tebe fér soutěž — zatím ti vychází. |
| Lepšolidi + My | Rovnostář z kavárny | Solidarita pro tebe není sprosté slovo. Kávu piješ fér, daně platíš rád a svědomí máš čisté. |
| Dezoláti + Já | Pragmatická konzerva | Brusel ti nemá co mluvit do života a stát ti nemá sahat na peníze. Co je potřeba, zařídíš si sám. |
| Dezoláti + My | Socan vlastenec | Stát se má postarat o svoje lidi. O ty naše. Kdysi to tu drželo pohromadě líp — a šlo by to zas. |
| Střed (|X| ≤ 4 a |Y| ≤ 4) | Strážce středu | Vidíš argumenty všech stran. To je buď moudrost, nebo alibismus, a ty sám nevíš, co z toho. |

**Odznaky:** zrušeny (2D metodika).

**Tlačítka:** Chci hlasovat / Stáhnout kartičku / Zkopírovat odkaz / Zkusit znovu / Zkus to taky.

## 10. Data: figury

Struktura `figures`: `name`, `desc` (do 8 slov), `scores: [x, y]` v rozsahu -20 až +20 (x: Dezoláti/Lepšolidi, y: My/Já).

**DŮLEŽITÉ: následující skóre jsou první subjektivní odhady, které Miloš před spuštěním ručně zreviduje.** Implementovat tak, aby editace `data.js` nevyžadovala zásah do kódu.

*(Revize červenec 2026: skóre převedena do 2D a rozprostřena podle simulace pokrytí — `node sim.js`. Cíl: každá figura dosažitelná, žádná nedominuje, žádná dvojčata. Nejčastější dvojník vyhrává v 10 % mřížky, nejvzácnější v 1,9 %.)*

| name | desc | x | y |
|---|---|---|---|
| Petr Pavel | prezident, generál ve výslužbě | 13 | 3 |
| Andrej Babiš | premiér, šéf ANO | -10 | -5 |
| Petr Fiala | expremiér, šéf ODS | 12 | 14 |
| Tomio Okamura | šéf SPD | -18 | -8 |
| Filip Turek | Motoristé, europoslanec | -15 | 12 |
| Kateřina Konečná | šéfka Stačilo!, europoslankyně | -14 | -16 |
| Danuše Nerudová | ekonomka, europoslankyně | 17 | 1 |
| Zdeněk Hřib | Piráti, náměstek primátora | 13 | -3 |
| Vít Rakušan | šéf STAN | 7 | 1 |
| Markéta Pekarová Adamová | TOP 09 | 14 | 8 |
| Alena Schillerová | ANO, ekonomika | -7 | -9 |
| Karel Havlíček | ANO, průmysl | -5 | 0 |
| Miloš Zeman | exprezident | -14 | -6 |
| Václav Klaus | exprezident | -12 | 15 |
| Jindřich Rajchl | šéf PRO | -17 | 5 |
| Mikuláš Minář | aktivista, Milion chvilek | 11 | -8 |
| Olga Richterová | Piráti | 13 | -12 |
| Marian Jurečka | KDU-ČSL | 2 | -2 |
| Lubomír Zaorálek | sociální demokrat | 1 | -11 |
| Xaver Veselý | moderátor | -13 | 0 |
| Daniel Kroupa | filozof, disident | 7 | 6 |
| Erik Best | komentátor, Fleet Sheet | -6 | 4 |

Poznámka k pokrytí: Jurečka, Havlíček, Best, Rakušan a Zaorálek drží střed mapy (poučení z kritiky Britmonkeyho, kde bez středových figur vyhrával "nejbližší umírněný" defaultně). Všechny čtyři kvadranty jsou obsazené 4–6 figurami.

## 11. Design

- **Tón vizuálu:** hravý, kontrastní, trochu jako volební plakát, který se nebere vážně. Ne korporátní šeď, ne úřední vážnost.
- **Barvy:** každá osa má svou dvojici barev (např. osa 1: EU modrá vs červená kšiltovka). Kvadranty mapy podbarvené světlými odstíny. Konkrétní paletu nechávám na implementaci, podmínka: kontrast AA a čitelnost kartičky jako miniatury.
- **Animace:** střídmé. Posun mezi otázkami (slide), dolet bodu na mapu, počítadlo procent shody. Nic dalšího.
- **Žádné fotky osobností** (autorská práva): iniciály v barevných kolečkách.

## 12. Akceptační kritéria

1. Průchod 20 otázek + rozstřel funguje na mobilu (390 px) i desktopu, klávesnicí i dotykem.
2. Skórování odpovídá sekci 6 včetně reverse scoringu. Testovací případ: samé "Rozhodně souhlasím" musí dát skóre [10, 6, -8, -6] (ověřit ručně proti tabulkám polí: osa 1 = +10, osa 2 = 2+2-2+2-2 = +2... POZOR, implementátor musí spočítat správně podle sloupce pole, tento příklad slouží jako připomínka, že test má být napsán, ne opsán).
3. Jednotkové testy skórování a párování dvojníka (stačí prostý JS test spustitelný v konzoli nebo node).
4. Kartička se vygeneruje a stáhne na iOS Safari, Android Chrome a desktop Chrome/Firefox.
5. Odkaz s `?r=` otevře výsledek bez nutnosti vyplňovat test.
6. Editace otázky nebo figury v datovém souboru se projeví bez zásahu do logiky.
7. Web funguje po otevření `index.html` z disku (file://) i z GitHub Pages.
8. Lighthouse mobile: performance a accessibility ≥ 90.

## 13. V2 nápady (neimplementovat teď)

- ~~Anonymní počítadlo odpovědí (pro navazující článek "Jak odpovídalo Česko")~~ — implementováno, viz sekce 14.
- Body všech figur zobrazené na mapě s přepínačem.
- Formát kartičky 1200 × 630 pro link preview + OG meta tagy generované z výsledku.
- Váhy otázek, pokud pilot ukáže deformaci os.
- Otázka 20 (daňové prázdniny absolventům): sledovat v pilotu, polarita je nejistá, případně vyměnit za náhradníka z návrhu projektu.

## 14. Ukládání výsledků a demografie (doplněno červenec 2026)

Po dokončení testu web odešle anonymní výsledek do Google Sheets přes Apps Script webhook (`apps-script/webhook.gs`, vzor převzat z projektu EvalAI): timestamp, 2 skóre, kvadrant, dvojník + shoda, hrozba, líp už bylo/ještě bude, délka průchodu, odpovědi na jednotlivé otázky (`answers_json` — kvůli zpětnému přepočtu při změně metodiky a per-otázkové statistice pro článek), user agent. Zapisuje se do listu `vysledky2` (v1 data zůstávají v listu `vysledky`). Na výsledkovce je dobrovolný demografický blok (věk, pohlaví, velikost bydliště, vzdělání) s tlačítky Odeslat / Přeskočit — doplní se k už zapsanému řádku podle `submission_id`. Sdílený odkaz (`?r=`) nic neodesílá. Když je `WEBHOOK_URL` v `data.js` prázdné nebo požadavek selže, web funguje beze změny.
