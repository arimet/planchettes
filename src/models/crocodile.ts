import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A crocodile lying on the floor, facing +x, mouth wide open. The middle of the animal is a band of
// 3 rows of flat planks from the tail to the chin. Four stubby legs are planks across the band sticking
// out one side, a bit less on each floor. Crossbars widen the back, two ridges run on top, and the tail
// steps down to a thin tip with a fin. The upper jaw is a lever: it leans up on a crossbar at the back of
// the mouth, and its back end is held down under the head, which is built first.
const D = Math.PI / 180;

/** n flat planks end to end along x from x0, one row per min-corner z. */
const run = (x0: number, n: number, y: number, zs: number[]): Plank[] =>
  zs.flatMap((z) => Array.from({ length: n }, (_, i) => at('flat-x', x0 + 15 * i, y, z)));

const MID = [-4.5, -1.5, 1.5]; // the middle band, 9 wide
const WIDE = [-7.5, -4.5, -1.5, 1.5, 4.5]; // the back, 15 wide
const ONE = [-1.5];
const EYES = [-4.5, 1.5];

/** A leg 6 wide at x on side ±1: two planks across the band, sticking out 6 - k on floor k. */
const leg = (x: number, side: 1 | -1, k: number): Plank[] =>
  [x, x + 3].map((xx) => at('flat-z', xx, k, side > 0 ? -1.5 - k : -13.5 + k));
const legs = (k: number) => [...leg(8, -1, k), ...leg(14, 1, k), ...leg(-20, -1, k), ...leg(-14, 1, k)];

// mouth: crossbar at XF (2 high), the upper jaw leans on its back top edge by A, its back end R behind it
const XF = 41.5, A = 20, R = 5;
const a = A * D;
const upperJaw = (z: number): Plank => {
  const s = 7.5 - R; // center along the underside, from the fulcrum
  return { x: XF + s * Math.cos(a) - 0.5 * Math.sin(a), y: 3 + s * Math.sin(a) + 0.5 * Math.cos(a), z, o: 'flat-x', tilt: A };
};
const HEAD = XF - Math.sin(a) - Math.cos(a) / Math.tan(a); // the jaw's top is at y = 3 here: the head's front edge

const bars = [-20, -14, -8, -2, 4, 10, 16].map((x) => at('flat-z', x, 3, -7.5));
const fin = (x: number, y: number) => at('edge-x', x, y, -0.5);

const steps: Step[] = [
  { planks: legs(0).slice(0, 4), hint: 'Les pattes de devant' },
  { planks: legs(0).slice(4), hint: 'Les pattes de derrière' },
  { planks: [...run(-7.5, 1, 0, MID), ...run(21, 1, 0, MID)], hint: 'Le ventre et le menton' },
  { planks: [...legs(1).slice(0, 4), ...run(-7.5, 1, 1, MID)], hint: 'Chaque étage de patte rentre un peu' },
  { planks: [...legs(1).slice(4), ...run(20.5, 1, 1, MID)] },
  { planks: [...legs(2).slice(0, 4), ...run(-7.5, 1, 2, MID)] },
  { planks: [...legs(2).slice(4), ...run(20.5, 1, 2, MID)] },
  { planks: [...run(-35.5, 1, 0, MID), ...run(-65.5, 2, 0, ONE)], hint: 'La queue, de plus en plus fine' },
  { planks: [...run(-35.5, 1, 1, MID), ...run(-50.5, 1, 1, ONE), fin(-65.5, 1)] },
  { planks: [...run(-35.5, 1, 2, MID), fin(-50.5, 2)] },
  { planks: bars, hint: 'En travers : le dos s’élargit' },
  { planks: [...run(-35, 1, 3, MID), ...run(HEAD - 15, 1, 3, MID)], hint: 'Le dessus de la tête dépasse un peu' },
  { planks: run(-5, 1, 4, WIDE) },
  { planks: [...run(-20, 1, 4, WIDE), ...run(-35, 1, 4, ONE)] },
  { planks: [...run(10, 1, 4, WIDE), ...run(25, 1, 4, MID)] },
  { planks: [...run(-17.5, 2, 5, MID), ...run(-32.5, 1, 5, ONE)] },
  { planks: run(12.5, 2, 5, MID) },
  { planks: run(36, 1, 0, MID), hint: 'La mâchoire du bas' },
  ...[1, 2].map((y) => ({ planks: [at('flat-z', XF, y, -7.5)], ...(y === 1 && { hint: 'Une barre au fond de la bouche, deux étages' }) })),
  { planks: MID.map((z) => upperJaw(z + 1.5)), hint: 'La mâchoire du haut : posée sur la barre, le bout glissé sous la tête' },
  { planks: [-4, 3].flatMap((z) => [-17.5, -2.5].map((x) => at('edge-x', x, 6, z))), hint: 'Les crêtes du dos, sur la tranche' },
  { planks: [fin(-32.5, 6), ...run(22, 1, 6, EYES)], hint: 'Les yeux' },
  { planks: run(20, 1, 7, EYES) },
];

const FACE = -30; // turn the crocodile so its open mouth looks at the camera of the 3/4 view
export const crocodile: Model = {
  id: 'crocodile',
  name: 'Crocodile',
  theme: 'animaux',
  difficulty: 2,
  steps: steps.map((s) => ({ ...s, planks: s.planks.map((p) => spin(p, FACE, 0, 0)) })),
};

export default crocodile;
