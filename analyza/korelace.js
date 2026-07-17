// ============================================================
// Korelační analýza: otázka × otázka, otázka × hrozba, otázka × líp.
// Spuštění: node analyza/korelace.js ["cesta/k/datum.csv"]
// ============================================================

const L = require("./lib.js");
const { QUESTIONS } = L;

const { idx, rows, answers, complete } = L.loadData();

// Zarovnané vektory odpovědí (jen kompletní řádky)
const vec = {};
QUESTIONS.forEach((q) => (vec[q.id] = complete.map((i) => answers[i][q.id])));

// --- 1) Matice korelací otázka × otázka ---
console.log("=== MATICE KORELACÍ (r × 100, Pearson na surových odpovědích) ===");
console.log("     " + QUESTIONS.map((q) => String(q.id).padStart(4)).join(""));
const R = {};
QUESTIONS.forEach((qa) => {
  R[qa.id] = {};
  let line = ("Q" + qa.id).padEnd(5);
  QUESTIONS.forEach((qb) => {
    const r = qa.id === qb.id ? 1 : (R[qb.id] && R[qb.id][qa.id] !== undefined ? R[qb.id][qa.id] : L.pearson(vec[qa.id], vec[qb.id]));
    R[qa.id][qb.id] = r;
    line += String(Math.round(r * 100)).padStart(4);
  });
  console.log(line);
});

// --- 2) Nejsilnější dvojice s čitelnou interpretací ---
// Podmíněná procenta: mezi souhlasícími s A (odpověď > 0) kolik souhlasí s B, vs. mezi nesouhlasícími s A.
function conditional(aId, bId) {
  let agreeA = 0, agreeAagreeB = 0, disA = 0, disAagreeB = 0;
  for (let k = 0; k < complete.length; k++) {
    const a = answers[complete[k]];
    if (a[aId] > 0) { agreeA++; if (a[bId] > 0) agreeAagreeB++; }
    else if (a[aId] < 0) { disA++; if (a[bId] > 0) disAagreeB++; }
  }
  return { pAgree: 100 * agreeAagreeB / agreeA, pDis: 100 * disAagreeB / disA };
}

const pairs = [];
QUESTIONS.forEach((qa, i) => QUESTIONS.slice(i + 1).forEach((qb) => pairs.push({ qa, qb, r: R[qa.id][qb.id] })));
pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

console.log("\n=== TOP 15 NEJSILNĚJŠÍCH DVOJIC ===");
pairs.slice(0, 15).forEach(({ qa, qb, r }) => {
  const c = conditional(qa.id, qb.id);
  console.log("r = " + r.toFixed(2).padStart(5) + "  " + L.qLabel(qa, 46) + "  ×  " + L.qLabel(qb, 46));
  console.log("           kdo souhlasí s Q" + qa.id + " → souhlasí s Q" + qb.id + " v " + c.pAgree.toFixed(0) + " % | kdo nesouhlasí → v " + c.pDis.toFixed(0) + " %");
});

console.log("\n=== TOP 5 NEJNEZÁVISLEJŠÍCH DVOJIC (r nejblíž nule) ===");
pairs.slice(-5).forEach(({ qa, qb, r }) => {
  console.log("r = " + r.toFixed(2).padStart(5) + "  " + L.qLabel(qa, 46) + "  ×  " + L.qLabel(qb, 46));
});

// --- 3) Otázky × volba hrozby (bodově-biseriální r pro každou hrozbu) ---
const THREATS = ["Rusko", "Přistěhovalci", "AI", "Trump", "Změna klimatu"];
console.log("\n=== OTÁZKY × HROZBA (r otázky s indikátorem dané hrozby, top 3 na hrozbu) ===");
THREATS.forEach((t) => {
  const dummy = complete.map((i) => (rows[i][idx.threat] === t ? 1 : 0));
  const n = dummy.reduce((s, x) => s + x, 0);
  const links = QUESTIONS.map((q) => ({ q, r: L.pearson(vec[q.id], dummy) }))
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 3);
  console.log("\nHrozba " + t + " (n = " + n + "):");
  links.forEach(({ q, r }) => console.log("  r = " + r.toFixed(2).padStart(5) + "  " + L.qLabel(q, 60)));
});

// --- 4) Otázky × líp bylo/bude ---
console.log("\n=== OTÁZKY × „LÍP JEŠTĚ BUDE“ (r s indikátorem optimismu, top 10) ===");
const lipDummy = complete.map((i) => (String(rows[i][idx.lip]).includes("bude") ? 1 : 0));
QUESTIONS.map((q) => ({ q, r: L.pearson(vec[q.id], lipDummy) }))
  .sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 10)
  .forEach(({ q, r }) => console.log("r = " + r.toFixed(2).padStart(5) + "  " + L.qLabel(q, 62)));

// Osy × líp
const X = complete.map((i) => Number(rows[i][idx.score_dezolati_lepsolidi]));
const Y = complete.map((i) => Number(rows[i][idx.score_kolektiv_jedinec]));
console.log("\nOsa X (lepšolidi) × optimismus: r = " + L.pearson(X, lipDummy).toFixed(2));
console.log("Osa Y (já)        × optimismus: r = " + L.pearson(Y, lipDummy).toFixed(2));
