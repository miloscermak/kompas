// ============================================================
// Baterie explorativních hypotéz nad datasetem kompasu.
// Spuštění: node analyza/hypotezy.js ["cesta/k/datum.csv"]
//
// Sekce:
//   A) Rozhodnost a váhavost (podíl ±2 a „nevím“)
//   B) Rychlost průchodu × styl odpovídání
//   C) Zařízení (iPhone / Android / desktop) × pozice
//   D) Denní doba a drift publika během virální vlny
//   E) Vnitřní rozpory (souhlas s protichůdnými výroky)
//   F) Profil středu: vlažní, nebo rozpolcení?
//   G) Hrozby × optimismus, věk, pohlaví
//   H) Menšiny názorů (popírači agrese, ...)
//   I) Dvojníci: jak těsné jsou shody, kde jsou „politicky bezdomovci“
//   J) Kvalita dat (straightlining, vyplnění demografie × pozice)
// ============================================================

const L = require("./lib.js");
const { QUESTIONS } = L;

const { idx, rows, answers, complete } = L.loadData();

// Předpočítané vektory
const X = complete.map((i) => Number(rows[i][idx.score_dezolati_lepsolidi]));
const Y = complete.map((i) => Number(rows[i][idx.score_kolektiv_jedinec]));
const extremity = complete.map((i) => L.mean(QUESTIONS.map((q) => Math.abs(answers[i][q.id])))); // 0..2
const nevimCount = complete.map((i) => QUESTIONS.filter((q) => answers[i][q.id] === 0).length); // 0..20
const optimist = complete.map((i) => (String(rows[i][idx.lip]).includes("bude") ? 1 : 0));
const durations = complete.map((i) => Number(rows[i][idx.duration_sec]));

function groupStats(label, indices) {
  const g = (arr) => indices.map((k) => arr[k]);
  return label.padEnd(22) +
    "n=" + String(indices.length).padStart(6) +
    "  X " + L.mean(g(X)).toFixed(1).padStart(6) +
    "  Y " + L.mean(g(Y)).toFixed(1).padStart(6) +
    "  ±2 podíl " + (100 * (L.mean(g(extremity)) / 2)).toFixed(0) + " %" +
    "  nevím " + L.mean(g(nevimCount)).toFixed(1) +
    "  optimisté " + (100 * L.mean(g(optimist))).toFixed(0) + " %";
}

// ---------- A) Rozhodnost ----------
console.log("=== A) ROZHODNOST (podíl krajních odpovědí ±2 z celé škály) ===");
console.log("Průměrný respondent: krajní odpověď u " + (100 * L.mean(extremity) / 2).toFixed(0) + " % otázek, „nevím“ u " + L.mean(nevimCount).toFixed(1) + " z 20 otázek.");
console.log("Korelace rozhodnosti s |X| (vyhraněnost kulturní): r = " + L.pearson(extremity, X.map(Math.abs)).toFixed(2));
console.log("Korelace rozhodnosti s |Y| (vyhraněnost ekonomická): r = " + L.pearson(extremity, Y.map(Math.abs)).toFixed(2));
console.log("Rozhodnost × pozice X (jsou dezoláti ráznější?): r = " + L.pearson(extremity, X).toFixed(2));
// Nevím × pohlaví/věk
const gIdx = (val) => complete.map((k, j) => [k, j]).filter(([i]) => rows[i][idx.gender] === val).map(([, j]) => j);
["muz", "zena"].forEach((g) => {
  const jj = gIdx(g);
  if (jj.length) console.log("  " + g + ": nevím průměrně " + L.mean(jj.map((j) => nevimCount[j])).toFixed(2) + ", ±2 podíl " + (100 * L.mean(jj.map((j) => extremity[j])) / 2).toFixed(0) + " %");
});

