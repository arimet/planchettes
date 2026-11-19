import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Castle front: two square log-cabin towers and a wall with a gate tunnel between them (front = +z).
// Merlons: planks standing on an inner floor, hidden behind the walls, that rise 3 above them.
const FLOOR = 20; // tower floor layer (even: it lies like the front and back planks)
const TOWER = FLOOR + 13; // 12 layers above the floor: 3 less than a standing plank
const GATE = 9; // gate jambs, then the wall floor
const WALL = GATE + 13;
const G = 0.3; // the wall planks keep clear of the towers
const L = 0, M = 15 + G, R = 30 + 2 * G; // x of the left tower, the wall, the right tower
const E = 0.6; // merlons keep clear of the walls around them

const floor = (x: number, y: number, zs: number[]): Plank[] => zs.map((z) => at('flat-x', x, y, z));

/** One log-cabin layer of a 15 × 15 tower at x; its floor is a full layer. */
const towerLayer = (x: number, y: number): Plank[] =>
  y === FLOOR ? floor(x, y, [12, 0, 6, 3, 9])
  : y % 2 === 0 ? floor(x, y, [12, 0])
  : [at('flat-z', x, y, 0), at('flat-z', x + 12, y, 0)];

/** Tower merlons on the floor: two along the front, two along the back, one on each side. */
const towerMerlons = (x: number): Plank[] => [
  at('up-x', x + 3 + E, FLOOR + 1, 11 - E), at('up-x', x + 9 - E, FLOOR + 1, 11 - E),
  at('up-x', x + 3 + E, FLOOR + 1, 3 + E), at('up-x', x + 9 - E, FLOOR + 1, 3 + E),
  at('up-z', x + 3 + E, FLOOR + 1, 6), at('up-z', x + 11 - E, FLOOR + 1, 6),
];

/** Wall: gate jambs across the whole depth, a floor on them, then the front face. */
const wallLayer = (y: number): Plank[] =>
  y < GATE ? [at('flat-z', M, y, 0), at('flat-z', M + 12, y, 0)]
  : y === GATE ? floor(M, y, [12, 9])
  : y < WALL ? floor(M, y, [12])
  : [];
const wallMerlons = [M + E, M + 6, M + 12 - E].map((x) => at('up-x', x, GATE + 1, 11 - E));

const steps: Step[] = [];
for (let y = 0; y < TOWER; y++) {
  const left = towerLayer(L, y), right = towerLayer(R, y), wall = wallLayer(y);
  if (y === FLOOR) {
    steps.push({ planks: [...left, ...wall], hint: 'Un plancher plein dans chaque tour' }, { planks: right });
    steps.push({ planks: towerMerlons(L), hint: 'Les créneaux, debout sur le plancher' }, { planks: towerMerlons(R) });
    continue;
  }
  const hint =
    y === 0 ? 'Les deux tours, et les montants de la porte'
    : y === 1 ? 'Chaque étage croise celui du dessous'
    : y === GATE ? 'Le plancher du mur passe au-dessus de la porte'
    : undefined;
  steps.push({ planks: [...left, ...wall, ...right], ...(hint && { hint }) });
  if (y === GATE) steps.push({ planks: wallMerlons, hint: 'Les créneaux du mur, debout derrière la façade' });
}

export const chateau: Model = { id: 'chateau', name: 'Château fort', theme: 'tours', difficulty: 3, steps };
export default chateau;
