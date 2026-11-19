import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Giraffe facing +x. Four long legs (two floors of standing planks, a knee between), a narrow body
// of rails, the rump lower, with planks sloping from the rump up to the withers. The neck is two
// standing floors, the top one a step further forward; the head looks ahead, ears across at the back.
const D = Math.PI / 180;

/** Standing column 4 × 4: 4 planks turning around a hole. */
const post = (x: number, z: number, y: number): Plank[] =>
  [at('up-x', x, y, z), at('up-z', x + 3, y, z), at('up-x', x + 1, y, z + 3), at('up-z', x, y, z + 1)];

/** Standing column 7 × 4: 6 planks. */
const thick = (x: number, z: number, y: number): Plank[] => [
  at('up-x', x, y, z), at('up-x', x + 3, y, z), at('up-z', x + 6, y, z),
  at('up-x', x + 4, y, z + 3), at('up-x', x + 1, y, z + 3), at('up-z', x, y, z + 1),
];

/** Flat plank along x, lower back corner on (fx, fy), underside on the edge (ex, ey). */
function ramp(fx: number, fy: number, ex: number, ey: number, z: number): Plank {
  const a = Math.atan2(ey - fy, ex - fx);
  return { x: fx + 7.5 * Math.cos(a) - 0.5 * Math.sin(a), y: fy + 7.5 * Math.sin(a) + 0.5 * Math.cos(a), z: z + 1.5, o: 'flat-x', tilt: a / D };
}

const FRONT = 4; // front legs x
const BACK = -14; // back legs x
const bars = (y: number) => [FRONT, BACK].flatMap((x) => [at('flat-z', x - 1, y, 0), at('flat-z', x + 2, y, 0)]);
const legs = (x: number, y: number) => [1, 10].flatMap((z) => post(x, z, y));

// body: two blocks of 3 rails, each held by its pair of legs; the front one (withers) is taller
const RUMP = 6;
const WITHERS = 9;
const rail = (x: number, y: number, z: number) => at('flat-x', x, y, z);
const rump = Array.from({ length: RUMP }, (_, i) => [3, 6, 9].map((z) => (i === 4 && z === 6 ? rail(-24, 32 + i, z) : rail(-18, 32 + i, z))));
const withers = Array.from({ length: WITHERS }, (_, i) => [3, 6, 9].map((z) => rail(-3, 32 + i, z)));
const TOP = 32 + WITHERS;
const back = [3, 6, 9].map((z) => ramp(-16.5, 32 + RUMP, -3, TOP, z));

const NZ = 5.5; // neck z
const N1 = TOP;
const N2 = N1 + 16;
const tray = [NZ - 1, NZ + 2].map((z) => at('flat-x', 0, N1 + 15, z));
const head = [NZ - 1, NZ + 2].map((z) => at('flat-x', 6, N2 + 15, z));
const ears = at('flat-z', 6.5, N2 + 16, 0);

const steps: Step[] = [
  { planks: legs(FRONT, 0), hint: 'Deux pattes : 4 planchettes debout qui tournent autour d’un trou' },
  { planks: legs(BACK, 0), hint: 'Les deux pattes de derrière' },
  { planks: bars(15), hint: 'Les genoux : deux planchettes en travers sur chaque paire' },
  { planks: legs(FRONT, 16) },
  { planks: legs(BACK, 16) },
  { planks: bars(31) },
  ...withers.map((front, i) => ({
    planks: [...(rump[i] ?? []), ...front],
    ...(i === 0 && { hint: 'Le corps : 3 planchettes derrière, 3 devant, bout à bout' }),
    ...(i === 4 && { hint: 'La queue dépasse derrière' }),
    ...(i === RUMP && { hint: 'Devant, on monte plus haut : les épaules' }),
  })),
  { planks: back, hint: 'Penche le dos contre les épaules' },
  { planks: thick(5, NZ, N1), hint: 'Le cou : 6 planchettes debout' },
  { planks: tray, hint: 'Un plateau, qui dépasse derrière' },
  { planks: thick(8, NZ, N2), hint: 'Le haut du cou avance d’un cran' },
  { planks: head, hint: 'La tête regarde devant' },
  { planks: [ears], hint: 'Les oreilles, en travers' },
];

export const girafe: Model = { id: 'girafe', name: 'Girafe', theme: 'animaux', difficulty: 2, steps };

export default girafe;
