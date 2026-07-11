// ============================================================
// Český kompas 2026 — testy skórování a párování (2D metodika)
// Spuštění: node test.js
// ============================================================

const { QUESTIONS, ORDER, SHOOTOUTS, QUADRANTS, FIGURES } = require("./data.js");
const S = require("./scoring.js");

let failed = 0;
let passed = 0;

function assertEq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log("  OK  " + msg);
  } else {
    failed++;
    console.log("  FAIL " + msg);
    console.log("       očekáváno: " + e);
    console.log("       dostáno:   " + a);
  }
}

// Pomocník: odpověď se stejnou hodnotou na všechny otázky
function allAnswers(value) {
  const a = {};
  for (const q of QUESTIONS) a[q.id] = value;
  return a;
}

console.log("Integrita dat:");
assertEq(QUESTIONS.length, 20, "20 otázek");
assertEq(ORDER.length, 20, "pořadí má 20 položek");
assertEq([...ORDER].sort((x, y) => x - y), QUESTIONS.map((q) => q.id).sort((x, y) => x - y), "pořadí obsahuje každou otázku právě jednou");
assertEq(QUESTIONS.every((q) => q.pole === 1 || q.pole === -1), true, "každá otázka má pole +1 nebo -1");
assertEq([1, 2].map((ax) => QUESTIONS.filter((q) => q.axis === ax).length), [10, 10], "10 otázek na každou osu");
const axisOf = (id) => QUESTIONS.find((q) => q.id === id).axis;
assertEq(ORDER.every((id, i) => i === 0 || axisOf(id) !== axisOf(ORDER[i - 1])), true, "v pořadí se osy střídají (žádné dvě stejné za sebou)");
assertEq(FIGURES.every((f) => f.scores.length === 2 && f.scores.every((s) => s >= -20 && s <= 20)), true, "figury mají 2 skóre v rozsahu -20..20");
assertEq(SHOOTOUTS.length, 2, "2 rozstřelové otázky");
assertEq(SHOOTOUTS[0].options.length, 5, "hrozba má 5 možností");
assertEq(SHOOTOUTS[1].options.length, 2, "líp už bylo/teprve bude má 2 možnosti");

console.log("\nSkórování:");
// Očekávání spočítané ručně ze sloupce "pole" v datech (NE z příkladu v PRD, ten je záměrně chybný):
// osa X: poles +1-1+1+1+1+1+1-1+1-1 = +4 → ×2 = +8
// osa Y: poles -1+1-1+1-1-1+1+1-1+1 =  0 → ×2 =  0
assertEq(S.computeScores(allAnswers(2), QUESTIONS), [8, 0], "samé 'Rozhodně souhlasím' → [8, 0]");
assertEq(S.computeScores(allAnswers(-2), QUESTIONS), [-8, 0], "samé 'Rozhodně nesouhlasím' → opačná znaménka");
assertEq(S.computeScores(allAnswers(0), QUESTIONS), [0, 0], "samé 'Nevím' → nuly");
// Reverse scoring: souhlas s otázkou 2 (Brusel je horší než Trump, pole -1) táhne k Dezolátům
assertEq(S.computeScores({ 2: 2 }, QUESTIONS), [-2, 0], "souhlas s otázkou 2 → X = -2 (reverse scoring)");
// Reverse scoring na ose Y: souhlas s otázkou 16 (zdravotnictví zadarmo, pole -1) táhne ke Kolektivu
assertEq(S.computeScores({ 16: 2 }, QUESTIONS), [0, -2], "souhlas s otázkou 16 → Y = -2 (reverse scoring)");
// Krajní hodnoty: obě osy dosažitelné v plném rozsahu -20 až +20
const proLepsolidi = {};
QUESTIONS.filter((q) => q.axis === 1).forEach((q) => (proLepsolidi[q.id] = 2 * q.pole));
assertEq(S.computeScores(proLepsolidi, QUESTIONS)[0], 20, "odpovědi po směru pólů → X = +20 (mapa pokrytá do kraje)");
const proJedinec = {};
QUESTIONS.filter((q) => q.axis === 2).forEach((q) => (proJedinec[q.id] = 2 * q.pole));
assertEq(S.computeScores(proJedinec, QUESTIONS)[1], 20, "odpovědi po směru pólů → Y = +20 (mapa pokrytá do kraje)");

console.log("\nDvojník:");
const pavel = FIGURES.find((f) => f.name === "Petr Pavel");
const exact = S.findMatches(pavel.scores, FIGURES);
assertEq(exact[0].name, "Petr Pavel", "přesná shoda skóre → dvojník je ta figura");
assertEq(exact[0].match, 100, "přesná shoda → 100 %");
const far = S.findMatches([20, 20], FIGURES);
assertEq(far.every((m, i) => i === 0 || m.dist >= far[i - 1].dist), true, "výsledky seřazené podle vzdálenosti");
// Ruční kontrola procenta: bod [0,0] vs Jurečka [2,-2] → d = sqrt(8), max = sqrt(3200)
const origin = S.findMatches([0, 0], FIGURES);
const jur = origin.find((m) => m.name === "Marian Jurečka");
assertEq(jur.match, Math.round(100 * (1 - Math.sqrt(8) / Math.sqrt(3200))), "výpočet procenta shody podle vzorce");

console.log("\nKvadranty:");
assertEq(S.getQuadrant([10, 10], QUADRANTS).name, "Sluníčkový byznysmen", "Lepšolidi + Já");
assertEq(S.getQuadrant([10, -10], QUADRANTS).name, "Rovnostář z kavárny", "Lepšolidi + My");
assertEq(S.getQuadrant([-10, 10], QUADRANTS).name, "Pragmatická konzerva", "Dezoláti + Já");
assertEq(S.getQuadrant([-10, -10], QUADRANTS).name, "Socan vlastenec", "Dezoláti + My");
assertEq(S.getQuadrant([4, -4], QUADRANTS).name, "Strážce středu", "|X| <= 4 a |Y| <= 4 → střed");
assertEq(S.getQuadrant([4, 10], QUADRANTS).name, "Sluníčkový byznysmen", "|X| <= 4, ale |Y| > 4 → není střed");

console.log("\nKódování výsledku do URL:");
const code = S.encodeResult([8, 0], 3, 1);
assertEq(S.decodeResult(code), { scores: [8, 0], threatIndex: 3, lipIndex: 1 }, "encode → decode vrátí totéž");
const code2 = S.encodeResult([-20, -20], 0, 0);
assertEq(S.decodeResult(code2), { scores: [-20, -20], threatIndex: 0, lipIndex: 0 }, "krajní hodnoty projdou");
assertEq(S.decodeResult("nesmysl!!!"), null, "neplatný řetězec → null");
assertEq(S.decodeResult(""), null, "prázdný řetězec → null");
assertEq(S.decodeResult("FAwECAA"), null, "starý formát odkazu (4 osy) → null, spadne na intro");
assertEq(code.includes("+") || code.includes("/") || code.includes("="), false, "kód je URL-safe");

console.log("\n" + passed + " prošlo, " + failed + " selhalo");
process.exit(failed > 0 ? 1 : 0);
