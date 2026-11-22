import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A submarine on 4 small cradles, bow toward +x. Each hull floor is a pointed outline: two straight
// sides and, at each end, two planks turned in until they almost meet. The floors widen then narrow
// (a round belly) and the top two are shorter (a round back). A deck with a slot closes the top; the
// tower stands on it, the periscope slides down the slot onto a hidden stack. At the stern, fins
// across and a standing propeller blade make a cross.
const W = [5, 5.5, 6, 6.25, 6.25, 6, 5.5, 5]; // outer half width of each hull floor
const S = [30, 30, 30, 30, 30, 30, 15, 15]; // length of its straight sides
const B = 2; // the hull floors start on the cradles

// angle that turns an end plank (3 wide, pivoting on its outer corner) until its inner tip is 0.25 off the middle
const turn = (w: number) => {
  let t = 0;
  while (w - 15 * Math.sin(t) - 3 * Math.cos(t) > 0.25) t += 0.0005;
  return t;
};

function hullFloor(i: number): Plank[] {
  const [y, w] = [B + i, W[i]];
  const t = turn(w);
  const deg = (t * 180) / Math.PI;
  const pivot = S[i] / 2 + 3 * Math.sin(t) + 0.05; // the end plank's inner back corner clears the side's end
  return [1, -1].flatMap((s) => {
    const z0 = s === 1 ? w - 3 : -w;
    return [
      ...(S[i] === 30 ? [-15, 0] : [-7.5]).map((x) => at('flat-x', x, y, z0)),
      spin(at('flat-x', pivot, y, z0), s * deg, pivot, s * w), // bow, turned on its outer back corner
      spin(at('flat-x', -pivot - 15, y, z0), -s * deg, -pivot, s * w), // stern
    ];
  });
}

const cradles = (y: number) => [-23, -7.5, 7.5, 23].map((x) => at('flat-z', x - 1.5, y, -7.5));
const KEEL = 6; // hidden stack under the periscope
const D = B + W.length; // deck height
const SLOT = 2.75; // deck and tower strips stand this far from the middle
const strips = (x: number, y: number) => [-SLOT, SLOT].map((z) => at('flat-x', x, y, z - 1.5));
const TOWER = 6;
const TIP = -30.4; // where the stern ends

const steps: Step[] = [
  { planks: cradles(0), hint: '4 supports en travers' },
  { planks: cradles(1) },
  ...W.flatMap((_, i): Step[] => [
    ...(i < KEEL ? [{ planks: [at('flat-x', 0, B + i, -1.5)], ...(i === 0 && { hint: 'Une pile cachée au milieu, pour le périscope' }) }] : []),
    {
      planks: hullFloor(i),
      ...(i === 0 && { hint: 'Les bouts tournent vers le milieu, en pointe' }),
      ...(i === 1 && { hint: 'Chaque étage un peu plus large' }),
      ...(i === 5 && { hint: 'Puis un peu plus étroit' }),
      ...(i === 6 && { hint: 'Le dos est plus court' }),
    },
  ]),
  { planks: [...strips(-15, D), ...strips(0, D)], hint: 'Le pont, avec une fente au milieu' },
  ...Array.from({ length: TOWER }, (_, i) => ({ planks: strips(0, D + 1 + i), ...(i === 0 && { hint: 'Le kiosque' }) })),
  { planks: [at('up-x', 10, B + KEEL, -0.5)], hint: 'Le périscope glisse dans la fente' },
  { planks: [at('flat-z', 1, D + 1 + TOWER, -7.5)], hint: 'Les ailerons du kiosque' },
  { planks: [at('flat-z', TIP + 1.5, B + 6, -7.5)], hint: 'Les ailerons de la queue' },
  { planks: [at('up-z', TIP - 1.5, 0, -1.5)], hint: 'L’hélice, debout derrière' },
];

export const sousMarin: Model = { id: 'sous-marin', name: 'Sous-marin', theme: 'vehicules', difficulty: 2, steps };
export default sousMarin;
