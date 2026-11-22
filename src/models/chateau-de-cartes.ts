import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A house of cards, 5-4-3-2-1. Each tent is two planks leaning on a post of two standing planks
// (a lone leaning plank would fall before its partner arrives). Flat planks laid across the posts
// make each floor; the tents of the next row stand over the gaps between the tents below.
const S = 15.5; // distance between two tents of a row
const A = 72; // slope of the leaning planks: their top stays 0.4 under the floor
const ROWS = 5;

const t = (A * Math.PI) / 180;
/** Leaning plank on the face of the post centered at c, foot on y; side -1 = left, 1 = right. */
function leg(c: number, y: number, side: 1 | -1): Plank {
  const dx = 1.5 + 0.02 + 7.5 * Math.cos(t) + 0.5 * Math.sin(t);
  return { o: 'flat-x', tilt: -side * A, x: c + side * dx, y: y + 0.01 + 7.5 * Math.sin(t) + 0.5 * Math.cos(t), z: 1.5 };
}
const post = (c: number, y: number): Plank[] => [0.5, 1.5].map((z) => at('up-x', c - 1.5, y, z));
const floor = (a: number, b: number, y: number): Plank => at('flat-x', (a + b) / 2 - 7.5, y, 0);

const steps: Step[] = [];
for (let r = 0; r < ROWS; r++) {
  const n = ROWS - r;
  const y = r * 16;
  const cs = Array.from({ length: n }, (_, i) => r * (S / 2) + i * S);
  cs.forEach((c, i) => {
    const hint = r === 0 && i === 0 ? 'Deux planchettes debout, collées : le poteau' : r === 1 && i === 0 ? 'Le poteau au milieu de la planchette couchée' : undefined;
    steps.push({ planks: post(c, y), ...(hint && { hint }) });
    steps.push({ planks: [leg(c, y, -1), leg(c, y, 1)], ...(r === 0 && i === 0 && { hint: 'Penche une planchette de chaque côté, contre le poteau' }) });
  });
  if (n > 1) steps.push({ planks: cs.slice(1).map((c, i) => floor(cs[i], c, y + 15)), ...(r === 0 && { hint: 'Couche une planchette sur deux poteaux' }) });
}

export const chateauDeCartes: Model = { id: 'chateau-de-cartes', name: 'Château de cartes', theme: 'originaux', difficulty: 3, steps };
export default chateauDeCartes;