// ---------- B) Rychlost ----------
console.log("\n=== B) RYCHLOST PRŮCHODU ===");
const valid = complete.map((k, j) => j).filter((j) => durations[j] > 20 && durations[j] < 1800);
const dArr = valid.map((j) => durations[j]);
const sorted = [...valid].sort((a, b) => durations[a] - durations[b]);
const q1 = sorted.slice(0, Math.floor(sorted.length / 4));
const q4 = sorted.slice(-Math.floor(sorted.length / 4));
console.log("Korelace délky průchodu × rozhodnost: r = " + L.pearson(dArr, valid.map((j) => extremity[j])).toFixed(2));
console.log("Korelace délky průchodu × počet „nevím“: r = " + L.pearson(dArr, valid.map((j) => nevimCount[j])).toFixed(2));
console.log(groupStats("Nejrychlejší čtvrtina", q1) + "  (medián " + durations[q1[Math.floor(q1.length / 2)]] + " s)");
console.log(groupStats("Nejpomalejší čtvrtina", q4) + "  (medián " + durations[q4[Math.floor(q4.length / 2)]] + " s)");

// ---------- C) Zařízení ----------
console.log("\n=== C) ZAŘÍZENÍ ===");
function device(ua) {
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Windows|Macintosh|Linux/.test(ua)) return "desktop";
  return "jiné";
}
const byDev = {};
complete.forEach((i, j) => {
  const d = device(rows[i][idx.user_agent] || "");
  (byDev[d] = byDev[d] || []).push(j);
});
Object.entries(byDev).sort((a, b) => b[1].length - a[1].length).forEach(([d, jj]) => console.log(groupStats(d, jj)));

// ---------- D) Denní doba a drift publika ----------
console.log("\n=== D) DENNÍ DOBA (hodina, česky = UTC+2) ===");
const byHourBand = { "ráno 6–11": [], "odpoledne 12–17": [], "večer 18–23": [], "noc 0–5": [] };
complete.forEach((i, j) => {
  const h = (new Date(rows[i][idx.timestamp]).getUTCHours() + 2) % 24;
  const band = h < 6 ? "noc 0–5" : h < 12 ? "ráno 6–11" : h < 18 ? "odpoledne 12–17" : "večer 18–23";
  byHourBand[band].push(j);
});
Object.entries(byHourBand).forEach(([b, jj]) => console.log(groupStats(b, jj)));

console.log("\n=== D2) DRIFT PUBLIKA PO DNECH VIRÁLNÍ VLNY ===");
const byDay = {};
complete.forEach((i, j) => {
  const d = String(rows[i][idx.timestamp]).slice(0, 10);
  (byDay[d] = byDay[d] || []).push(j);
});
Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).forEach(([d, jj]) => {
  if (jj.length > 100) console.log(groupStats(d, jj));
});

// ---------- E) Vnitřní rozpory ----------
console.log("\n=== E) VNITŘNÍ ROZPORY (souhlas s oběma výroky zároveň) ===");
function bothAgree(aId, bId, label) {
  let both = 0, answeredBoth = 0;
  complete.forEach((i) => {
    const a = answers[i];
    if (a[aId] !== 0 && a[bId] !== 0) {
      answeredBoth++;
      if (a[aId] > 0 && a[bId] > 0) both++;
    }
  });
  console.log((100 * both / answeredBoth).toFixed(0).padStart(3) + " %  " + label);
}
bothAgree(16, 20, "Zdravotnictví zadarmo + čím míň státu, tím líp");
bothAgree(11, 18, "Zdanit bohaté + úspěšní si bohatství zaslouží");
bothAgree(11, 20, "Zdanit bohaté + čím míň státu, tím líp");
bothAgree(16, 12, "Zdravotnictví zadarmo + dávek je moc");
bothAgree(19, 18, "Pokuty podle příjmů + úspěšní si zaslouží");
bothAgree(1, 2, "Rusko agresor + Brusel horší než Trump");

// ---------- F) Střed: vlažní, nebo rozpolcení? ----------
console.log("\n=== F) STRÁŽCI STŘEDU ===");
const centerJ = complete.map((k, j) => j).filter((j) => Math.abs(X[j]) <= 4 && Math.abs(Y[j]) <= 4);
const edgeJ = complete.map((k, j) => j).filter((j) => Math.abs(X[j]) > 12 || Math.abs(Y[j]) > 12);
console.log(groupStats("Střed (|X|,|Y| ≤ 4)", centerJ));
console.log(groupStats("Okraje (>12)", edgeJ));
const conflicted = centerJ.filter((j) => extremity[j] >= 1).length;
console.log("Podíl středu s převahou krajních odpovědí (rozpolcení, ne vlažní): " + (100 * conflicted / centerJ.length).toFixed(0) + " %");

