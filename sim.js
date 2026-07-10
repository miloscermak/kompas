// Simulace: projede mřížku možných výsledků (obě osy -20..20, krok 1)
// a spočítá, jak často každá figura vyhrává jako dvojník a v jakém kvadrantu sedí.
// Spuštění: node sim.js
const { FIGURES, QUADRANTS } = require("./data.js");
const S = require("./scoring.js");

const wins = {};
FIGURES.forEach((f) => (wins[f.name] = 0));
let total = 0;

for (let x = -20; x <= 20; x++)
  for (let y = -20; y <= 20; y++) {
    const m = S.findMatches([x, y], FIGURES)[0];
    wins[m.name]++;
    total++;
  }

console.log("Podíl výher jako dvojník (mřížka " + total + " bodů):");
Object.entries(wins)
  .sort((a, b) => b[1] - a[1])
  .forEach(([name, n]) => {
    const f = FIGURES.find((g) => g.name === name);
    const q = S.getQuadrant(f.scores, QUADRANTS).name;
    console.log(
      (100 * n / total).toFixed(1).padStart(5) + " %  " +
      name.padEnd(26) + JSON.stringify(f.scores).padEnd(12) + q
    );
  });

// Pokrytí kvadrantů figurami
console.log("\nFigury podle kvadrantu (X = Dezoláti/Lepšolidi, Y = My/Já):");
const byQuad = {};
FIGURES.forEach((f) => {
  const q = S.getQuadrant(f.scores, QUADRANTS).name;
  (byQuad[q] = byQuad[q] || []).push(f.name + " [" + f.scores + "]");
});
Object.entries(byQuad).forEach(([q, names]) => {
  console.log("\n" + q + " (" + names.length + "):");
  names.forEach((n) => console.log("  " + n));
});

// Nejbližší dvojice figur (hlídá "dvojčata")
console.log("\nNejbližší dvojice figur:");
const pairs = [];
for (let i = 0; i < FIGURES.length; i++)
  for (let j = i + 1; j < FIGURES.length; j++) {
    const a = FIGURES[i], b = FIGURES[j];
    const d = Math.hypot(a.scores[0] - b.scores[0], a.scores[1] - b.scores[1]);
    pairs.push({ d, label: a.name + " × " + b.name });
  }
pairs.sort((a, b) => a.d - b.d).slice(0, 5).forEach((p) => console.log("  " + p.d.toFixed(1).padStart(5) + "  " + p.label));
