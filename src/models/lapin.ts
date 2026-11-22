import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A sitting rabbit facing +z. The body is a round lump of square rings of flat planks, each ring turned
// half a turn of the one below, wider then narrower; the top rings slide forward, the chest. The first
// ring is made of the front paws and the long hind feet. The round tail is two planks pushed out at the
// back through the gaps of the rings. The head is a small log cabin on a lid, with a nose and two eyes
// pushed forward, and on top two long ears standing up, held at their base by planks in front and behind.

/** Square ring of 4 flat planks around (0, c), inner edge at a, turned by deg; a pinwheel below 7.5. */
const ring = (a: number, c: number, y: number, deg: number): Plank[] =>
  [0, 1, 2, 3].map((k) => {
    const p = spin(at('flat-x', a < 7.5 ? -a : -7.5, y, a), deg + 90 + k * 90, 0, 0);
    return { ...p, z: p.z + c };
  });

const BODY = [8.5, 9.1, 9.6, 10, 10.3, 10.5, 10.6, 10.5, 10.3, 10, 9.6, 9.1, 8.5, 7.9, 7.2, 6.6, 6];
const C = BODY.map((_, i) => Math.max(0, i - 8) * 0.6); // the chest leans forward
const body = BODY.map((a, i) => ring(a, C[i], i, i % 2 ? 45 : 0));
// first ring: the paws in front and the hind feet on the sides, all front to back
const paws = [-4, 1].map((x) => at('flat-z', x, 0, 0));
const feet = [-12.5, 9.5].map((x) => at('flat-z', x, 0, -3.5));
body[0] = [body[0][1]]; // keep the back side

/** Tail plank on floor y (a 45° floor), centered on the back plank of the floor below. */
const tail = (y: number) => at('flat-z', -1.5, y, -BODY[y - 1] - 9);
const TAIL = [3, 5];

// head, on the top ring (center c)
const H = BODY.length;
const c = C[H - 1];
const xs = (y: number, zs: number[]) => zs.map((z) => at('flat-x', -7.5, y, c + z));
const zs = (y: number, list: [number, number][]) => list.map(([x, dz]) => at('flat-z', x, y, c - 7.5 + dz));
const X4 = [-6.75, -3.25, 0.25, 3.75];
const ears = [-5, 2].map((x) => at('up-x', x, H + 5, c - 1));

const steps: Step[] = [
  { planks: [...paws, ...feet, ...body[0]], hint: 'Les pattes devant, les grands pieds sur les côtés, une derrière' },
  ...body.slice(1).map((planks, i) => ({
    planks: [...(TAIL.includes(i + 1) ? [tail(i + 1)] : []), ...planks],
    ...(i === 0 && { hint: 'Chaque carré tourne d’un demi-cran' }),
    ...(i === 2 && { hint: 'La queue dépasse derrière' }),
    ...(i === 8 && { hint: 'Les carrés avancent un peu : le ventre' }),
  })),
  { planks: xs(H, [-8.5, -5, -1.5, 2, 5.5]), hint: 'Un couvercle de 5 planchettes' },
  { planks: zs(H + 1, X4.map((x, i) => [x, i === 1 || i === 2 ? 3.5 : 1])), hint: 'Le museau : les deux du milieu dépassent' },
  { planks: xs(H + 2, [-6.5, -3, 0.5, 4]) },
  { planks: zs(H + 3, X4.map((x, i) => [x, i === 0 || i === 3 ? 3.5 : 1])), hint: 'Les yeux : celles des bords dépassent' },
  { planks: xs(H + 4, [-5, -1.5, 2]) },
  { planks: ears, hint: 'Les oreilles : deux planchettes debout' },
  { planks: xs(H + 5, [-4.5, 0.5]), hint: 'Coince-les devant et derrière' },
];

const FACE = 15; // turn the rabbit a little toward the camera of the 3/4 view
export const lapin: Model = {
  id: 'lapin',
  name: 'Lapin',
  theme: 'animaux',
  difficulty: 2,
  steps: steps.map((s) => ({ ...s, planks: s.planks.map((p) => spin(p, FACE, 0, 0)) })),
};

export default lapin;