// ---------- G) Hrozby ----------
console.log("\n=== G) HROZBY × OPTIMISMUS, VĚK, POHLAVÍ ===");
const THREATS = ["Rusko", "Přistěhovalci", "AI", "Trump", "Změna klimatu"];
THREATS.forEach((t) => {
  const jj = complete.map((k, j) => j).filter((j) => rows[complete[j]][idx.threat] === t);
  const withAge = jj.filter((j) => rows[complete[j]][idx.age]);
  const young = withAge.filter((j) => ["u25", "26_40"].includes(rows[complete[j]][idx.age])).length;
  const withG = jj.filter((j) => ["muz", "zena"].includes(rows[complete[j]][idx.gender]));
  const women = withG.filter((j) => rows[complete[j]][idx.gender] === "zena").length;
  console.log(t.padEnd(15) +
    "optimisté " + (100 * L.mean(jj.map((j) => optimist[j]))).toFixed(0).padStart(3) + " %" +
    "  do 40 let " + (withAge.length ? (100 * young / withAge.length).toFixed(0) : "–").padStart(3) + " %" +
    "  ženy " + (withG.length ? (100 * women / withG.length).toFixed(0) : "–").padStart(3) + " %" +
    "  X " + L.mean(jj.map((j) => X[j])).toFixed(1).padStart(6) +
    "  Y " + L.mean(jj.map((j) => Y[j])).toFixed(1).padStart(6));
});

// ---------- H) Menšiny názorů ----------
console.log("\n=== H) MENŠINY ===");
function minority(label, pred) {
  const jj = complete.map((k, j) => j).filter((j) => pred(answers[complete[j]]));
  if (!jj.length) return;
  const threats = {};
  jj.forEach((j) => { const t = rows[complete[j]][idx.threat]; threats[t] = (threats[t] || 0) + 1; });
  const topThreat = Object.entries(threats).sort((a, b) => b[1] - a[1])[0];
  console.log(label + " (n=" + jj.length + ", " + (100 * jj.length / complete.length).toFixed(1) + " %):");
  console.log("  X " + L.mean(jj.map((j) => X[j])).toFixed(1) + ", Y " + L.mean(jj.map((j) => Y[j])).toFixed(1) +
    ", optimisté " + (100 * L.mean(jj.map((j) => optimist[j]))).toFixed(0) + " %" +
    ", nejčastější hrozba: " + topThreat[0] + " (" + (100 * topThreat[1] / jj.length).toFixed(0) + " %)");
}
minority("Popírači agrese (Q1 nesouhlas)", (a) => a[1] < 0);
minority("Tvrdé jádro degrowth (Q9 i Q15 souhlas)", (a) => a[9] > 0 && a[15] > 0);
minority("Antisystém (Q8 souhlas + Q6 nesouhlas + Q2 souhlas)", (a) => a[8] > 0 && a[6] < 0 && a[2] > 0);

// ---------- I) Dvojníci ----------
console.log("\n=== I) TĚSNOST SHODY S DVOJNÍKEM ===");
const match = complete.map((i) => Number(rows[i][idx.twin_match]));
const ms = [...match].sort((a, b) => a - b);
console.log("Medián shody: " + ms[Math.floor(ms.length / 2)] + " % | pod 80 %: " + (100 * match.filter((m) => m < 80).length / match.length).toFixed(1) + " % lidí | pod 70 %: " + (100 * match.filter((m) => m < 70).length / match.length).toFixed(1) + " %");
const worst = complete.map((k, j) => j).filter((j) => match[j] < 70);
if (worst.length > 30) console.log(groupStats("„Bez dvojníka“ (<70 %)", worst));

// ---------- J) Kvalita dat ----------
console.log("\n=== J) KVALITA DAT ===");
const straight = complete.filter((i) => {
  const a = answers[i];
  const first = a[QUESTIONS[0].id];
  return QUESTIONS.every((q) => a[q.id] === first);
}).length;
console.log("Straightlineři (všech 20 odpovědí stejných): " + straight + " (" + (100 * straight / complete.length).toFixed(2) + " %)");
const filledJ = complete.map((k, j) => j).filter((j) => rows[complete[j]][idx.age]);
const notFilledJ = complete.map((k, j) => j).filter((j) => !rows[complete[j]][idx.age]);
console.log(groupStats("Vyplnili demografii", filledJ));
console.log(groupStats("Nevyplnili", notFilledJ));
