# Český kompas 2026

Klikací webová aplikace: 20 výroků + 1 bonusový rozstřel → pozice na politické mapě Česka 2026, "politický dvojník" a sdílecí kartička (PNG). Hra, ne sociologie. Celý průchod pod 3 minuty.

**Kompletní zadání je v [cesky-kompas-2026-prd.md](cesky-kompas-2026-prd.md) — před jakoukoliv prací na featurách ho přečti.** Tento soubor jen shrnuje klíčová pravidla.

## Stack a struktura

- Vanilla HTML + CSS + JS. **Žádný framework, žádný build krok, žádné externí knihovny** (ani html2canvas — kartička se kreslí přes Canvas API).
- Soubory: `index.html`, `style.css`, `app.js`, `data.js` (otázky + figury jako JS modul kvůli file://), `README.md` (návod na editaci dat pro neprogramátora).
- Hosting: GitHub Pages, repo `cesky-kompas-2026` na účtu miloscermak.
- **Musí fungovat přes `file://` i https** — proto data v `data.js`, ne fetch JSON.

## Tvrdá omezení

- Žádný backend, databáze, cookies, analytika, sběr dat.
- Mobil first: primární viewport 390 px.
- Payload pod 200 kB. Systémový font stack (žádný Google Fonts CDN).
- Přístupnost: klávesy 1–5 pro odpovědi, Enter pro pokračování, kontrast AA, aria-labely.
- Žádné fotky osobností (autorská práva) — iniciály v barevných kolečkách.

## Logika (detaily v PRD, sekce 5–6)

- 4 osy: Brusel/Trump, Kavárna/Zbytek Česka, Bude líp/Bylo líp, Úspěch/Solidarita. Škála odpovědí −2 až +2, každá otázka má `pole` (+1/−1) pro reverse scoring.
- Skóre osy = součet (odpověď × pole), rozsah −10 až +10.
- Dvojník = nejmenší euklidovská vzdálenost ve 4D; shoda = `round(100 × (1 − d/40))`.
- Střed (|X| ≤ 2 a |Y| ≤ 2) = "Chameleon středu", ne kvadrant.
- Sdílení: výsledek v URL (`?r=` + base64 ze 4 skóre + index hrozby), otevření zobrazí rovnou výsledek.

## Zásady práce

- Editace otázek a figur v `data.js` nesmí vyžadovat zásah do logiky — skóre figur bude Miloš ručně revidovat.
- Jednotkové testy skórování a párování dvojníka (prostý JS, spustitelný v node).
- Texty a mikrocopy brát doslova z PRD (sekce 9) — neupravovat, nevymýšlet vlastní.
- V2 nápady (PRD sekce 13) neimplementovat.

## Ověření (akceptační kritéria, PRD sekce 12)

- Test skórování: napsat podle sloupce `pole` v datech, ne opsat z příkladu v PRD (ten je záměrně chybný).
- Kartička se stáhne na iOS Safari, Android Chrome, desktop Chrome/Firefox.
- Lighthouse mobile: performance a accessibility ≥ 90.
