# Český kompas 2026

Klikací test: 20 výroků + bonusový rozstřel → tvoje pozice na politické mapě Česka 2026 a tvůj politický dvojník.

Funguje bez serveru — stačí otevřít `index.html` v prohlížeči.

## Jak upravit otázky a figury (bez znalosti kódu)

Všechna data jsou v souboru **`data.js`**. Otevři ho v libovolném textovém editoru (TextEdit, Poznámkový blok, VS Code).

### Úprava skóre figury

Najdi figuru v sekci `FIGURES` a přepiš čísla v `scores`:

```js
{ name: "Petr Pavel", desc: "prezident, generál ve výslužbě", scores: [ 13,  3] },
```

Dvě čísla jsou pozice na osách mapy (každé od **-20 do +20**):

| Pozice | Osa | +20 znamená | -20 znamená |
|---|---|---|---|
| 1. | vodorovná (X) | Lepšolidi | Dezoláti |
| 2. | svislá (Y) | Jedinec | Kolektiv |

Po úpravě spusť `node sim.js` — vypíše, jak často která figura vychází jako dvojník a jestli některé dvě nesedí na stejném místě.

### Přidání nebo smazání figury

Zkopíruj celý řádek `{ name: ... },` a uprav jméno, popis (max 8 slov) a skóre. Při mazání smaž celý řádek včetně čárky na konci.

### Úprava otázky

Najdi otázku v sekci `QUESTIONS`:

```js
{ id: 3, axis: 1, text: "Česko má přijmout euro.", pole: 1 },
```

- `text` — znění výroku (můžeš libovolně přepsat)
- `pole` — **pozor:** `1` když souhlas táhne ke kladnému pólu osy (Lepšolidi / Jedinec), `-1` když k zápornému (Dezoláti / Kolektiv). Když měníš smysl otázky, zkontroluj i pole!
- `axis` a `id` neměň (musí zůstat 10 otázek na osu)

### Úprava textů

Názvy kvadrantů a jejich popisky jsou v sekci `QUADRANTS`, obě rozstřelové otázky (hrozba a „líp už bylo") v `SHOOTOUTS`.

## Po každé úpravě

1. Ulož soubor.
2. Otevři (nebo obnov) `index.html` v prohlížeči a proklikej test.
3. Pro jistotu spusť testy: v terminálu ve složce projektu napiš `node test.js` — všechny řádky musí hlásit OK.

## Ukládání výsledků (Google Sheets)

Web po dokončení testu anonymně odešle výsledek (skóre, kvadrant, dvojník, hrozba, délka průchodu) do Google Sheetu. Na výsledkovce je navíc dobrovolný demografický mini-průzkum (věk, pohlaví, bydliště, vzdělání). Neukládá se nic osobního.

Jak to zprovoznit (jednorázově, ~5 minut):

1. Vytvoř prázdný Google Sheet. Z jeho adresy zkopíruj ID (dlouhý řetězec mezi `/d/` a `/edit`).
2. Otevři [script.google.com](https://script.google.com) → **New project** a vlož celý obsah souboru `apps-script/webhook.gs`.
3. V kódu nahoře přepiš `SPREADSHEET_ID` na ID svého sheetu.
4. **Deploy → New deployment → Web app**, Execute as: **Me**, Who has access: **Anyone**. Zkopíruj vygenerovanou URL.
5. V `data.js` vlož URL do `WEBHOOK_URL` (nahoře v souboru) a pushni.

Dokud je `WEBHOOK_URL` prázdné, nikam se nic neposílá (payload se jen vypíše do konzole prohlížeče — hodí se pro vývoj).

Demografické otázky a možnosti jsou v `data.js` v sekci `DEMOGRAPHICS` — upravují se stejně snadno jako otázky testu.

## Struktura projektu

| Soubor | Co dělá |
|---|---|
| `index.html` | struktura stránky |
| `style.css` | vzhled |
| `app.js` | logika aplikace (obrazovky, animace, kartička) |
| `scoring.js` | výpočet skóre a dvojníka |
| `data.js` | **otázky, figury, texty — tohle edituj** |
| `test.js` | testy (`node test.js`) |
