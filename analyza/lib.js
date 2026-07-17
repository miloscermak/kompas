// ============================================================
// Sdílená knihovna pro analýzy datasetu Českého kompasu.
// Použití ve skriptech: const L = require("./lib.js");
// Data: export listu vysledky2 jako CSV (včetně answers_json).
// ============================================================

const fs = require("fs");
const path = require("path");
const { QUESTIONS } = require(path.join(__dirname, "..", "data.js"));

// Výchozí soubor s daty; každý skript přijímá cestu jako 1. argument
const DEFAULT_CSV = path.join(__dirname, "..", "kompas - vysledky60k.csv");

// --- CSV parser (uvozovky, čárky uvnitř polí, "" escapy) ---
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); field = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Načte a vyčistí data. Vrací { idx, rows, answers, complete } kde:
//   rows     — vyčištěné řádky (bez testovacích)
//   answers  — pole objektů {qid: -2..2} nebo null (nečitelný JSON)
//   complete — indexy řádků s kompletními odpověďmi na všech 20 otázek
function loadData(csvPath) {
  const file = csvPath || process.argv[2] || DEFAULT_CSV;
  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseCSV(raw);
  const header = parsed[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const rows = parsed.slice(1).filter((r) => {
    const ua = r[idx.user_agent] || "";
    return r[idx.version] !== "test" && !ua.includes("curl") && !ua.includes("HeadlessChrome") && !ua.includes("apps-script");
  });

  const answers = rows.map((r) => {
    try { return JSON.parse(r[idx.answers_json]); } catch (e) { return null; }
  });

  const complete = [];
  rows.forEach((r, i) => {
    const a = answers[i];
    if (a && QUESTIONS.every((q) => typeof a[q.id] === "number" && a[q.id] >= -2 && a[q.id] <= 2)) complete.push(i);
  });

  console.log("Soubor: " + file);
  console.log("Vyčištěných řádků: " + rows.length + " | s kompletními odpověďmi: " + complete.length + "\n");
  return { idx, rows, answers, complete };
}

// --- Statistika ---
function mean(arr) { return arr.reduce((s, x) => s + x, 0) / arr.length; }

function pearson(a, b) {
  const n = a.length, ma = mean(a), mb = mean(b);
  let cov = 0, va = 0, vb = 0;
  for (let i = 0; i < n; i++) { cov += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; }
  const denom = Math.sqrt(va * vb);
  return denom === 0 ? 0 : cov / denom;
}

// Deterministické rozdělení train/test podle submission_id (FNV-1a hash).
// Stejný řádek skončí ve stejné skupině i při opakování analýzy na větších datech.
function hashSplit(id, testShare = 0.3) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000 < testShare ? "test" : "train";
}

// Řešení soustavy lineárních rovnic (Gaussova eliminace s pivotací)
function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    if (Math.abs(M[col][col]) < 1e-12) return null;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / M[i][i]);
}

// Krátký popisek otázky do výpisů
function qLabel(q, len = 52) {
  const t = "Q" + q.id + " " + q.text;
  return t.length > len ? t.slice(0, len - 1) + "…" : t;
}

module.exports = { QUESTIONS, DEFAULT_CSV, parseCSV, loadData, mean, pearson, hashSplit, solve, qLabel };
