import { at, overlaps, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A grove of five small trees to plant around a village, each built on its own and cheap in planks.
// At the back a tall thin poplar (planks on edge crossing, each floor turned) and a fir (two cones of
// leaning planks, one on the other). In front a round tree (a ball of turned layers on a trunk), a low
// wide apple tree (windmills of 4 planks) and an old oak (roots leaning on the trunk).
// Every tree is designed around (0, 0), then moved to its place.

type P = Plank[];
const QUARTERS = [0, 180, 90, 270];
const GAPS = QUARTERS.map((d) => d + 45);
const PITCH = 3.25;

/** n planks lying side by side, from the middle outward, the row turned by deg. */
const flat = (n: number, y: number, deg = 0): P =>
  Array.from({ length: n }, (_, k) => (k - (n - 1) / 2) * PITCH)
    .sort((a, b) => Math.abs(a) - Math.abs(b))
    .map((z) => spin(at('flat-x', -7.5, y, z - 1.5), deg, 0, 0));
/** 2 planks on edge, 6 apart, turned by deg. */
const onEdge = (y: number, deg = 0): P => [-3, 3].map((z) => spin(at('edge-x', -7.5, y, z - 0.5), deg, 0, 0));
/** 4 planks in a windmill, tips reaching R from the axis: the smaller R, the bigger the hole in the middle. */
const mill = (R: number, y: number, deg = 0): P => QUARTERS.map((k) => spin(at('flat-x', R - 15, y, R - 18), k + deg, 0, 0));
/** Trunk: 4 standing planks turning around a hole, each one held by the next. */
const post = (): P => [at('up-x', -2, 0, -2), at('up-z', 1, 0, -2), at('up-x', -1, 0, 1), at('up-z', -2, 0, -1)];
/** Mast: 3 standing planks stuck together. */
const mast = (y: number): P => [-1.5, -0.5, 0.5].map((z) => at('up-x', -1.5, y, z));
/** A plank with its foot at `foot` from the axis at height y, leaning inward at a degrees from the floor, turned to deg. */
const pole = (foot: number, y: number, a: number, deg: number): Plank => {
  const r = (a * Math.PI) / 180;
  return spin({ x: foot - 7.5 * Math.cos(r) + 0.5 * Math.sin(r), y: y + 7.5 * Math.sin(r) + 0.5 * Math.cos(r) + 0.02, z: 0, o: 'flat-x', tilt: -a }, deg, 0, 0);
};
/** Poles lowered from upright until they touch what is already there: they lean on it. */
const lean = (on: P, foot: number, y: number, degs: number[]): P =>
  degs.map((deg) => {
    let a = 89;
    while (!on.some((p) => overlaps(p, pole(foot, y, a, deg)))) a -= 0.25;
    return pole(foot, y, a + 0.25, deg);
  });
/** A trunk, 4 planks leaning on its faces, 4 more in the gaps. */
const skirt = (): [P, P, P] => {
  const trunk = post();
  const faces = lean(trunk, 9, 0, QUARTERS);
  return [trunk, faces, lean([...trunk, ...faces], 9.5, 0, GAPS)];
};
const move = (steps: Step[], dx: number, dz: number): Step[] =>
  steps.map((s) => ({ ...s, planks: s.planks.map((p) => ({ ...p, x: p.x + dx, z: p.z + dz })) }));

// Poplar: a trunk, then pairs of planks on edge, each pair crossing the one below and turned a bit more.
const FLOORS = 10;
const TURN = 102;
const poplar: Step[] = [
  { planks: post(), hint: 'Un peuplier, grand et fin : 4 planchettes debout pour le tronc' },
  { planks: flat(2, 15), hint: 'Deux planchettes couchées sur le tronc' },
  ...Array.from({ length: FLOORS }, (_, i) => ({
    planks: onEdge(16 + 3 * i, 90 + i * TURN),
    ...(i === 0 && { hint: 'Deux planchettes sur la tranche, en travers' }),
    ...(i === 1 && { hint: 'Chaque étage croise celui du dessous et tourne un peu' }),
  })),
  { planks: flat(2, 16 + 3 * FLOORS, 90 + FLOORS * TURN) },
  { planks: flat(1, 17 + 3 * FLOORS, FLOORS * TURN) },
];

// Fir: 8 planks leaning on the trunk, a floor that sticks out, and 8 more leaning on a mast.
const [firTrunk, firLow, firLowGaps] = skirt();
const firMast = mast(17);
const firTop = lean(firMast, 6.3, 17, QUARTERS);
const fir: Step[] = [
  { planks: firTrunk, hint: 'Un petit sapin : d’abord le tronc' },
  { planks: flat(2, 15) },
  { planks: firLow, hint: 'Les branches du bas : penche 4 planchettes contre le tronc' },
  { planks: firLowGaps, hint: 'Et 4 autres dans les trous' },
  { planks: flat(5, 16, 90), hint: 'Un plancher : commence par le milieu' },
  { planks: firMast, hint: 'Trois planchettes debout, collées' },
  { planks: firTop, hint: 'Les branches du haut : penche-les contre le mât' },
  { planks: lean([...firMast, ...firTop], 8, 17, GAPS), hint: 'Encore 4 dans les trous' },
];

// Round tree: a trunk and a ball of layers, each turned an eighth of a turn.
const round: Step[] = [
  { planks: post(), hint: 'Un arbre tout rond : d’abord le tronc' },
  ...[2, 3, 4, 4, 4, 3, 2, 1].map((n, i) => ({
    planks: flat(n, 15 + i, i === 0 ? 0 : 45 + i * 45),
    ...(i === 0 && { hint: 'Deux planchettes couchées sur le tronc' }),
    ...(i === 2 && { hint: 'Chaque étage tourne d’un cran' }),
  })),
];

// Apple tree: low and wide. Windmills of 4 branches on a small floor, each a step shorter.
const apple: Step[] = [
  { planks: post(), hint: 'Un pommier, bas et large : d’abord le tronc' },
  { planks: flat(2, 15) },
  { planks: flat(4, 16, 90) },
  { planks: mill(12, 17), hint: '4 branches en moulinet, qui dépassent' },
  { planks: mill(11, 18, 6), hint: 'Chaque étage rentre d’un cran et tourne un peu' },
  { planks: mill(10, 19, 12) },
  { planks: flat(3, 20, 57), hint: 'Trois planchettes pour boucher le trou' },
  { planks: flat(2, 21, 147) },
];

// Oak: big roots leaning on the trunk, and a wide ball.
const [oakTrunk, oakRoots, oakRootGaps] = skirt();
const oak: Step[] = [
  { planks: oakTrunk, hint: 'Un vieux chêne : d’abord le tronc' },
  { planks: flat(2, 15) },
  { planks: oakRoots, hint: 'Ses grosses racines : penche 4 planchettes contre le tronc' },
  { planks: oakRootGaps, hint: 'Et 4 autres dans les trous' },
  ...[3, 4, 5, 4, 3, 2].map((n, i) => ({ planks: flat(n, 16 + i, 90 + i * 45), ...(i === 1 && { hint: 'Chaque étage tourne d’un cran' }) })),
];

// back ones first; seen from the front, none hides another
const steps: Step[] = [...move(poplar, 17.5, -18), ...move(fir, 43, -10), ...move(oak, -2, -2), ...move(apple, -48, 10), ...move(round, -22.5, 14)];

export const petitsArbres: Model = { id: 'petits-arbres', name: 'Petits arbres', theme: 'originaux', difficulty: 2, steps };
export default petitsArbres;
