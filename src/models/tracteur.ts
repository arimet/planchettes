import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A farm tractor seen from the side (+z), front toward +x. Each axle is a drum of planks lying across:
// row by row their ends draw a round wheel, two rings of thin slits split the tyre from the rim.
// The big rear wheel carries the cab floor (its fender), the small front wheel the engine block.
// The hood bridges the two, the cab is 4 standing posts, a seat and a roof, the exhaust stands on the hood.

/**
 * Rows of planks across for a round wheel of radius r centred on x = cx, cut below row `top`, the
 * bottom row `flat` wide on each side, like a squashed tyre. Below the middle each row sticks out
 * 0.3 to 0.5 past the one under it, its outer plank butted against the next one, which pins down
 * the outer plank of the row below.
 */
const GROW = [0.3, 0.5];

function wheel(cx: number, r: number, top: number, flat: number): Plank[][] {
  const rows: Plank[][] = [];
  let prev = 0;
  let growing = true;
  for (let y = 0; y < top; y++) {
    const dy = y + 0.5 - r;
    const circle = Math.sqrt(Math.max(0, r * r - dy * dy));
    let h: number;
    if (y === 0) h = Math.max(circle, flat);
    else if (growing && prev < r - 0.25) h = Math.min(Math.max(circle, prev + GROW[0]), prev + GROW[1], r + 0.25);
    else h = Math.min(circle, prev - (growing ? 0.5 : 0)), (growing = false); // this row's outer planks pin the widest row
    prev = h;
    const n = Math.max(1, Math.floor((2 * h) / 3 + 0.01));
    // outer pairs butted at both edges, the middle ones butted together: the slack is two slits
    const mid = Array.from({ length: Math.max(0, n - 4) }, (_, i) => cx - 1.5 * (n - 4) + 3 * i);
    const xs = n === 1 ? [cx - 1.5] : n === 2 ? [cx - h, cx + h - 3] : n === 3 ? [cx - h, cx - 1.5, cx + h - 3] : [cx - h, cx - h + 3, ...mid, cx + h - 6, cx + h - 3];
    const row = xs.map((x) => at('flat-z', x, y, 0));
    // middle first, outer planks last: each outer plank lands on a row already pinned from above
    rows.push(row.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx)));
  }
  return rows;
}

const FLOOR = 19; // the rear wheel is cut just below its top
const rear = wheel(0, 10, FLOOR, 6);
const front = wheel(24, 7, 13, 4.5); // cut flat on top to carry the engine

const HOOD = [4.5, 7.5]; // z of the 2 hood strips
const lengthwise = (x: number, y: number, zs: number[]) => zs.map((z) => at('flat-x', x, y, z));

const floor = lengthwise(-7.5, FLOOR, [0, 3, 6, 9, 12]);
const block = Array.from({ length: FLOOR + 1 - front.length }, (_, i) => lengthwise(16, front.length + i, HOOD));
const hood = [3, 4.5, 3].map((x, i) => [lengthwise(x, 20 + i, HOOD), lengthwise(x + 15, 20 + i, HOOD)]);
const posts = [-7.5, 4.5].flatMap((x) => [0, 14].map((z) => at('up-x', x, FLOOR + 1, z)));
const ties = [-7.5, 4.5].map((x) => at('flat-z', x, FLOOR + 16, 0));
const roof = lengthwise(-7.5, FLOOR + 17, [0, 3, 6, 9, 12]);
const seat = [at('flat-z', -4.5, FLOOR + 1, 0), at('flat-z', -4.5, FLOOR + 2, 0)];
const back = at('edge-z', -4.5, FLOOR + 3, 0);
const exhaust = [20, 21].map((x) => at('up-z', x, 23, 6));

const steps: Step[] = [
  ...rear.map((planks, i) => ({
    planks,
    ...(i === 0 && { hint: 'La grande roue : des planchettes couchées en travers' }),
    ...(i === 1 && { hint: 'Celles du milieu d’abord. Chaque rangée dépasse un tout petit peu' }),
    ...(i === 10 && { hint: 'Maintenant chaque rangée rentre un peu' }),
  })),
  ...front.map((planks, i) => ({ planks, ...(i === 0 && { hint: 'La petite roue devant' }) })),
  { planks: floor, hint: 'Le plancher de la cabine, sur la grande roue' },
  ...block.map((planks, i) => ({ planks, ...(i === 0 && { hint: 'Le moteur, sur la petite roue' }) })),
  ...hood.map((row, i) => ({ planks: row.flat(), ...(i === 0 && { hint: 'Le capot relie la cabine au moteur' }) })),
  { planks: posts, hint: 'Les 4 montants de la cabine, debout' },
  { planks: seat, hint: 'Le siège' },
  { planks: [back], hint: 'Le dossier, sur la tranche' },
  { planks: ties, hint: 'Deux planchettes en travers pour les tenir' },
  { planks: roof, hint: 'Le toit' },
  { planks: exhaust, hint: 'Le pot d’échappement : 2 planchettes debout, collées' },
];

export const tracteur: Model = { id: 'tracteur', name: 'Tracteur', theme: 'vehicules', difficulty: 2, steps };

export default tracteur;
