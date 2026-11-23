import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Leafy tree. Trunk: a ring of standing planks. Crown: square rings of 4 lying planks, each ring turned
// 45° so every plank bridges two planks of the ring below (brick bond). The rings grow, then shrink:
// a ball of leaves you can see through.

const ring = (n: number, r: number): Plank[] =>
  Array.from({ length: n }, (_, k) => spin(at('up-x', -1.5, 0, r - 0.5), (k * 360) / n, 0, 0));
/** 4 planks around a square, their middle line at distance a from the axis; below a = 9 they slide into a pinwheel. */
const leaves = (a: number, y: number, turn: number): Plank[] =>
  [0, 90, 180, 270].map((k) => spin(at('flat-x', -7.5 + Math.min(0, a - 9), y, a - 1.5), k + turn, 0, 0));

const TOP = 15;
const A = [6, 8, 10, 12, 13.5, 14.5, 15.5, 16, 16, 16, 16, 16, 15.5, 14.5, 13.5, 12, 10.5, 9, 7.5, 6];
const HINTS: Record<number, string> = {
  0: 'Les feuilles : 4 planchettes en moulinet',
  1: 'Tourne d’un demi-quart de tour : chaque bout se pose sur une planchette d’en dessous',
  2: 'Chaque étage est un peu plus grand',
  7: 'Le plus grand : cinq étages pareils',
  12: 'Maintenant chaque étage rentre un peu',
};
const trunk = ring(8, 4.7);
const roots = [0, 1, 2, 3, 4].map((k) => spin(at('flat-x', 5.6, 0, -1.5), 36 + k * 72, 0, 0));
const steps: Step[] = [
  { planks: trunk.slice(0, 4), hint: 'Le tronc : debout, en cercle' },
  { planks: trunk.slice(4) },
  { planks: roots, hint: 'Les racines' },
  { planks: [-4.75, -1.5, 1.75].map((z) => at('flat-x', -7.5, TOP, z)), hint: 'Trois planchettes couchées sur le tronc' },
  { planks: [-7.5, -4.5, -1.5, 1.5, 4.5].map((x) => at('flat-z', x, TOP + 1, -7.5)), hint: 'Cinq dans l’autre sens' },
  ...A.map((a, i) => ({ planks: leaves(a, TOP + 2 + i, i * 45), ...(HINTS[i] && { hint: HINTS[i] }) })),
];
const Y = TOP + 2 + A.length;
steps.push({ planks: [-4.5, 1.5].map((z) => spin(at('flat-x', -7.5, Y, z), (A.length - 1) * 45, 0, 0)), hint: 'On ferme le haut' });
steps.push({ planks: [-4.5, 1.5].map((z) => spin(at('flat-x', -7.5, Y + 1, z), (A.length - 1) * 45 + 90, 0, 0)) });
steps.push({ planks: [spin(at('flat-x', -7.5, Y + 2, -1.5), (A.length - 1) * 45, 0, 0)] });

export const arbre: Model = { id: 'arbre', name: 'Arbre', theme: 'originaux', difficulty: 3, steps };
export default arbre;
