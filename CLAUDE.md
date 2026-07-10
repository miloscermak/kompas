# Český kompas 2026

Klikací webová aplikace: 20 výroků + 1 bonusový rozstřel → pozice na politické mapě Česka 2026, "politický dvojník" a sdílecí kartička (PNG). Hra, ne sociologie. Celý průchod pod 3 minuty.

**Kompletní zadání je v [cesky-kompas-2026-prd.md](cesky-kompas-2026-prd.md) — před jakoukoliv prací na featurách ho přečti.** Tento soubor jen shrnuje klíčová pravidla.

## Stack a struktura

- Vanilla HTML + CSS + JS. **Žádný framework, žádný build krok, žádné externí knihovny** (ani html2canvas — kartička se kreslí přes Canvas API).
- Soubory: `index.html`, `style.css`, `app.js`, `data.js` (otázky + figury jako JS modul kvůli file://), `README.md` (návod na editaci dat pro neprogramátora).
- Hosting: Netlify (nasazuje se z repa `github.com/miloscermak/kompas`, bez build kroku, viz `netlify.toml`).
- **Musí fungovat přes `file://` i https** — proto data v `data.js`, ne fetch JSON.

## Tvrdá omezení

- Žádné cookies, žádné sledování, žádná analytika třetích stran. Výsledky se anonymně ukládají do Google Sheetu přes Apps Script webhook (`apps-script/webhook.gs`, URL v `data.js` jako `WEBHOOK_URL`); demografie na výsledkovce je dobrovolná. Když webhook selže nebo chybí, web musí fungovat dál.
- Mobil first: primární viewport 390 px.
- Payload pod 200 kB. Systémový font stack (žádný Google Fonts CDN).
- Přístupnost: klávesy 1–5 pro odpovědi, Enter pro pokračování, kontrast AA, aria-labely.
- Žádné fotky osobností (autorská práva) — iniciály v barevných kolečkách.

## Logika (detaily v PRD, sekce 5–6)

- 2 osy: X = Dezoláti/Lepšolidi, Y = My/Já (jedinec/kolektiv), 10 otázek na osu. Škála odpovědí −2 až +2, každá otázka má `pole` (+1/−1) pro reverse scoring.
- Skóre osy = součet (odpověď × pole), rozsah −20 až +20.
- Dvojník = nejmenší euklidovská vzdálenost ve 2D; shoda = `round(100 × (1 − d/56,57))`. Po úpravě figur spustit `node sim.js` (kontrola pokrytí a dvojčat).
- Střed (|X| ≤ 4 a |Y| ≤ 4) = "Chameleon středu", ne kvadrant.
- Dva rozstřely mimo skóre: hrozba (5 možností) a "Líp už bylo, nebo teprve bude?" (2 možnosti).
- Sdílení: výsledek v URL (`?r=` + base64 ze 2 skóre + index hrozby + index líp), otevření zobrazí rovnou výsledek.

## Zásady práce

- Editace otázek a figur v `data.js` nesmí vyžadovat zásah do logiky — skóre figur bude Miloš ručně revidovat.
- Jednotkové testy skórování a párování dvojníka (prostý JS, spustitelný v node).
- Texty a mikrocopy brát doslova z PRD (sekce 9) — neupravovat, nevymýšlet vlastní.
- V2 nápady (PRD sekce 13) neimplementovat.

## Ověření (akceptační kritéria, PRD sekce 12)

- Test skórování: napsat podle sloupce `pole` v datech, ne opsat z příkladu v PRD (ten je záměrně chybný).
- Kartička se stáhne na iOS Safari, Android Chrome, desktop Chrome/Firefox.
- Lighthouse mobile: performance a accessibility ≥ 90.
