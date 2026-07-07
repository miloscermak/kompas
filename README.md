# Český kompas 2026

Klikací test: 20 výroků + bonusový rozstřel → tvoje pozice na politické mapě Česka 2026 a tvůj politický dvojník.

Funguje bez serveru — stačí otevřít `index.html` v prohlížeči.

## Jak upravit otázky a figury (bez znalosti kódu)

Všechna data jsou v souboru **`data.js`**. Otevři ho v libovolném textovém editoru (TextEdit, Poznámkový blok, VS Code).

### Úprava skóre figury

Najdi figuru v sekci `FIGURES` a přepiš čísla v `scores`:

```js
{ name: "Petr Pavel", desc: "prezident, generál ve výslužbě", scores: [ 8,  5,  3,  2] },
```

Čtyři čísla jsou pozice na osách (každé od **-10 do +10**), v tomhle pořadí:

| Pozice | Osa | +10 znamená | -10 znamená |
|---|---|---|---|
| 1. | Brusel vs Trump | Brusel | Trump |
| 2. | Kavárna vs Zbytek | Kavárna | Zbytek Česka |
| 3. | Bude líp vs Bylo líp | Bude líp | Bylo líp |
| 4. | Úspěch vs Solidarita | Úspěch | Solidarita |

### Přidání nebo smazání figury

Zkopíruj celý řádek `{ name: ... },` a uprav jméno, popis (max 8 slov) a skóre. Při mazání smaž celý řádek včetně čárky na konci.

### Úprava otázky

Najdi otázku v sekci `QUESTIONS`:

```js
{ id: 3, axis: 1, text: "Česko má přijmout euro.", pole: 1 },
```

- `text` — znění výroku (můžeš libovolně přepsat)
- `pole` — **pozor:** `1` když souhlas táhne ke kladnému pólu osy (Brusel / Kavárna / Bude líp / Úspěch), `-1` když k zápornému. Když měníš smysl otázky, zkontroluj i pole!
- `axis` a `id` neměň (musí zůstat 5 otázek na osu)

### Úprava textů

Názvy kvadrantů a jejich popisky jsou v sekci `QUADRANTS`, odznaky v `BADGES`, možnosti rozstřelu v `THREATS`.

## Po každé úpravě

1. Ulož soubor.
2. Otevři (nebo obnov) `index.html` v prohlížeči a proklikej test.
3. Pro jistotu spusť testy: v terminálu ve složce projektu napiš `node test.js` — všechny řádky musí hlásit OK.

## Struktura projektu

| Soubor | Co dělá |
|---|---|
| `index.html` | struktura stránky |
| `style.css` | vzhled |
| `app.js` | logika aplikace (obrazovky, animace, kartička) |
| `scoring.js` | výpočet skóre a dvojníka |
| `data.js` | **otázky, figury, texty — tohle edituj** |
| `test.js` | testy (`node test.js`) |
