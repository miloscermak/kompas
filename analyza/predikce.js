// ============================================================
// Prediktivní analýza: „názory chodí v balíčku“.
// Hledá pětici otázek, ze které lineární model nejlépe předpoví
// odpovědi na zbývajících 15, a měří úspěšnost na odloženém
// testovacím vzorku (30 %, deterministický split podle submission_id).
//
// Spuštění: node analyza/predikce.js ["cesta/k/datum.csv"]
//
// Metoda:
//   1. Gramova matice odpovědí na trénovacích datech (jeden průchod)
//      → OLS regrese pro libovolnou podmnožinu prediktorů bez dalších
//      průchodů daty (normální rovnice).
//   2. Greedy forward selection: přidávej otázku, která nejvíc zvedne
//      průměrné R² přes zbývající cílové otázky.
//   3. Finální pětice → vyhodnocení na testu: MAE, směrová přesnost
//      (souhlas/nesouhlas) proti baseline (většinová odpověď).
// ============================================================

const L = require("./lib.js");
const { QUESTIONS } = L;

const { idx, rows, answers, complete } = L.loadData();
const IDS = QUESTIONS.map((q) => q.id);

// --- Train/test split (deterministický) ---
const train = [], test = [];
complete.forEach((i) => (L.hashSplit(String(rows[i][idx.submission_id])) === "test" ? test : train).push(i));
console.log("Train: " + train.length + " | Test: " + test.length + " (split podle hashe submission_id, 70/30)\n");

// --- Gramova matice na trénovacích datech: proměnné [1, q1..q20] ---
const D = IDS.length + 1;
const G = Array.from({ length: D }, () => new Float64Array(D));
train.forEach((i) => {
  const a = answers[i];
  const x = [1, ...IDS.map((id) => a[id])];
  for (let r = 0; r < D; r++) for (let c = r; c < D; c++) G[r][c] += x[r] * x[c];
});
for (let r = 0; r < D; r++) for (let c = 0; c < r; c++) G[r][c] = G[c][r];
const n = train.length;

// OLS pro cíl t (index otázky 0..19) z prediktorů P (indexy otázek):
// beta = solve(G[P+][P+], G[P+][t+]), R² z reziduálního součtu čtverců
function fit(P, t) {
  const cols = [0, ...P.map((p) => p + 1)];
  const A = cols.map((r) => cols.map((c) => G[r][c]));
  const b = cols.map((r) => G[r][t + 1]);
  const beta = L.solve(A, b);
  if (!beta) return null;
  const yy = G[t + 1][t + 1];
  const sse = yy - beta.reduce((s, bi, k) => s + bi * b[k], 0);
  const sst = yy - (G[0][t + 1] ** 2) / n;
  return { beta, cols, r2: 1 - sse / sst };
}

// --- Greedy forward selection do 10 otázek ---
console.log("=== GREEDY VÝBĚR PREDIKTORŮ (průměrné R² přes zbývající otázky, train) ===");
const chosen = [];
const curve = [];
while (chosen.length < 10) {
  let best = null;
  for (let cand = 0; cand < IDS.length; cand++) {
    if (chosen.includes(cand)) continue;
    const P = [...chosen, cand];
    let sum = 0, cnt = 0;
    for (let t = 0; t < IDS.length; t++) {
      if (P.includes(t)) continue;
      const f = fit(P, t);
      if (f) { sum += f.r2; cnt++; }
    }
    const avg = sum / cnt;
    if (!best || avg > best.avg) best = { cand, avg };
  }
  chosen.push(best.cand);
  curve.push(best.avg);
  const q = QUESTIONS[best.cand];
  console.log(String(chosen.length).padStart(2) + ". " + L.qLabel(q, 62) + "   prům. R² = " + best.avg.toFixed(3));
}

// --- Vyhodnocení finální pětice na testovacím vzorku ---
const FIVE = chosen.slice(0, 5);
console.log("\n=== FINÁLNÍ PĚTICE ===");
FIVE.forEach((p) => console.log("  " + L.qLabel(QUESTIONS[p], 70)));

console.log("\n=== PŘESNOST NA TESTU (predikce zbývajících 15 otázek z pětice) ===");
console.log("Směrová přesnost = trefa souhlas/nesouhlas u lidí, kteří nezvolili „nevím“.");
console.log("Baseline = tip většinové odpovědi dané otázky (z trénu).\n");

let accSum = 0, baseSum = 0, maeSum = 0, cnt = 0;
const results = [];
for (let t = 0; t < IDS.length; t++) {
  if (FIVE.includes(t)) continue;
  const f = fit(FIVE, t);
  // baseline: většinový směr na trénu
  let trainAgree = 0, trainDis = 0;
  train.forEach((i) => { const v = answers[i][IDS[t]]; if (v > 0) trainAgree++; else if (v < 0) trainDis++; });
  const majoritySign = trainAgree >= trainDis ? 1 : -1;

  let hit = 0, baseHit = 0, denom = 0, mae = 0;
  test.forEach((i) => {
    const a = answers[i];
    const pred = f.beta[0] + FIVE.reduce((s, p, k) => s + f.beta[k + 1] * a[IDS[p]], 0);
    const actual = a[IDS[t]];
    mae += Math.abs(pred - actual);
    if (actual !== 0) {
      denom++;
      if (Math.sign(pred) === Math.sign(actual)) hit++;
      if (majoritySign === Math.sign(actual)) baseHit++;
    }
  });
  const acc = 100 * hit / denom, base = 100 * baseHit / denom;
  results.push({ t, acc, base, mae: mae / test.length, r2: f.r2 });
  accSum += acc; baseSum += base; maeSum += mae / test.length; cnt++;
}
results.sort((a, b) => b.acc - a.acc).forEach(({ t, acc, base, mae, r2 }) => {
  console.log(
    ("Q" + IDS[t]).padEnd(4) +
    ("přesnost " + acc.toFixed(0) + " %").padEnd(16) +
    ("baseline " + base.toFixed(0) + " %").padEnd(16) +
    ("MAE " + mae.toFixed(2)).padEnd(11) +
    ("R² " + r2.toFixed(2)).padEnd(9) +
    L.qLabel(QUESTIONS[t], 46).replace(/^Q\d+ /, "")
  );
});
console.log("\nPRŮMĚR: směrová přesnost " + (accSum / cnt).toFixed(1) + " % | baseline " + (baseSum / cnt).toFixed(1) + " % | MAE " + (maeSum / cnt).toFixed(2) + " (škála −2..2)");

console.log("\n=== KOLIK OTÁZEK STAČÍ (křivka greedy výběru, train R²) ===");
curve.forEach((r2, k) => console.log((k + 1) + " otázek: prům. R² = " + r2.toFixed(3)));
