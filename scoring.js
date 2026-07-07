// ============================================================
// Český kompas 2026 — SKÓROVÁNÍ (čistá logika bez DOM)
// Funkce jsou testovatelné v node (viz test.js).
// ============================================================

// Spočítá skóre na 4 osách z odpovědí.
// answers: objekt { idOtázky: hodnota -2..+2 }
// Vrací pole [osa1, osa2, osa3, osa4], každá -10 až +10.
function computeScores(answers, questions) {
  const scores = [0, 0, 0, 0];
  for (const q of questions) {
    const a = answers[q.id];
    if (typeof a === "number") {
      scores[q.axis - 1] += a * q.pole;
    }
  }
  return scores;
}

// Najde dvojníky: figury seřazené podle euklidovské vzdálenosti ve 4D.
// match = round(100 × (1 - d / 40)), kde 40 je maximální možná vzdálenost.
function findMatches(scores, figures) {
  const MAX_DIST = 40; // sqrt(4 × 20²)
  return figures
    .map((f) => {
      const d = Math.sqrt(
        f.scores.reduce((sum, v, i) => sum + (v - scores[i]) ** 2, 0)
      );
      return { name: f.name, desc: f.desc, scores: f.scores, dist: d, match: Math.round(100 * (1 - d / MAX_DIST)) };
    })
    .sort((a, b) => a.dist - b.dist);
}

// Určí kvadrant podle os 1 (X) a 3 (Y).
// Když je |skóre| na obou osách <= 2, je to "Chameleon středu".
function getQuadrant(scores, quadrants) {
  const x = scores[0];
  const y = scores[2];
  if (Math.abs(x) <= 2 && Math.abs(y) <= 2) return quadrants.center;
  if (x >= 0 && y >= 0) return quadrants.bruselBudelip;
  if (x >= 0 && y < 0) return quadrants.bruselBylolip;
  if (x < 0 && y >= 0) return quadrants.trumpBudelip;
  return quadrants.trumpBylolip;
}

// Odznaky pro osy 2 a 4. Při |skóre| <= 2 "Nerozhodnutý".
function getBadges(scores, badges) {
  const b2 = Math.abs(scores[1]) <= 2 ? badges.undecided : scores[1] > 0 ? badges.axis2plus : badges.axis2minus;
  const b4 = Math.abs(scores[3]) <= 2 ? badges.undecided : scores[3] > 0 ? badges.axis4plus : badges.axis4minus;
  return [b2, b4];
}

// --- Kódování výsledku do URL (?r=...) ---
// 4 skóre (posunutá o +10 do rozsahu 0..20) + index hrozby → base64 (URL-safe)

function toBase64(str) {
  if (typeof btoa === "function") return btoa(str);
  return Buffer.from(str, "binary").toString("base64");
}

function fromBase64(str) {
  if (typeof atob === "function") return atob(str);
  return Buffer.from(str, "base64").toString("binary");
}

function encodeResult(scores, threatIndex) {
  const bytes = scores.map((s) => s + 10).concat([threatIndex]);
  const raw = String.fromCharCode(...bytes);
  return toBase64(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Vrací { scores, threatIndex } nebo null, když je řetězec neplatný.
function decodeResult(code) {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const raw = fromBase64(b64);
    if (raw.length !== 5) return null;
    const bytes = Array.from(raw, (c) => c.charCodeAt(0));
    const scores = bytes.slice(0, 4).map((b) => b - 10);
    const threatIndex = bytes[4];
    if (scores.some((s) => s < -10 || s > 10)) return null;
    if (threatIndex < 0 || threatIndex > 4) return null;
    return { scores, threatIndex };
  } catch (e) {
    return null;
  }
}

// Export pro node (testy); v prohlížeči jsou funkce globální
if (typeof module !== "undefined") {
  module.exports = { computeScores, findMatches, getQuadrant, getBadges, encodeResult, decodeResult };
}
