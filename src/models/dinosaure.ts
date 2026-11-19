import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A diplodocus facing +x. Four pillar legs and a body of four rows of rails. In the body the two middle
// rows move forward a bit on every floor: they come out in front as the bottom of the neck, held down
// by the floors above. Over the body the neck goes on, one plank per floor, steeper, then straight up,
// and the head looks ahead. The tail is a staircase from the ground up to the back of the body.

/** Standing column 7 × 4: 6 planks around a hole. */
const pillar = (x: number, z: number): Plank[] => [
  at('up-x', x, 0, z), at('up-x', x + 3, 0, z), at('up-z', x + 6, 0, z),
  at('up-x', x + 4, 0, z + 3), at('up-x', x + 1, 0, z + 3), at('up-z', x, 0, z + 1),
];
const BX = 4; // back legs
const FX = 19; // front legs
const legs = [BX, FX].flatMap((x) => [1, 10].map((z) => pillar(x, z)));
const bars = [BX, BX + 4, FX, FX + 4].map((x) => at('flat-z', x, 15, 0));

const NB = 11; // body floors, from y = 16
const HUMP = 2; // top floors where the sides are one plank: the round back
const SIDE = [1.5, 10.5];
const MID = [4.5, 7.5];
const e = (i: number) => Math.max(0, i - 1); // the middle rows move 1 forward per floor
const body = Array.from({ length: NB }, (_, i) => {
  const y = 16 + i;
  const o = i % 2 ? 1.5 : -1.5; // sides zigzag so their joints cross
  const sides = i >= NB - HUMP ? [7.5] : [o, 15 + o];
  return [
    ...SIDE.flatMap((z) => sides.map((x) => at('flat-x', x, y, z))),
    ...MID.flatMap((z) => [0, 15].map((x) => at('flat-x', e(i) + x, y, z))),
  ];
});

const NF = 12; // neck floors over the body: 7 steps of 0.75 forward, then straight up
const nx = (k: number) => e(NB - 1) + 15 + 0.75 * Math.min(k, 7);
const neck = Array.from({ length: NF }, (_, k) => at('flat-x', nx(k), 16 + NB + k, 6));
const back = MID.map((z) => at('flat-x', nx(0) - 15.3, 16 + NB, z)); // holds the middle rows down
const head = at('flat-x', nx(NF - 1) + 5, 16 + NB + NF, 6);

// tail: one row between the back legs, 0.9 further back on each floor down; the top floor ends behind the bars
const tail = Array.from({ length: 15 }, (_, j) => at('flat-x', BX - 15.3 - 0.9 * (14 - j), j, 6));

const steps: Step[] = [
  ...legs.map((planks, k) => ({ planks, ...(k === 0 && { hint: 'Une grosse patte : 6 planchettes debout autour d’un trou' }) })),
  { planks: bars, hint: 'Deux planchettes en travers sur chaque paire' },
  ...[0, 5, 10].map((k) => ({ planks: tail.slice(k, k + 5), ...(k === 0 && { hint: 'La queue : chaque planchette avance un peu' }) })),
  ...body.map((planks, i) => ({
    planks,
    ...(i === 0 && { hint: 'Le ventre : 4 rangées de 2 planchettes' }),
    ...(i === 2 && { hint: 'Les deux du milieu avancent d’un cran à chaque étage : le cou sort devant' }),
    ...(i === NB - HUMP && { hint: 'Sur les côtés, une seule planchette : le dos s’arrondit' }),
  })),
  { planks: back, hint: 'Le haut du dos' },
  ...[0, 4, 8].map((k) => ({
    planks: neck.slice(k, k + 4),
    ...(k === 0 && { hint: 'Le cou continue, une planchette par étage' }),
    ...(k === 8 && { hint: 'Le haut du cou monte tout droit' }),
  })),
  { planks: [head], hint: 'La tête regarde devant' },
];

export const dinosaure: Model = { id: 'dinosaure', name: 'Dinosaure', theme: 'animaux', difficulty: 3, steps };

export default dinosaure;
