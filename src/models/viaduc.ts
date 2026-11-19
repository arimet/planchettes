import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A viaduct of 3 corbelled arches on 4 tall piers. A pier storey is planks standing on end, two rows
// deep, with a front wall of more standing planks; two storeys with a floor between them. On top, a
// "V" head: two staircases stepping outward, so neighbouring heads reach for each other and draw the
// arches. A flat road (two rows wide, for toy cars) closes the top.

const PIERS = [0, 45, 90, 135]; // pier centers: 3 road tiles of 15 per span, one of them over the keystone
const ROWS = [0, 3];
const STEP = [0, 1, 2.5, 4.5]; // outward shift of each head floor
const BLADES = [-11.5, 10.5]; // min x of the outer blades, relative to the pier center
const FILL = [-10.5, -7.5, -4.5, 1.5, 4.5, 7.5]; // the front wall between them
const HEAD_Y = 31;
const ROAD_Y = HEAD_Y + STEP.length;

// outer blades, plus a wide plank in the middle of each row under the joint of the floor above
const blades = (c: number, y: number): Plank[] => [
  ...BLADES.flatMap((dx) => ROWS.map((z) => at('up-z', c + dx, y, z))),
  ...ROWS.map((z) => at('up-x', c - 1.5, y, z + 1)),
];
const fill = (c: number, y: number): Plank[] => FILL.map((dx) => at('up-x', c + dx, y, 1));
const pair = (c: number, y: number, shift = 0): Plank[] =>
  ROWS.flatMap((z) => [at('flat-x', c - 15 - shift, y, z), at('flat-x', c + shift, y, z)]);

const road = Array.from({ length: 11 }, (_, k) => -15 + 15 * k);

const storey = (c: number, y: number, first: boolean): Step[] => [
  { planks: blades(c, y), ...(first && { hint: 'Debout : une sur chaque bord, une de face au milieu' }) },
  { planks: fill(c, y), ...(first && { hint: 'Remplis le devant : le pilier devient un mur' }) },
];

const steps: Step[] = [
  ...PIERS.flatMap((c, p) => [
    ...storey(c, 0, p === 0),
    { planks: pair(c, 15), ...(p === 0 && { hint: 'Un plancher : elles se touchent au-dessus du milieu' }) },
    ...storey(c, 16, false),
  ]),
  ...PIERS.flatMap((c, p) =>
    STEP.map((s, i) => ({
      planks: pair(c, HEAD_Y + i, s),
      ...(p === 0 && i === 1 && { hint: 'Chaque étage s’écarte d’un cran vers les arches' }),
    })),
  ),
  ...[0, 4, 8].map((k, j) => ({
    planks: road.slice(k, k + 4).flatMap((x) => ROWS.map((z) => at('flat-x', x, ROAD_Y, z))),
    ...(j === 0 && { hint: 'La route : les voitures peuvent rouler dessus' }),
  })),
];

export const viaduc: Model = { id: 'viaduc', name: 'Viaduc', theme: 'ponts', difficulty: 2, steps };
export default viaduc;
