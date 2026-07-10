// ============================================================
// Český kompas 2026 — SKÓROVÁNÍ (čistá logika bez DOM)
// Funkce jsou testovatelné v node (viz test.js).
// ============================================================

// Spočítá skóre na 2 osách z odpovědí.
// answers: objekt { idOtázky: hodnota -2..+2 }
// Vrací pole [x, y]: x = Dezoláti/Lepšolidi, y = My/Já, každá -20 až +20.
function computeScores(answers, questions) {
  const scores = [0, 0];
  for (const q of questions) {
    const a = answers[q.id];
    if (typeof a === "number") {
      scores[q.axis - 1] += a * q.pole;
    }
  }
  return scores;
}

// Najde dvojníky: figury seřazené podle euklidovské vzdálenosti ve 2D.
// match = round(100 × (1 - d / MAX_DIST)), kde MAX_DIST je úhlopříčka mapy.
function findMatches(scores, figures) {
  const MAX_DIST = Math.sqrt(2 * 40 * 40); // ≈ 56,57 (úhlopříčka čtverce 40×40)
  return figures
    .map((f) => {
      const d = Math.sqrt(
        f.scores.reduce((sum, v, i) => sum + (v - scores[i]) ** 2, 0)
      );
      return { name: f.name, desc: f.desc, scores: f.scores, dist: d, match: Math.round(100 * (1 - d / MAX_DIST)) };
    })
    .sort((a, b) => a.dist - b.dist);
}

// Určí kvadrant podle os X a Y.
// Když je |skóre| na obou osách <= 4 (ekvivalent starých ±2 z ±10), je to "Chameleon středu".
function getQuadrant(scores, quadrants) {
  const x = scores[0];
  const y = scores[1];
  if (Math.abs(x) <= 4 && Math.abs(y) <= 4) return quadrants.center;
  if (x >= 0 && y >= 0) return quadrants.byznysmen;
  if (x >= 0 && y < 0) return quadrants.rovnostar;
  if (x < 0 && y >= 0) return quadrants.konzerva;
  return quadrants.socan;
}

// --- Kódování výsledku do URL (?r=...) ---
// 2 skóre (posunutá o +20 do rozsahu 0..40) + index hrozby + index líp → base64 (URL-safe)

function toBase64(str) {
  if (typeof btoa === "function") return btoa(str);
  return Buffer.from(str, "binary").toString("base64");
}

function fromBase64(str) {
  if (typeof atob === "function") return atob(str);
  return Buffer.from(str, "base64").toString("binary");
}

function encodeResult(scores, threatIndex, lipIndex) {
  const bytes = scores.map((s) => s + 20).concat([threatIndex, lipIndex]);
  const raw = String.fromCharCode(...bytes);
  return toBase64(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Vrací { scores, threatIndex, lipIndex } nebo null, když je řetězec neplatný.
function decodeResult(code) {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const raw = fromBase64(b64);
    if (raw.length !== 4) return null;
    const bytes = Array.from(raw, (c) => c.charCodeAt(0));
    const scores = bytes.slice(0, 2).map((b) => b - 20);
    const threatIndex = bytes[2];
    const lipIndex = bytes[3];
    if (scores.some((s) => s < -20 || s > 20)) return null;
    if (threatIndex < 0 || threatIndex > 4) return null;
    if (lipIndex < 0 || lipIndex > 1) return null;
    return { scores, threatIndex, lipIndex };
  } catch (e) {
    return null;
  }
}

// Export pro node (testy); v prohlížeči jsou funkce globální
if (typeof module !== "undefined") {
  module.exports = { computeScores, findMatches, getQuadrant, encodeResult, decodeResult };
}
