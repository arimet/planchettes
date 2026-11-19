import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A two-storey family house, gable to the front. Walls are 7 columns of front-to-back planks
// (x 4.5..25.5): leaving a column out opens the door or a window, the plank under a window
// sticks out as its sill. Lintels close the ground floor and carry the floor (a band in front, a
// balcony over the door); logs crossing out at the corners carry the ceiling (the eaves).
// Roof: the chalet's, on a stepped attic, with a ridge cap and a chimney standing behind it.

const COL = (k: number) => 4.5 + 3 * k; // 7 columns, door in column 3, windows in 1 and 5
const ANGLE = 30;
const TAN = Math.tan((ANGLE * Math.PI) / 180);
const RIDGE = 7; // attic rows; the last one is the ridge at x 13.5
const FOOT = 13.5 - RIDGE / TAN; // x where the left roof plank stands on the ceiling
const CEIL = 17;
const TOP = CEIL + 1;

/** Wall layer: every column but the open ones; the sill row pushes window columns 1 forward. */
function wall(y: number, open: number[], sill = false): Plank[] {
  return [0, 1, 2, 3, 4, 5, 6].filter((k) => !open.includes(k)).map((k) => at('flat-z', COL(k), y, sill && (k === 1 || k === 5) ? 1 : 0));
}

/** Front and back logs, 30 long: their ends stick out at the corners. */
const logs = (y: number, back: number): Plank[] => [0, 15].flatMap((x) => [at('flat-x', x, y, 13), at('flat-x', x, y, back)]);

/** Symmetric row of front-to-back planks from x = a to 30 - a. */
function attic(a: number, y: number): Plank[] {
  const n = Math.floor((30 - 2 * a) / 3 + 1e-6);
  const xs: number[] = [];
  for (let i = 0; i < Math.floor(n / 2); i++) xs.push(a + 3 * i, 27 - a - 3 * i);
  if (n % 2) xs.push(13.5);
  return xs.sort((p, q) => p - q).map((x) => at('flat-z', x, y, 3));
}

/** Left roof plank (side 1) or its mirror (side -1), foot on the ceiling at z. */
function roof(z: number, side: 1 | -1): Plank {
  const t = (ANGLE * Math.PI) / 180;
  const x = FOOT + 7.5 * Math.cos(t) - 0.5 * Math.sin(t);
  const y = TOP + 7.5 * Math.sin(t) + 0.5 * Math.cos(t) + 0.02;
  return { x: side === 1 ? x : 30 - x, y, z: z + 1.5, o: 'flat-x', tilt: side * ANGLE };
}

/** One storey from layer y: 3 full rows, 4 window rows, then its top (lintels or logs). */
function storey(y: number, top: Step): Step[] {
  return [
    { planks: wall(y, [3]) },
    { planks: wall(y + 1, [3]) },
    { planks: wall(y + 2, [3], true), hint: 'Sous les fenêtres, avance la planchette d’un cran : le rebord' },
    ...[3, 4, 5, 6].map((i) => ({ planks: wall(y + i, [1, 3, 5]), ...(i === 3 && { hint: 'Laisse les trous des fenêtres et de la porte' }) })),
    top,
  ];
}

// ground floor top: corner columns, front and back lintels, and a beam inside for the balcony
const lintels: Plank[] = [at('flat-z', COL(0), 7, 0), at('flat-z', COL(6), 7, 0), at('flat-x', 7.5, 7, 13), at('flat-x', 7.5, 7, 0), at('flat-x', 7.5, 7, 6)];
// floor: a band 3 out in front; the five middle planks 6 out, the balcony
const floor = Array.from({ length: 7 }, (_, k) => at('flat-z', COL(k), 8, k === 0 || k === 6 ? 3 : 6));
const ceiling = Array.from({ length: 10 }, (_, i) => at('flat-z', 3 * i, CEIL, 3));
const rows = Array.from({ length: RIDGE }, (_, j) => attic(FOOT + (j + 1) / TAN, TOP + j));
const zs = [3, 6, 9, 12, 15];
const t = (ANGLE * Math.PI) / 180;
const capY = TOP + 15 * Math.sin(t) + Math.cos(t) + 0.55; // resting on the top corners of both slopes

export const maison: Model = {
  id: 'maison',
  name: 'Maison',
  theme: 'maisons',
  difficulty: 3,
  steps: [
    ...storey(0, { planks: lintels, hint: 'Les linteaux ferment le haut des fenêtres et de la porte' }).map((s, i) =>
      i === 0 ? { ...s, hint: 'Sept planchettes en rang, avec un trou au milieu : la porte' } : s,
    ),
    { planks: [at('flat-x', 7.5, 0, 15.3)], hint: 'La marche devant la porte' },
    { planks: floor, hint: 'Le plancher dépasse devant, encore plus au milieu : le balcon' },
    ...storey(9, { planks: [...logs(16, 3), at('flat-x', 15, 16, 0)], hint: 'Les poutres dépassent aux coins ; une de plus derrière, pour la cheminée' }).map((s, i) => (i === 0 ? { ...s, hint: 'Le trou du milieu : la porte du balcon' } : s)),
    { planks: [at('edge-x', 7.5, 9, 19.5)], hint: 'La rambarde du balcon, debout sur la tranche' },
    { planks: ceiling.slice(0, 5), hint: 'Le plafond dépasse : c’est l’avancée du toit' },
    { planks: ceiling.slice(5) },
    ...rows.map((planks, j) => ({ planks, ...(j === 0 && { hint: 'Chaque étage du grenier rentre d’un cran' }) })),
    { planks: zs.map((z) => roof(z, 1)), hint: 'Le pied sur le plafond, le dos contre les marches du grenier' },
    { planks: zs.map((z) => roof(z, -1)) },
    { planks: [{ ...at('flat-z', 13.5, 0, 3), y: capY }], hint: 'Le faîtage, à cheval sur les deux pentes' },
    { planks: [16.5, 17.5, 18.5].map((x) => at('up-z', x, 17, -0.4)), hint: 'La cheminée : trois planchettes debout derrière le toit, sur la poutre du fond' },
  ],
};

export default maison;
