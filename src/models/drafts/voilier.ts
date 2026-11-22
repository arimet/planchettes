import { at, spin, type Plank } from '../../geometry';
import type { Model, Step } from '../../model';

// A sailing yacht, bow toward +x. Each hull floor is a transom, two long sides and two bow planks
// turned in until they almost meet; every floor flares out a little. A deck across, then the sails:
// standing planks in steps that shrink upward make the triangle of the mainsail behind the mast
// (swung out a little), tied by a lying plank and a crossbar on the mast. The jib is three planks on
// the deck and two lower ones standing on the floor inside the open bow: it steps down toward the bow.
const LAYERS = 5;
const L = 45; // length of the straight sides
const W = (i: number) => 5 + 0.5 * i; // outer half width of floor i

// angle that turns a bow plank (3 wide, pivoting on its outer corner) until its inner tip is 0.25 off the middle
const turn = (w: number) => {
  let t = 0;
  while (w - 15 * Math.sin(t) - 3 * Math.cos(t) > 0.25) t += 0.0005;
  return t;
};

function hullFloor(i: number): Plank[][] {
  const w = W(i);
  const t = turn(w);
  const deg = (t * 180) / Math.PI;
  const pivot = 3 + L + 3 * Math.sin(t) + 0.05; // the bow plank's inner back corner clears the side's end
  const sides = [1, -1].flatMap((s) => [0, 15, 30].map((x) => at('flat-x', 3 + x, i, s === 1 ? w - 3 : -w)));
  const bow = [1, -1].map((s) => spin(at('flat-x', pivot, i, s === 1 ? w - 3 : -w), s * deg, pivot, s * w));
  return [[at('flat-z', 0, i, -7.5), ...sides], bow];
}

const D = LAYERS + 1; // top of the deck
const deck = Array.from({ length: 16 }, (_, k) => at('flat-z', 3 * k, LAYERS, -7.5));
const M = 33; // front face of the mast
const mast = (y: number, x = M - 1) => at('up-z', x, y, -1.5); // thin along the boat, wide across: it holds the crossbar
const col = (x: number, y: number) => at('up-x', x, y, -0.5); // a standing plank in the plane of the sails
const cols = (n: number, x: number, y: number) => Array.from({ length: n }, (_, k) => col(x - 3 * k, y));
// the mainsail swings out to one side, turned around the back of the mast
const swing = (ps: Plank[]) => ps.map((p) => spin(p, 25, M - 1, 0));

const steps: Step[] = [
  ...Array.from({ length: LAYERS }, (_, i) => {
    const [back, bow] = hullFloor(i);
    return [
      { planks: back, ...(i === 0 && { hint: 'L’arrière et les deux longs côtés' }), ...(i === 1 && { hint: 'Chaque étage dépasse un peu vers l’extérieur' }) },
      { planks: bow, ...(i === 0 && { hint: 'L’avant se referme en pointe' }) },
    ];
  }).flat(),
  { planks: deck.slice(0, 8), hint: 'Le pont, en travers' },
  { planks: deck.slice(8) },
  { planks: [mast(D)], hint: 'Le mât, debout au milieu' },
  { planks: swing(cols(4, M - 4.5, D)), hint: 'La grande voile derrière, un peu tournée' },
  { planks: swing([at('flat-x', M - 14.5, D + 15, -1.5)]), hint: 'Une planchette couchée pour les tenir' },
  { planks: [mast(D + 16), ...swing(cols(2, M - 4.5, D + 16))], hint: 'La voile rétrécit en montant' },
  { planks: [at('flat-z', M - 3, D + 31, -7.5)], hint: 'Une barre en travers du mât' },
  { planks: [mast(D + 32, M - 2)], hint: 'Le haut du mât, au milieu de la barre' },
  { planks: [M + 1.5, M + 5, M + 8.5].map((x) => col(x, D)), hint: 'Le foc, devant le mât' },
  { planks: [col(49, 0), col(52.5, 0)], hint: 'Deux planchettes debout dans la pointe' },
];

export const voilier: Model = { id: 'voilier', name: 'Voilier', theme: 'vehicules', difficulty: 2, steps };
export default voilier;
