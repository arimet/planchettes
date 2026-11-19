import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A Swiss chalet, gable to the front. Log-cabin walls 30 wide: each front/back log row is two planks
// resting on two inner walls (the door posts), crossed corners stick out. The door and the window
// above it are rows where the two front logs slide apart.
// A ceiling juts out front, a stepped attic of front-to-back planks makes the gable, and 30° roof
// planks stand with their foot on the ceiling and lean on the attic steps.

const WALL = 11; // log layers 0..10, front/back logs on even layers
// rows where the two front logs slide apart, leaving a gap between the posts
const DOOR = [0, 2, 4];
const WINDOW = [8];
const GAP = [...DOOR, ...WINDOW];
const CEIL = WALL; // ceiling layer
const TOP = CEIL + 1; // y of the ceiling top
const ANGLE = 30;
const RIDGE = 7; // attic rows; the last one is the ridge at x 13.5
const TAN = Math.tan((ANGLE * Math.PI) / 180);
const FOOT = 13.5 - RIDGE / TAN; // x where the left roof plank stands on the ceiling

function logRow(y: number): Plank[] {
  const front = GAP.includes(y) ? [-1.5, 16.5] : [0, 15];
  return [at('flat-x', front[0], y, 11), at('flat-x', front[1], y, 11), at('flat-x', 0, y, 1), at('flat-x', 15, y, 1)];
}
// left wall, two door posts, right wall
const crossRow = (y: number): Plank[] => [3, 10.5, 16.5, 24].map((x) => at('flat-z', x, y, 0));

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

const walls: Step[] = Array.from({ length: WALL }, (_, y) =>
  y % 2 === 0
    ? {
        planks: logRow(y),
        ...(y === 0 && { hint: 'Écarte les deux planchettes de devant : voilà la porte' }),
        ...(y === 8 && { hint: 'Pareil pour la fenêtre au-dessus de la porte' }),
      }
    : {
        planks: crossRow(y),
        ...(y === 1 && { hint: 'Croise les murs : les bouts dépassent un peu' }),
      },
);

const ceiling = Array.from({ length: 10 }, (_, i) => at('flat-z', 3 * i, CEIL, 3));
const rows = Array.from({ length: RIDGE }, (_, j) => attic(FOOT + (j + 1) / TAN, TOP + j));
const zs = [3, 6, 9, 12, 15];

export const chalet: Model = {
  id: 'chalet',
  name: 'Chalet',
  theme: 'maisons',
  difficulty: 2,
  steps: [
    ...walls,
    { planks: ceiling.slice(0, 5), hint: 'Le plafond dépasse devant' },
    { planks: ceiling.slice(5) },
    ...rows.map((planks, j) => ({ planks, ...(j === 0 && { hint: 'Chaque étage du grenier rentre d’un cran' }) })),
    { planks: zs.map((z) => roof(z, 1)), hint: 'Le pied sur le plafond, le dos contre les marches du grenier' },
    { planks: zs.map((z) => roof(z, -1)) },
  ],
};

export default chalet;
