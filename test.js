// ============================================================
// Český kompas 2026 — testy skórování a párování
// Spuštění: node test.js
// ============================================================

const { QUESTIONS, ORDER, THREATS, QUADRANTS, BADGES, FIGURES } = require("./data.js");
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
assertEq([1, 2, 3, 4].map((ax) => QUESTIONS.filter((q) => q.axis === ax).length), [5, 5, 5, 5], "5 otázek na každou osu");
assertEq(FIGURES.every((f) => f.scores.length === 4 && f.scores.every((s) => s >= -10 && s <= 10)), true, "figury mají 4 skóre v rozsahu -10..10");
assertEq(THREATS.length, 5, "5 hrozeb v rozstřelu");

console.log("\nSkórování:");
// Očekávání spočítané ručně ze sloupce "pole" v datech (NE z příkladu v PRD, ten je záměrně chybný):
// osa 1: poles +1-1+1+1+1 = +3  → ×2 = +6
// osa 2: poles +1+1-1+1-1 = +1  → ×2 = +2
// osa 3: poles -1-1+1-1-1 = -3  → ×2 = -6
// osa 4: poles -1+1-1+1-1 = -1  → ×2 = -2
assertEq(S.computeScores(allAnswers(2), QUESTIONS), [6, 2, -6, -2], "samé 'Rozhodně souhlasím' → [6, 2, -6, -2]");
assertEq(S.computeScores(allAnswers(-2), QUESTIONS), [-6, -2, 6, 2], "samé 'Rozhodně nesouhlasím' → opačná znaménka");
assertEq(S.computeScores(allAnswers(0), QUESTIONS), [0, 0, 0, 0], "samé 'Nevím' → nuly");
// Reverse scoring: souhlas s otázkou 8 (veřejnoprávní média jsou přežitek, pole -1) táhne od Kavárny
assertEq(S.computeScores({ 8: 2 }, QUESTIONS), [0, -2, 0, 0], "souhlas s otázkou 8 → osa 2 = -2 (reverse scoring)");
// Reverse scoring na ose 1: souhlas s otázkou 2 (vadí mi vlajky, pole -1) táhne k Trumpovi
assertEq(S.computeScores({ 2: 2 }, QUESTIONS), [-2, 0, 0, 0], "souhlas s otázkou 2 → osa 1 = -2 (reverse scoring)");
// Krajní hodnoty: každá osa musí být dosažitelná v plném rozsahu -10 až +10
const proBrusel = {};
QUESTIONS.filter((q) => q.axis === 1).forEach((q) => (proBrusel[q.id] = 2 * q.pole));
assertEq(S.computeScores(proBrusel, QUESTIONS)[0], 10, "odpovědi po směru pólů → osa 1 = +10 (mapa pokrytá do kraje)");

console.log("\nDvojník:");
const pavel = FIGURES.find((f) => f.name === "Petr Pavel");
const exact = S.findMatches(pavel.scores, FIGURES);
assertEq(exact[0].name, "Petr Pavel", "přesná shoda skóre → dvojník je ta figura");
assertEq(exact[0].match, 100, "přesná shoda → 100 %");
const far = S.findMatches([10, 10, 10, 10], FIGURES);
assertEq(far.every((m, i) => i === 0 || m.dist >= far[i - 1].dist), true, "výsledky seřazené podle vzdálenosti");
// Ruční kontrola procenta: bod [0,0,0,0] vs Zaorálek [2,0,-2,-5] → d = sqrt(4+0+4+25) = sqrt(33)
const origin = S.findMatches([0, 0, 0, 0], FIGURES);
const zao = origin.find((m) => m.name === "Lubomír Zaorálek");
assertEq(zao.match, Math.round(100 * (1 - Math.sqrt(33) / 40)), "výpočet procenta shody podle vzorce");

console.log("\nKvadranty:");
assertEq(S.getQuadrant([10, 0, 6, 0], QUADRANTS).name, "Bruselský sluníčkář", "Brusel + Bude líp");
assertEq(S.getQuadrant([10, 0, -6, 0], QUADRANTS).name, "Ustaraný demokrat", "Brusel + Bylo líp");
assertEq(S.getQuadrant([-10, 0, 6, 0], QUADRANTS).name, "Národní buditel 2.0", "Trump + Bude líp");
assertEq(S.getQuadrant([-10, 0, -6, 0], QUADRANTS).name, "Hospodský prorok", "Trump + Bylo líp");
assertEq(S.getQuadrant([2, 9, -2, 9], QUADRANTS).name, "Chameleon středu", "|X| <= 2 a |Y| <= 2 → střed");
assertEq(S.getQuadrant([2, 0, 6, 0], QUADRANTS).name, "Bruselský sluníčkář", "|X| <= 2, ale |Y| > 2 → není střed");

console.log("\nOdznaky:");
assertEq(S.getBadges([0, 3, 0, 3], BADGES), ["Tým Kavárna", "Meritokrat"], "kladné osy 2 a 4");
assertEq(S.getBadges([0, -3, 0, -3], BADGES), ["Tým Zbytek Česka", "Solidarista"], "záporné osy 2 a 4");
assertEq(S.getBadges([0, 2, 0, -2], BADGES), ["Nerozhodnutý", "Nerozhodnutý"], "|skóre| <= 2 → Nerozhodnutý");

console.log("\nKódování výsledku do URL:");
const code = S.encodeResult([10, 2, -6, -2], 3);
assertEq(S.decodeResult(code), { scores: [10, 2, -6, -2], threatIndex: 3 }, "encode → decode vrátí totéž");
const code2 = S.encodeResult([-10, -10, -10, -10], 0);
assertEq(S.decodeResult(code2), { scores: [-10, -10, -10, -10], threatIndex: 0 }, "krajní hodnoty projdou");
assertEq(S.decodeResult("nesmysl!!!"), null, "neplatný řetězec → null");
assertEq(S.decodeResult(""), null, "prázdný řetězec → null");
assertEq(code.includes("+") || code.includes("/") || code.includes("="), false, "kód je URL-safe");

console.log("\n" + passed + " prošlo, " + failed + " selhalo");
process.exit(failed > 0 ? 1 : 0);
