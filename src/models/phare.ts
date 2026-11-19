import { at, spin, type Plank } from '../geometry';
import { chunk, type Model, type Step } from '../model';

// Lighthouse: four rings of standing planks, each narrower than the one below, tied by flat floors
// (turned 45° so the gallery looks wider from a 3/4 view). A star-shaped gallery, a lantern of six
// posts, and a pointed roof: four planks leaning on a lamp column of three standing planks.
const C = 10; // tower axis (x = z = C)

/** n standing planks in a ring, center at distance r from the axis. */
const ring = (n: number, r: number, y: number): Plank[] =>
  Array.from({ length: n }, (_, k) => spin(at('up-x', C - 1.5, y, C + r - 0.5), (k * 360) / n, C, C));

/** n flat planks side by side, centered on the axis, from the middle outward. */
const floor = (n: number, y: number, o: 'flat-x' | 'flat-z'): Plank[] => {
  const offs = Array.from({ length: n }, (_, i) => 3 * i - 1.5 * n).sort((a, b) => Math.abs(a + 1.5) - Math.abs(b + 1.5));
  return offs.map((d) => (o === 'flat-x' ? at(o, C - 7.5, y, C + d) : at(o, C + d, y, C - 7.5)));
};

const SLOPE = 72; // roof, degrees from horizontal: any flatter and the feet miss the cap
const a = (SLOPE * Math.PI) / 180;
/** Roof plank leaning on the 3 × 3 lamp column, foot on y, turned by deg around the axis. */
const roofPlank = (y: number, deg: number): Plank =>
  spin({
    o: 'flat-x',
    tilt: -SLOPE,
    x: C + 1.5 + 0.02 + 7.5 * Math.cos(a) + 0.5 * Math.sin(a),
    y: y + 0.01 + 7.5 * Math.sin(a) + 0.5 * Math.cos(a),
    z: C,
  }, deg, C, C);

const TIERS: [number, number, number][] = [
  // planks in the ring, ring radius, planks in the floor on top
  [12, 6.3, 5],
  [10, 5.25, 4],
  [8, 4.25, 3],
  [6, 3.6, 3],
];
const steps: Step[] = [];
let y = 0;
TIERS.forEach(([n, r, f], i) => {
  steps.push(...chunk(ring(n, r, y), n > 8 ? Math.ceil(n / 2) : n, i === 0 ? 'Debout, en cercle' : i === 1 ? 'Un cercle un peu plus petit' : undefined));
  // floors turned 45°: from a 3/4 view they look narrower than the gallery
  const fl = floor(f, y + 15, i % 2 ? 'flat-z' : 'flat-x');
  steps.push({ planks: i < 3 ? fl.map((p) => spin(p, 45, C, C)) : fl });
  y += 16;
});
// tier 4 floor is flat-z: the gallery crosses it
steps.push({ planks: floor(5, y, 'flat-x'), hint: 'La galerie dépasse tout autour' });
steps.push({ planks: floor(5, y + 1, 'flat-z').map((p) => spin(p, 45, C, C)), hint: 'En biais, comme une étoile' });
y += 2;
steps.push({ planks: ring(6, 5, y).map((p) => spin(p, 30, C, C)), hint: 'La lanterne : des fenêtres entre les planchettes' });
const cap = y + 15;
steps.push({ planks: floor(3, cap, 'flat-x') }, { planks: floor(3, cap + 1, 'flat-z') });
const col = cap + 2;
steps.push(
  { planks: [-1, 0, 1].map((d) => at('up-x', C - 1.5, col, C - 0.5 + d)), hint: 'La lampe : trois planchettes debout, collées' },
  // feet: ±x on the lower cap layer, ±z on the upper one
  { planks: [roofPlank(cap + 1, 0), roofPlank(cap + 1, 180), roofPlank(col, 90), roofPlank(col, 270)], hint: 'Le toit pointu s’appuie sur la lampe' },
);

export const phare: Model = { id: 'phare', name: 'Phare', theme: 'tours', difficulty: 2, steps };
export default phare;
