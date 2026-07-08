// Simulace: projede mřížku možných výsledků (každá osa -10..10, krok 2)
// a spočítá, jak často každá figura vyhrává jako dvojník a v jakém kvadrantu sedí.
const { FIGURES, QUADRANTS } = require("./data.js");
const S = require("./scoring.js");

const wins = {};
FIGURES.forEach((f) => (wins[f.name] = 0));
let total = 0;

for (let a = -10; a <= 10; a += 2)
  for (let b = -10; b <= 10; b += 2)
    for (let c = -10; c <= 10; c += 2)
      for (let d = -10; d <= 10; d += 2) {
        const m = S.findMatches([a, b, c, d], FIGURES)[0];
        wins[m.name]++;
        total++;
      }

console.log("Podíl výher jako dvojník (mřížka " + total + " bodů):");
Object.entries(wins)
  .sort((x, y) => y[1] - x[1])
  .forEach(([name, n]) => {
    const f = FIGURES.find((g) => g.name === name);
    const q = S.getQuadrant(f.scores, QUADRANTS).name;
    console.log(
      (100 * n / total).toFixed(1).padStart(5) + " %  " +
      name.padEnd(26) + JSON.stringify(f.scores).padEnd(18) + q
    );
  });

// Pokrytí kvadrantů figurami
console.log("\nFigury podle kvadrantu (X = osa 1, Y = osa 3):");
const byQuad = {};
FIGURES.forEach((f) => {
  const q = S.getQuadrant(f.scores, QUADRANTS).name;
  (byQuad[q] = byQuad[q] || []).push(f.name + " [" + f.scores + "]");
});
Object.entries(byQuad).forEach(([q, names]) => {
  console.log("\n" + q + " (" + names.length + "):");
  names.forEach((n) => console.log("  " + n));
});
