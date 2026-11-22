import { at, spin, type Plank } from '../../geometry';
import { logWall, type Model, type Step } from '../../model';

// Tower of Babel, after Bruegel: round tiers, each one a little narrower, each a wall under a band of
// arches. A wall is a polygon of flat planks (8, then 7, then 6 sides) around a square core of 4 planks;
// every layer turns half a side so it sits across the corners below. The arches: planks on edge laid
// like spokes from the core onto the wall; seen from outside, their ends are thin pillars with dark
// gaps. Each spoke reaches 1.5 onto the wall below, and the next wall sits flush on the spokes' ends:
// every tier steps in by 1.5 and turns a little, so the terraces wind up. On top, the core goes on alone.
// Rings 7 and 6 are wider than their planks need: the gaps at their corners are more arches.
const TWIST = 10; // each tier turns this much more
const WALL = 3; // layers of each wall

/** n planks lying flat, tangent to a circle of radius r (their centers). */
const ring = (n: number, r: number, y: number, phase: number): Plank[] =>
  Array.from({ length: n }, (_, i) => spin(at('flat-x', -7.5, y, r - 1.5), phase + (i * 360) / n, 0, 0));
/** Core layer: pinwheel of 4 planks around an 18 × 18 square. */
const core = (y: number, phase: number): Plank[] =>
  [at('flat-x', 0, y, 0), at('flat-z', 15, y, 0), at('flat-x', 3, y, 15), at('flat-z', 0, y, 3)]
    .map((p) => spin({ ...p, x: p.x - 9, z: p.z - 9 }, phase, 0, 0));
/** n planks on edge, like spokes, their outer ends at radius out. */
const spokes = (n: number, out: number, y: number, phase: number): Plank[] =>
  Array.from({ length: n }, (_, i) => spin(at('edge-z', -0.5, y, out - 15), phase + (i * 360) / n, 0, 0));

const steps: Step[] = [];
let y = 0;
let out = 21.3; // outer radius of the current wall
const TIERS: [number, number][] = [[8, 16], [7, 14], [6, 8]]; // [wall sides, arches]
const marks: number[] = []; // first step of each tier, then of its arches
TIERS.forEach(([n, arches], t) => {
  const ph = t * TWIST;
  marks.push(steps.length);
  for (let l = 0; l < WALL; l++, y++) {
    steps.push({ planks: ring(n, out - 1.5, y, ph + (l % 2) * (180 / n)) }, { planks: core(y, ph) });
  }
  out -= 1.5;
  marks.push(steps.length);
  const s = spokes(arches, out, y, ph + 180 / arches);
  for (let i = 0; i < s.length; i += 8) steps.push({ planks: s.slice(i, i + 8) });
  y += 3;
});
// the top: the core alone, then a small log-cabin tower that turns a notch every layer, left open
// (Bruegel's tower is unfinished)
const ph = TIERS.length * TWIST;
const top = steps.length;
for (let l = 0; l < 4; l++, y++) steps.push({ planks: core(y, ph) });
const small = logWall(-7.5, -7.5, y, 8);
for (let l = 0; l < 8; l++) steps.push({ planks: small.slice(2 * l, 2 * l + 2).map((p) => spin(p, ph + 45 + 12 * l, 0, 0)) });

steps[0].hint = 'Huit planchettes en anneau : leurs bouts se touchent à l’intérieur';
steps[1].hint = 'Au milieu, un carré de 4 planchettes en moulinet';
steps[2].hint = 'L’anneau suivant tourne d’un demi-côté : il passe sur les coins';
steps[marks[1]].hint = 'Les arches : sur la tranche, du carré jusqu’à l’anneau';
steps[marks[2]].hint = 'Un anneau plus petit, posé au bout des rayons';
steps[top].hint = 'Le carré du milieu continue seul';
steps[top + 4].hint = 'Une petite tour qui tourne d’un cran à chaque étage';

export const tourDeBabel: Model = { id: 'tour-de-babel', name: 'Tour de Babel', theme: 'monuments', difficulty: 3, steps };
export default tourDeBabel;
