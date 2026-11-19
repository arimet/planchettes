import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A two-storey family house, gable to the front, built like the chalet: log rows cross at the corners.
// Each storey: two log rows, then four piers (stacked front-to-back planks) leave a door and two
// windows open, then a lintel row that sticks out. Sill and lintel rows jut out 1 in front.
// The floor between storeys juts out 3 in front, 6 in the middle: a balcony over the door.
// Roof: the chalet's, on a stepped attic, with a ridge cap and a chimney standing behind it.

const PIERS = [3, 10.5, 16.5, 24]; // left wall, door posts, right wall
const ANGLE = 30;
const TAN = Math.tan((ANGLE * Math.PI) / 180);
const RIDGE = 7; // attic rows; the last one is the ridge at x 13.5
const FOOT = 13.5 - RIDGE / TAN; // x where the left roof plank stands on the ceiling
const CEIL = 17;
const TOP = CEIL + 1;

const piers = (y: number): Plank[] => PIERS.map((x) => at('flat-z', x, y, 0));

/** Front and back logs; a gap row slides them apart to open the middle. */
function logs(y: number, gap: boolean, front: number, back: number): Plank[] {
  const xs = gap ? [-1.5, 16.5] : [0, 15];
  return [...xs.map((x) => at('flat-x', x, y, front)), ...xs.map((x) => at('flat-x', x, y, back))];
}

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

/** One storey from layer y: logs, cross row, sill logs, 4 pier rows, lintel logs. */
function storey(y: number, back0: number, lintelBack: number, extra: Plank[] = []): Step[] {
  return [
    { planks: logs(y, true, 11, back0) },
    { planks: piers(y + 1) },
    { planks: logs(y + 2, true, 13, 1), hint: 'Le rebord des fenêtres dépasse un peu devant' },
    ...[3, 4, 5, 6].map((i) => ({ planks: piers(y + i), ...(i === 3 && { hint: 'Empile les 4 piliers : rien devant, ce sont les fenêtres' }) })),
    { planks: [...logs(y + 7, false, 13, lintelBack), ...extra], hint: 'Le linteau ferme le haut des fenêtres et de la porte' },
  ];
}

const floor = Array.from({ length: 10 }, (_, i) => at('flat-z', 3 * i, 8, i >= 3 && i <= 6 ? 6 : 3));
const ceiling = Array.from({ length: 10 }, (_, i) => at('flat-z', 3 * i, CEIL, 3));
const rows = Array.from({ length: RIDGE }, (_, j) => attic(FOOT + (j + 1) / TAN, TOP + j));
const zs = [3, 6, 9, 12, 15];
const capY = TOP + 7.5 * Math.sin((ANGLE * Math.PI) / 180) * 2 + Math.cos((ANGLE * Math.PI) / 180) + 0.55;

export const maison: Model = {
  id: 'maison',
  name: 'Maison',
  theme: 'maisons',
  difficulty: 3,
  steps: [
    ...storey(0, 1, 1, [at('flat-x', 7.5, 7, 6)]).map((s, i) => (i === 0 ? { ...s, hint: 'Écarte les deux planchettes de devant : voilà la porte' } : s)),
    { planks: [at('flat-x', 7.5, 0, 15.5)], hint: 'La marche devant la porte' },
    { planks: floor.slice(0, 5), hint: 'Le plancher dépasse devant' },
    { planks: floor.slice(5) },
    ...storey(9, 3, 3),
    { planks: [at('edge-x', 7.5, 9, 19.5)], hint: 'La rambarde du balcon, debout sur la tranche' },
    { planks: ceiling.slice(0, 5), hint: 'Le plafond dépasse devant' },
    { planks: ceiling.slice(5) },
    ...rows.map((planks, j) => ({ planks, ...(j === 0 && { hint: 'Chaque étage du grenier rentre d’un cran' }) })),
    { planks: zs.map((z) => roof(z, 1)), hint: 'Le pied sur le plafond, le dos contre les marches du grenier' },
    { planks: zs.map((z) => roof(z, -1)) },
    { planks: [{ ...at('flat-z', 13.5, 0, 3), y: capY }], hint: 'Le faîtage, posé à cheval sur les deux pentes' },
    { planks: [at('up-x', 16.5, 16, 0.3), at('up-x', 16.5, 16, 1.3)], hint: 'La cheminée, debout derrière le toit' },
  ],
};

export default maison;
