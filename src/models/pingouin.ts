import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A penguin standing up, facing +z. The body is an egg of square rings of flat planks, each ring turned
// half a turn of the one below, wider then narrower (the narrow ones are pinwheels). The two feet are
// the front side of the first ring, poking out. Each flipper is three planks pushed out sideways through
// the gaps of the rings. The head is a small log cabin on a lid: a chin, a beak on its edge resting on
// the chin, and two eyes pushed forward.

/** Square ring of 4 flat planks, inner edge at a from the center, turned by deg; a pinwheel below 7.5. */
const ring = (a: number, y: number, deg: number): Plank[] =>
  [0, 1, 2, 3].map((k) => spin(at('flat-x', a < 7.5 ? -a : -7.5, y, a), deg + 90 + k * 90, 0, 0));

const BODY = [7, 7.6, 8.2, 8.7, 9.1, 9.5, 9.8, 10.1, 10.3, 10.4, 10.5, 10.5, 10.4, 10.3, 10.1, 9.8, 9.5, 9.2, 8.9, 8.6, 8.2, 7.8, 7.4, 7, 6.6, 6.3, 6, 6, 6];
const body = BODY.map((a, i) => ring(a, i, i % 2 ? 45 : 0));
// first ring: the front side is the two feet, along z, sticking out in front
const feet = [-4, 1].map((x) => at('flat-z', x, 0, -1));
body[0] = body[0].slice(0, 3);

/** Flipper planks on floor y (a 45° floor), both sides, centered on the side plank of the floor below. */
const flip = (y: number): Plank[] => {
  const r = BODY[y - 1] + 9;
  return [at('flat-x', r - 15, y, -1.5), at('flat-x', -r, y, -1.5)];
};
const FLIP = [9, 11, 13];

// head: floors of flat planks, across then front to back
const H = BODY.length;
const xs = (y: number, zs: number[]) => zs.map((z) => at('flat-x', -7.5, y, z));
const zs = (y: number, list: [number, number][]) => list.map(([x, dz]) => at('flat-z', x, y, -7.5 + dz));
const COLS: [number, number][] = [[-7.5, 1], [-4, 1], [1, 1], [4.5, 1]]; // two columns each side of the beak
const beak = at('edge-z', -0.5, H + 3, -0.5); // 3 tall, sticks out 6 in front of the chin

const steps: Step[] = [
  { planks: [...feet, ...body[0]], hint: 'Les pattes devant ; trois planchettes autour' },
  ...body.slice(1).map((planks, i) => ({
    planks: [...(FLIP.includes(i + 1) ? flip(i + 1) : []), ...planks],
    ...(i === 0 && { hint: 'Chaque carré tourne d’un demi-cran' }),
    ...(i === 8 && { hint: 'Les ailes : une planchette de chaque côté, qui dépasse' }),
  })),
  { planks: xs(H, [-8.5, -5, -1.5, 2, 5.5]), hint: 'Un couvercle de 5 planchettes' },
  { planks: zs(H + 1, [[-6.75, 1], [-3.25, 1], [0.25, 1], [3.75, 1]]) },
  { planks: xs(H + 2, [-5, -1.5, 5.5]), hint: 'Le menton, tout devant' },
  { planks: [...zs(H + 3, COLS), beak], hint: 'Le bec, sur la tranche, posé sur le menton' },
  { planks: zs(H + 4, COLS) },
  { planks: zs(H + 5, COLS) },
  { planks: zs(H + 6, [[-7.5, 1], [-4, 3], [1, 3], [4.5, 1]]), hint: 'Les yeux dépassent' },
  { planks: xs(H + 7, [-6, -2.5, 1]), hint: 'Le haut de la tête' },
];

const FACE = 15; // turn the penguin a little so its beak shows from the 3/4 view
export const pingouin: Model = {
  id: 'pingouin',
  name: 'Pingouin',
  theme: 'animaux',
  difficulty: 2,
  steps: steps.map((s) => ({ ...s, planks: s.planks.map((p) => spin(p, FACE, 0, 0)) })),
};

export default pingouin;
