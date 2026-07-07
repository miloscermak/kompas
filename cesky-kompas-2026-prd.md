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

1. **Intro obrazovka:** název, 3 věty úvodu, tlačítko "Jedu na to". Malým písmem disclaimer.
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

Struktura `questions` (pole objektů): `id`, `axis` (1 až 4), `text`, `pole` (+1 pokud souhlas táhne ke kladnému pólu osy, -1 pokud k zápornému).

Kladné póly os: osa 1 = Brusel, osa 2 = Kavárna, osa 3 = Bude líp, osa 4 = Úspěch.

### Osa 1: BRUSEL vs TRUMP

| id | text | pole |
|---|---|---|
| 1 | Česko má podporovat Ukrajinu, i zbraněmi. | +1 |
| 2 | Nevadí mi, když na úřadech a školách visí ukrajinské vlajky. | +1 |
| 3 | Česko má přijmout euro. | +1 |
| 4 | Přistěhovalci jsou pro Česko přínos. | +1 |
| 5 | Čím víc solárních panelů a větrníků, tím líp. | +1 |

### Osa 2: KAVÁRNA vs ZBYTEK ČESKA

| id | text | pole |
|---|---|---|
| 6 | Radši Fiala než Babiš. | +1 |
| 7 | Stejnopohlavní páry mají mít manželství včetně adopcí. | +1 |
| 8 | Veřejnoprávní média jsou přežitek. | -1 |
| 9 | Školy mají s dětmi víc mluvit o genderu a rozmanitosti. | +1 |
| 10 | Piráti a spol. řeší gender a inkluzi místo skutečných problémů lidí. | -1 |

### Osa 3: BUDE LÍP vs BYLO LÍP

| id | text | pole |
|---|---|---|
| 11 | Dnešní dvacátníci se budou mít hůř než jejich rodiče. | -1 |
| 12 | AI sebere víc práce, než kolik jí vytvoří. | -1 |
| 13 | Za deset let bude Česko lepší místo k životu než dnes. | +1 |
| 14 | Do deseti let bude Evropa ve válce s Ruskem. | -1 |
| 15 | Mobily mají být ve školách plošně zakázané. | -1 |

### Osa 4: ÚSPĚCH vs SOLIDARITA

| id | text | pole |
|---|---|---|
| 16 | Česko má zavést majetkovou daň pro nejbohatší. | -1 |
| 17 | Kdo odmítne nabízenou práci, má přijít o dávky. | +1 |
| 18 | Stát má sám stavět nájemní byty, i za cenu vyšších daní. | -1 |
| 19 | Na vysokých školách se má platit školné. | +1 |
| 20 | Absolventi by prvních pět let po škole neměli platit daň z příjmu. | -1 |

### Rozstřel (mimo skóre)

Text: **Co je největší hrozba pro Česko?**
Možnosti (vybírá se právě jedna): Rusko / Přistěhovalci / AI / Trump / Změna klimatu.

## 6. Skórování

Pro každou osu: `skóre = součet (odpověď × pole)` přes 5 otázek osy. Rozsah -10 až +10 na osu.

Výsledek uživatele = bod `[a1, a2, a3, a4]` ve 4D.

**Dvojník:** euklidovská vzdálenost `d` ke každé figuře ve 4D. Dvojník = figura s nejmenší `d`. Shoda v procentech: `match = round(100 × (1 - d / 40))`, kde 40 je maximální možná vzdálenost (sqrt(4 × 20²)). Zobrazit i druhého a třetího nejbližšího ("Blízko máš taky k: ...").

**Kvadrant:** určen znaménky osy 1 (X) a osy 3 (Y). Pokud je |skóre| na obou hlavních osách ≤ 2, zobrazit místo kvadrantu label "Chameleon středu" (ochrana proti Britmonkeyho problému, kdy nulový střed nemá jméno).

**Odznaky:** osa 2 kladná → "Tým Kavárna", záporná → "Tým Zbytek Česka". Osa 4 kladná → "Meritokrat", záporná → "Solidarista". Při |skóre| ≤ 2 → "Nerozhodnutý".

