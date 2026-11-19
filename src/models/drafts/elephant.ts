import { at, type Plank } from '../../geometry';
import type { Model, Step } from '../../model';

// Elephant facing +x. Four thick legs of standing planks, a body of two log squares with a rounded
// back, a head of stacked crossbars resting on the trunk (which reaches the ground), tusks sticking
// out under the face, and big ears: the body's front crossbars stick out of its sides, one each way.

/** Standing column 7 × 4: 6 planks. */
const thick = (x: number, z: number, y: number): Plank[] => [
  at('up-x', x, y, z), at('up-x', x + 3, y, z), at('up-z', x + 6, y, z),
  at('up-x', x + 4, y, z + 3), at('up-x', x + 1, y, z + 3), at('up-z', x, y, z + 1),
];

const BACK = 1; // back legs x
const FRONT = 17; // front legs x
const legs = [BACK, FRONT].flatMap((x) => [0, 11].flatMap((z) => thick(x, z, 0)));
const bars = [BACK, FRONT].flatMap((x) => [at('flat-z', x + 0.5, 15, 0), at('flat-z', x + 3.5, 15, 0)]);

// trunk: 3 standing planks, a crossbar on top for the chin
const trunk = [6, 7, 8].map((z) => at('up-x', 34, 0, z));
const chin = at('flat-z', 34, 15, 0);

const FLOORS = 12; // from y = 16: along x on even floors, across on odd ones
/** The head is columns of crossbars on the jaw; the body is two log squares behind it. */
const floor = (i: number): Plank[] => {
  const y = 16 + i;
  const head = i === 0
    ? [at('flat-x', 22, y, 6), at('flat-x', 28, y, 3), at('flat-x', 28, y, 9)] // jaw, then the tusks
    : [28, 31, 34].map((x) => at('flat-z', x, y, 0));
  if (i % 2 === 0) return [...[0, 12].flatMap((z) => [at('flat-x', -2, y, z), at('flat-x', 13, y, z)]), ...head];
  // the front wall is two crossbars, each sticking out on one side: the ears
  const walls = [at('flat-z', -2, y, 0), at('flat-z', 10, y, 0), at('flat-z', 13, y, 0), at('flat-z', 22, y, 6), at('flat-z', 25, y, -6)];
  return [...walls, ...head];
};
const floors = Array.from({ length: FLOORS }, (_, i) => floor(i));
const tail = at('flat-x', -8, 16 + 4, 6);
const TOP = 16 + FLOORS;
const roof = [
  ...[0, 3, 6, 9, 12].flatMap((z) => [at('flat-x', -2, TOP, z), at('flat-x', 13, TOP, z)]),
  ...[1.5, 4.5, 7.5, 10.5].map((z) => at('flat-x', 3, TOP + 1, z)),
  ...[3, 6, 9].map((z) => at('flat-x', 4, TOP + 2, z)),
  ...[4.5, 7.5].map((z) => at('flat-x', 5, TOP + 3, z)),
];
const forehead = [28, 31, 34].map((x) => at('flat-z', x, TOP, 0));

const steps: Step[] = [
  { planks: legs.slice(0, 6), hint: 'Une grosse patte : 6 planchettes debout autour d’un trou' },
  { planks: legs.slice(6, 12) },
  { planks: legs.slice(12, 18) },
  { planks: legs.slice(18) },
  { planks: bars, hint: 'Deux planchettes en travers sur chaque paire de pattes' },
  { planks: trunk, hint: 'La trompe : 3 planchettes debout, collées' },
  { planks: [chin], hint: 'Le menton, en travers sur la trompe' },
  ...floors.map((planks, i) => ({
    planks: [...planks, ...(i === 4 ? [tail] : [])],
    ...(i === 0 && { hint: 'Le corps dans la longueur ; la mâchoire sur le menton, les défenses dépassent' }),
    ...(i === 1 && { hint: 'Puis en travers ; devant, une planchette dépasse de chaque côté : les oreilles' }),
    ...(i === 2 && { hint: 'Et ainsi de suite, un étage sur deux' }),
    ...(i === 4 && { hint: 'La queue dépasse derrière' }),
  })),
  { planks: roof.slice(0, 5), hint: 'Le dos s’arrondit' },
  { planks: roof.slice(5, 10) },
  { planks: roof.slice(10, 14) },
  { planks: roof.slice(14) },
  { planks: forehead, hint: 'Le front de l’éléphant' },
];

export const elephant: Model = { id: 'elephant', name: 'Éléphant', theme: 'animaux', difficulty: 2, steps };

export default elephant;
