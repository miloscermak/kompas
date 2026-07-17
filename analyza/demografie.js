// ============================================================
// Demografická baterie: každá demografická proměnná × každá
// otázka, osa a rozstřel. Efekty seřazené podle síly.
// Spuštění: node analyza/demografie.js ["cesta/k/datum.csv"]
//
// Kódování (ordinální škály pro korelace):
//   věk:      u25=1, 26_40=2, 41_60=3, 60p=4   (r > 0 = starší souhlasí víc)
//   pohlaví:  muz=0, zena=1                     (r > 0 = ženy souhlasí víc)
//   urbanita: vesnice=1, mesto=2, krajske=3, praha=4  (r > 0 = větší město souhlasí víc)
//   vzdělání: zs=1, ss=2, vs=3                  (r > 0 = vzdělanější souhlasí víc)
// Skupiny jine/na u pohlaví jsou moc malé na korelaci — reportují se zvlášť.
// ============================================================

const L = require("./lib.js");
const { QUESTIONS } = L;

const { idx, rows, answers, complete } = L.loadData();

const CODING = {
  age: { u25: 1, "26_40": 2, "41_60": 3, "60p": 4 },
  gender: { muz: 0, zena: 1 },
  place: { vesnice: 1, mesto: 2, krajske: 3, praha: 4 },
  education: { zs: 1, ss: 2, vs: 3 },
};
const LABELS = { age: "věk (starší +)", gender: "pohlaví (ženy +)", place: "urbanita (Praha +)", education: "vzdělání (VŠ +)" };

// Cíle: 20 otázek + osy + optimismus + hrozby
function buildTargets(iRows) {
  const t = [];
  QUESTIONS.forEach((q) => t.push({ name: L.qLabel(q, 58), vals: iRows.map((i) => answers[i][q.id]) }));
  t.push({ name: "OSA X (lepšolidi +)", vals: iRows.map((i) => Number(rows[i][idx.score_dezolati_lepsolidi])) });
  t.push({ name: "OSA Y (já +)", vals: iRows.map((i) => Number(rows[i][idx.score_kolektiv_jedinec])) });
  t.push({ name: "Líp ještě bude (optimismus)", vals: iRows.map((i) => (String(rows[i][idx.lip]).includes("bude") ? 1 : 0)) });
  ["Rusko", "Přistěhovalci", "AI", "Trump", "Změna klimatu"].forEach((th) =>
    t.push({ name: "Hrozba: " + th, vals: iRows.map((i) => (rows[i][idx.threat] === th ? 1 : 0)) })
  );
  return t;
}

const findings = [];

Object.keys(CODING).forEach((demo) => {
  // řádky s vyplněnou a kódovatelnou hodnotou
  const iRows = complete.filter((i) => CODING[demo][rows[i][idx[demo]]] !== undefined);
  const d = iRows.map((i) => CODING[demo][rows[i][idx[demo]]]);
  const targets = buildTargets(iRows);
  console.log("=== " + LABELS[demo].toUpperCase() + " (n = " + iRows.length + ") — top 8 efektů ===");
  const effects = targets.map((t) => ({ name: t.name, r: L.pearson(t.vals, d) }))
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  effects.slice(0, 8).forEach(({ name, r }) => {
    console.log("r = " + r.toFixed(2).padStart(5) + "  " + name);
    findings.push({ demo: LABELS[demo], name, r });
  });
  console.log("");
});

// Souhrn napříč demografií
console.log("=== 15 NEJSILNĚJŠÍCH DEMOGRAFICKÝCH EFEKTŮ CELKEM ===");
findings.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 15)
  .forEach(({ demo, name, r }) => console.log("r = " + r.toFixed(2).padStart(5) + "  [" + demo + "]  " + name));

// Malé skupiny pohlaví zvlášť (bez korelace, jen průměrné pozice)
console.log("\n=== MALÉ SKUPINY (jen orientačně) ===");
["jine", "na"].forEach((g) => {
  const iRows = complete.filter((i) => rows[i][idx.gender] === g);
  if (!iRows.length) return;
  const mx = L.mean(iRows.map((i) => Number(rows[i][idx.score_dezolati_lepsolidi])));
  const my = L.mean(iRows.map((i) => Number(rows[i][idx.score_kolektiv_jedinec])));
  console.log("pohlaví=" + g + " (n=" + iRows.length + "): průměrná pozice X " + mx.toFixed(1) + ", Y " + my.toFixed(1));
});