## 7. Obrazovka výsledku

Shora dolů:

1. **Název kvadrantu** velkým písmem + jedna vtipná charakteristika (viz texty níže).
2. **2D mapa:** čtverec, osa X: Trump (vlevo) ↔ Brusel (vpravo), osa Y: Bylo líp (dole) ↔ Bude líp (nahoře). Bod uživatele výrazný, animovaně "doletí" na místo. V rozích mapy popisky kvadrantů. Volitelně slabě zobrazené body figur (v1 stačí bez nich).
3. **Dva slidery** pro osy 2 a 4 s odznaky.
4. **Dvojník:** fotka nezobrazujeme (autorská práva), místo ní iniciály v barevném kolečku. Jméno, procento shody, jedna věta popisu figury. Pod tím menší "Blízko máš taky k: X (Y %), Z (W %)".
5. **Hrozba** z rozstřelu: "Tvoje hrozba: Rusko" s ikonkou.
6. Tlačítka: Stáhnout kartičku / Zkopírovat odkaz / Zkusit znovu.

**Sdílení odkazem:** výsledek zakódovat do URL (`?r=` + base64 ze 4 skóre + index hrozby). Otevření takového odkazu zobrazí rovnou výsledkovou obrazovku s tlačítkem "Zkus to taky". Odpovědi na jednotlivé otázky se do URL nedávají.

## 8. Sdílecí kartička (PNG)

Generovat přes Canvas API, bez externích knihoven. Dva formáty:

- 1080 × 1350 px (Instagram/stories poměr 4:5) - primární
- 1200 × 630 px (X/Facebook link preview) - sekundární, stačí v2

Obsah kartičky: název testu, mini-mapa s bodem, název kvadrantu, "Můj politický dvojník: JMÉNO (XX %)", "Největší hrozba: X", URL webu. Design konzistentní s webem, čitelné i jako miniatura.

## 9. Texty (mikrocopy)

**Název webu:** Český kompas 2026
**Podtitulek:** Kde stojíš v roce 2026? Zjisti to za tři minuty.

**Intro (finální znění, revize červenec 2026):**
"Pravice a levice jsou mrtvé. Skutečná mapa Česka 2026 je nakreslená jinak: Brusel proti Trumpovi, kavárna proti zbytku země, bude líp proti bylo líp. Dvacet výroků, žádné přemýšlení, střílej od pasu. Na konci se dozvíš, kde jseš a který český politik je tvůj tajný dvojník. Jseš ready? Tak jedem."

**Disclaimer (patička, malé písmo, revize červenec 2026 kvůli ukládání výsledků):**
"Tohle není sociologický výzkum, je to hra. Žádné cookies, žádné sledování — ukládáme jen anonymní výsledky pro souhrnnou statistiku."

**Názvy a popisky kvadrantů:**

| Kvadrant | Název | Popisek (1 věta na výsledkovce) |
|---|---|---|
| Brusel + Bude líp | Bruselský sluníčkář | Věříš Evropě, budoucnosti a tomu, že se to nakonec nějak vyřeší. Kéž bys měl pravdu. |
| Brusel + Bylo líp | Ustaraný demokrat | Fandíš Západu, ale v noci nespíš. Piješ kávu a scrolluješ zprávy, i když víš, že nemáš. |
| Trump + Bude líp | Národní buditel 2.0 | Evropě nevěříš, sobě jo. Až se to celé sesype, ty budeš připravený. |
| Trump + Bylo líp | Hospodský prorok | Všechno jsi říkal předem a nikdo tě neposlouchal. Aspoň že to pivo ještě stojí za to. |
| Střed (|X| ≤ 2 a |Y| ≤ 2) | Chameleon středu | Vidíš argumenty všech stran. To je buď moudrost, nebo alibismus, a ty sám nevíš, co z toho. |

