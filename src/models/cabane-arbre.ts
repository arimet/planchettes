import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Tree house. The trunk: two rings of standing planks, the lower one wider, roots lying around.
// The branches: floors of planks on edge crossing the floor below, each floor reaching further out
// (the planks on one side pushed one way, on the other side the other way). On top, a deck, a cabin
// of standing planks with a door, a ceiling, and a steep roof leaning on a ridge pile. Two tufts of
// leaves on the ends of the branches. No ladder: rungs can't stay on leaning planks.

const ring = (n: number, r: number, y: number, turn = 0): Plank[] =>
  Array.from({ length: n }, (_, k) => spin(at('up-x', -1.5, y, r - 0.5), turn + (k * 360) / n, 0, 0));
/** Planks on edge every 3 across [-half, half], pushed outward by push along their length. */
function branches(o: 'edge-x' | 'edge-z', half: number, push: number, y: number): Plank[] {
  const n = Math.floor((2 * half - 1) / 3) + 1;
  const first = -(3 * (n - 1) + 1) / 2;
  return Array.from({ length: n }, (_, i) => {
    const across = first + 3 * i;
    const along = -7.5 - Math.sign(across + 0.5) * push;
    return o === 'edge-x' ? at(o, along, y, across) : at(o, across, y, along);
  });
}
const rowsX = (zs: number[], y: number): Plank[] => zs.map((z) => at('flat-x', -7.5, y, z));
const ROWS = [-7.5, -4.5, -1.5, 1.5, 4.5];

const roots = Array.from({ length: 4 }, (_, k) => spin(at('flat-x', 7, 0, -1.5), 60 + k * 72, 0, 0));
const T1 = ring(12, 6.3, 0);
const T2 = ring(10, 5.25, 16, 18);
const F2 = rowsX([-6, -3, 0, 3], 31);
// [orientation, half width across, push]
const LEVELS: ['edge-x' | 'edge-z', number, number][] = [['edge-z', 7.5, 3], ['edge-x', 10.5, 4.5], ['edge-z', 10.5, 6]];
const B = LEVELS.map(([o, h, p], k) => branches(o, h, p, 32 + 3 * k));
const TOPB = 32 + 3 * LEVELS.length;
// the last branches lie flat, side by side, still pushed outward
const FLAT = Array.from({ length: 9 }, (_, i) => -13.5 + 3 * i).map((z) => at('flat-x', -7.5 - Math.sign(z + 1.5) * 6, TOPB, z));
const DECK_Y = TOPB + 1;
const Y = DECK_Y + 1; // cabin floor
// cabin 12 × 12, door in front
const front = [-6, 0, 3].map((x) => at('up-x', x, Y, 5));
const back = [-6, -3, 0, 3].map((x) => at('up-x', x, Y, -6));
const sides = [-6, 5].flatMap((x) => [-4.5, -1.5, 1.5].map((z) => at('up-z', x, Y, z)));
const CEIL = Y + 15;
const CROWS = [-6, -3, 0, 3];
// roof: planks with their foot on the ceiling, leaning on the top corners of a pile in the middle
const PILE = 11;
const FOOT = -6;
const A = Math.atan2(PILE, -1.5 - FOOT);
const pile = Array.from({ length: PILE }, (_, j) => at('flat-z', -1.5, CEIL + 1 + j, -7.5));
const roof = (z: number, side: 1 | -1): Plank => ({
  x: side * (FOOT + 7.5 * Math.cos(A) - 0.5 * Math.sin(A)),
  y: CEIL + 1 + 7.5 * Math.sin(A) + 0.5 * Math.cos(A) + 0.02,
  z: z + 1.5,
  o: 'flat-x',
  tilt: (side * A * 180) / Math.PI,
});

// two tufts of leaves on the ends of the branches: planks crossing, each turned a bit more
const tuft = (c: number): Plank[] => [90, 0, 120, 150].map((d, k) => spin(at('flat-x', c - 7.5, DECK_Y + k, -c - 1.5), d, c, -c));

const steps: Step[] = [
  { planks: roots, hint: 'Les racines' },
  { planks: T1.slice(0, 6), hint: 'Le tronc : debout, en cercle' }, { planks: T1.slice(6) },
  { planks: rowsX(ROWS, 15) },
  { planks: T2.slice(0, 5), hint: 'Un cercle un peu plus petit' }, { planks: T2.slice(5) },
  { planks: F2 },
  ...B.map((planks, k) => ({ planks, ...(k === 0 && { hint: 'Les branches : sur la tranche, un peu poussées vers l’extérieur' }), ...(k === 1 && { hint: 'Chaque étage dépasse un peu plus' }) })),
  { planks: FLAT.slice(0, 5) }, { planks: FLAT.slice(5) },
  { planks: ROWS.map((x) => at('flat-z', x, DECK_Y, -7.5)), hint: 'Le plancher de la cabane' },
  { planks: tuft(9.5), hint: 'Des feuilles au bout des branches' },
  { planks: tuft(-9.5) },
  { planks: [...back, ...sides.slice(0, 3)], hint: 'Les murs : debout, collés' },
  { planks: [...sides.slice(3), ...front], hint: 'Laisse un trou devant : la porte' },
  { planks: rowsX(CROWS, CEIL), hint: 'Le plafond dépasse sur les côtés' },
  { planks: pile.slice(0, 4), hint: 'Une pile au milieu pour tenir le toit' }, { planks: pile.slice(4, 8) }, { planks: pile.slice(8) },
  { planks: CROWS.map((z) => roof(z, 1)), hint: 'Le toit : le pied sur le plafond, le haut contre la pile' },
  { planks: CROWS.map((z) => roof(z, -1)) },
];

export const cabaneArbre: Model = { id: 'cabane-arbre', name: 'Cabane dans l’arbre', theme: 'maisons', difficulty: 3, steps };
export default cabaneArbre;
