import { at, type Plank } from '../../geometry';
import type { Model, Step } from '../../model';

// A snail crawling toward +x. A long flat foot of rows. On its middle the shell stands up: seven columns
// of planks laid across, the middle ones taller, so its face (toward +z, the camera) is a round arch.
// Some planks of the face come 3 forward and draw a square spiral. In front, a small head with two
// eye stalks standing up, held between the head and the snout.

/** Flat planks along x from x0, one row per min-corner z. */
const rows = (x0: number, y: number, zs: number[]): Plank[] => zs.map((z) => at('flat-x', x0, y, z));
const MID = [-4.5, -1.5, 1.5];
const OUT = [-7.5, 4.5];

const COLS = [-9, -6, -3, 0, 3, 6, 9]; // centers of the shell's columns
const H = 20; // shell height in the middle
const R = 10.8; // the face is a circle of this radius, its bottom cut by the foot
const CY = 1 + H - R; // center of the circle
const height = (cx: number) => Math.round(CY - 1 + Math.sqrt(R * R - cx * cx));
// The spiral drawn on the face, column by column (left to right): the layers whose plank comes 3 forward.
const SPIRAL: [number, number][][] = [
  [[3, 13]],
  [[13, 17]],
  [[2, 11], [16, 17]],
  [[2, 3], [6, 7], [10, 11], [16, 17]],
  [[2, 3], [6, 11], [16, 17]],
  [[2, 3], [13, 17]],
  [[2, 13]],
];
const forward = (col: number, i: number) => (SPIRAL[col].some(([a, b]) => i >= a && i <= b) ? 3 : 0);
const shell: Plank[][] = Array.from({ length: H }, (_, i) =>
  COLS.flatMap((cx, col) => (i < height(cx) ? [at('flat-z', cx - 1.5, 1 + i, -7.5 + forward(col, i))] : [])));

const foot0 = [...[-24, -9, 6, 21].flatMap((x) => rows(x, 0, MID)), ...[-15, 0].flatMap((x) => rows(x, 0, OUT))];
const foot1 = [...rows(-26, 1, MID), ...rows(11, 1, MID), ...rows(26, 1, MID)];
const HX = 27; // front of the head: the stalks stand here
const stalks = [-4.5, 1.5].map((z) => at('up-z', HX, 2, z));

const steps: Step[] = [
  { planks: foot0.slice(0, 6), hint: 'Le pied : une longue bande de 3 rangées' },
  { planks: foot0.slice(6, 12) },
  { planks: foot0.slice(12), hint: 'Plus large sous la coquille' },
  { planks: foot1.slice(0, 3), hint: 'La queue, un étage plus haut' },
  { planks: foot1.slice(3), hint: 'Le cou' },
  ...shell.map((planks, i) => ({
    planks,
    ...(i === 0 && { hint: 'La coquille : 7 planchettes en travers, collées' }),
    ...(i === 2 && { hint: 'Celles du dessin avancent d’un doigt : la spirale' }),
  })),
  { planks: rows(HX - 15, 2, MID), hint: 'La tête' },
  { planks: rows(HX - 15, 3, MID) },
  { planks: stalks, hint: 'Les yeux : deux planchettes debout contre la tête' },
  { planks: rows(HX + 1, 2, MID), hint: 'Le museau les tient devant' },
];

export const escargot: Model = { id: 'escargot', name: 'Escargot', theme: 'animaux', difficulty: 2, steps };

export default escargot;