**Odznaky:** Tým Kavárna / Tým Zbytek Česka, Meritokrat / Solidarista, Nerozhodnutý.

**Tlačítka:** Jedu na to / Stáhnout kartičku / Zkopírovat odkaz / Zkusit znovu / Zkus to taky.

## 10. Data: figury

Struktura `figures`: `name`, `desc` (do 8 slov), `scores: [a1, a2, a3, a4]` v rozsahu -10 až +10 (osy: Brusel/Trump, Kavárna/Zbytek, Bude líp/Bylo líp, Úspěch/Solidarita).

**DŮLEŽITÉ: následující skóre jsou první subjektivní odhady, které Miloš před spuštěním ručně zreviduje.** Implementovat tak, aby editace `figures.json` (resp. `data.js`) nevyžadovala zásah do kódu.

| name | desc | a1 | a2 | a3 | a4 |
|---|---|---|---|---|---|
| Petr Pavel | prezident, generál ve výslužbě | 8 | 5 | 3 | 2 |
| Andrej Babiš | premiér, šéf ANO | -4 | -7 | 2 | -3 |
| Petr Fiala | expremiér, šéf ODS | 7 | 6 | -1 | 6 |
| Tomio Okamura | šéf SPD | -9 | -9 | -6 | -2 |
| Filip Turek | Motoristé, europoslanec | -8 | -8 | -2 | 5 |
| Kateřina Konečná | šéfka Stačilo!, europoslankyně | -8 | -6 | -4 | -8 |
| Danuše Nerudová | ekonomka, europoslankyně | 8 | 8 | 4 | -2 |
| Zdeněk Hřib | Piráti, náměstek primátora | 7 | 7 | 2 | -1 |
| Vít Rakušan | šéf STAN | 7 | 5 | 1 | 0 |
| Markéta Pekarová Adamová | TOP 09 | 7 | 6 | 0 | 6 |
| Alena Schillerová | ANO, ekonomika | -3 | -6 | 1 | -3 |
| Karel Havlíček | ANO, průmysl | -2 | -4 | 2 | 0 |
| Miloš Zeman | exprezident | -7 | -8 | -3 | -1 |
| Václav Klaus | exprezident | -6 | -7 | -5 | 7 |
| Jindřich Rajchl | šéf PRO | -9 | -9 | -7 | 1 |
| Mikuláš Minář | aktivista, Milion chvilek | 6 | 6 | -2 | -4 |
| Olga Richterová | Piráti | 7 | 7 | 1 | -5 |
| Marian Jurečka | KDU-ČSL | 4 | -2 | 0 | -1 |
| Lubomír Zaorálek | sociální demokrat | 2 | 0 | -2 | -5 |
| Xaver Veselý | moderátor | -6 | -8 | -3 | 1 |
| Daniel Kroupa | filozof, disident | 7 | 4 | -1 | 3 |
| Erik Best | komentátor, Fleet Sheet | -4 | -3 | -1 | 2 |

Poznámka k pokrytí: Jurečka, Zaorálek, Havlíček a Best drží střed mapy (poučení z kritiky Britmonkeyho, kde bez středových figur vyhrával "nejbližší umírněný" defaultně). Kvadrant Trump + Bude líp je nejřidší (Turek), při revizi zvážit doplnění.

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

Po dokončení testu web odešle anonymní výsledek do Google Sheets přes Apps Script webhook (`apps-script/webhook.gs`, vzor převzat z projektu EvalAI): timestamp, 4 skóre, kvadrant, dvojník + shoda, hrozba, délka průchodu, user agent. Odpovědi na jednotlivé otázky se neukládají. Na výsledkovce je dobrovolný demografický blok (věk, pohlaví, velikost bydliště, vzdělání) s tlačítky Odeslat / Přeskočit — doplní se k už zapsanému řádku podle `submission_id`. Sdílený odkaz (`?r=`) nic neodesílá. Když je `WEBHOOK_URL` v `data.js` prázdné nebo požadavek selže, web funguje beze změny.
