import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A turtle facing +x. Spokes on the floor stick out from under the shell: four wide flippers on the
// diagonals, the neck in front, a little tail behind. The shell is a low corbelled dome: rings of flat
// planks around the same center, each ring a bit smaller than the one below and turned half a plank,
// which draws a zigzag pattern. The head is a small stack on the neck, sticking out in front.

/** Flat plank pointing out at deg (from +x, toward -z when positive), from radius r0 to r0 + 15, side offset s. */
const spoke = (deg: number, r0: number, s = 0, y = 0): Plank => spin(at('flat-x', r0, y, s - 1.5), deg, 0, 0);
/** A wide flipper: two spokes side by side. */
const flipper = (deg: number, r0: number) => [spoke(deg, r0, -1.5), spoke(deg, r0, 1.5)];

/** Ring of n flat planks, inner edge at a from the center, turned so plank k sits at deg + k·360/n. */
const ring = (n: number, a: number, y: number, deg: number): Plank[] =>
  Array.from({ length: n }, (_, k) => spin(at('flat-x', -7.5, y, a), deg + 90 + (k * 360) / n, 0, 0));

// the shell's wall is steep at the bottom and leans in more and more: each ring comes 0.3 closer, then 0.4…
const shell: Plank[][] = [];
for (let i = 0, a = 18.5; ; i++, a -= Math.min(1, 0.3 + 0.1 * i)) {
  const n = [8, 7, 6, 5, 4, 3].find((n) => a >= 7.5 / Math.tan(Math.PI / n) + 0.3);
  if (!n) break;
  shell.push(ring(n, a, 1 + i, i % 2 ? 180 / n : 0));
}
const top = 1 + shell.length;
// the last ring is a triangle with a side at -x: the lid lies across the other two sides, plus one on that side
const lid = [-7.5, 0, 3].map((x) => at('flat-z', x, top, -7.5));
const cap = at('flat-x', -7.5, top + 1, -1.5);

const steps: Step[] = [
  { planks: [...flipper(45, 17), ...flipper(-45, 17)], hint: 'Les nageoires de devant, en biais' },
  { planks: [...flipper(135, 12), ...flipper(-135, 12)], hint: 'Celles de derrière' },
  { planks: [spoke(0, 17, -1.5), spoke(0, 17, 1.5), spoke(180, 10), spoke(90, 7), spoke(-90, 7)], hint: 'Le cou, la queue, et deux cachées sous la carapace' },
  ...shell.map((planks, i) => ({
    planks,
    ...(i === 0 && { hint: 'Un cercle de 8 : une planchette sur chaque patte' }),
    ...(i === 1 && { hint: 'Chaque cercle rentre un peu et tourne d’un demi-cran' }),
  })),
  { planks: lid, hint: 'Le couvercle' },
  { planks: [cap] },
  { planks: [-3, 0].map((z) => at('flat-x', 22.2, 1, z)), hint: 'La tête, sur le cou' },
  { planks: [-3, 0].map((z) => at('flat-x', 23, 2, z)) },
  { planks: [at('flat-x', 22.5, 3, -1.5)] },
];

const FACE = -20; // turn the turtle so it looks at the camera of the 3/4 view
export const tortue: Model = {
  id: 'tortue',
  name: 'Tortue',
  theme: 'animaux',
  difficulty: 2,
  steps: steps.map((s) => ({ ...s, planks: s.planks.map((p) => spin(p, FACE, 0, 0)) })),
};

export default tortue;
