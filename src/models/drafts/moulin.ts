import { at, type Plank } from '../../geometry';
import type { Model } from '../../model';

// A windmill. Log-cabin tower (9 wide inside, log ends stick out 3), four sails in an X on the
// front, and a steep cap on a stepped attic. Sails and roof planks are ramps: the foot stands
// on something flat (ground, hub top, top floor) and the back lies on the corner of a plank below it. Each upper sail has the slope of the lower sail of the other side: straight diagonals.

const TOWER = 21; // log layers 0..20; front/back logs on even layers, the last one a full floor
const HUB = 9; // the two side logs of this layer move to the middle and stick out front: the hub
const LEDGE = 19; // two extra logs stick out front, left and right: they hold the upper sails
const Y = HUB + 1; // top of the hub
const HUB_X = [4.5, 7.5];
const LEDGE_X = [-1, 13];
const OUT = 5; // z of planks sticking out front (z 5..20)
const ATTIC = 8; // cap: layers of front-to-back planks, each one a step narrower: the gable
const CAP = TOWER; // first attic layer; the roof feet stand on the last tower layer, a full floor
const ROOF_FOOT = 1;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function logLayer(y: number): Plank[] {
  // the top floor: both roof feet of a pair push on the same plank, outward, and cancel
  if (y === TOWER - 1) return [0, 3, 6, 9, 12].map((z) => at('flat-x', 0, y, z));
  if (y % 2 === 0) return [at('flat-x', 0, y, 3), at('flat-x', 0, y, 11)];
  // the hub barely reaches the back log: a plank lying behind it carries the next back log
  if (y === HUB) return [at('flat-x', 0, y, 2), ...HUB_X.map((x) => at('flat-z', x, y, OUT))];
  return [at('flat-z', 3, y, 0), at('flat-z', 9, y, 0), ...(y === LEDGE ? LEDGE_X.map((x) => at('flat-z', x, y, OUT)) : [])];
}

/** A plank leaning in the x-y plane; (fx, fy) = bottom corner of its foot, a = slope, dir 1 = rising right. */
function ramp(o: 'edge-x' | 'flat-x', fx: number, fy: number, a: number, dir: 1 | -1, z: number): Plank {
  const half = o === 'edge-x' ? 1.5 : 0.5;
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));
  return { x: fx + dir * (7.5 * c - half * s), y: fy + 7.5 * s + half * c + 0.02, z, o, tilt: dir * a };
}

// upper sail: foot on the hub top at UP_FOOT, back on the inner top corner of the ledge
const UP_FOOT = 9.25;
const SAIL = deg(Math.atan2(LEDGE + 1 - Y, UP_FOOT - (LEDGE_X[0] + 3)));
// lower sail: foot on the ground, back on the hub's outer top corner
const LOW_FOOT = HUB_X[0] - Y / Math.tan(rad(SAIL));

// roof: foot on the top floor, back on the outer top corner of the attic's last step (x 4.5..10.5)
const ROOF = deg(Math.atan2(ATTIC, HUB_X[0] - ROOF_FOOT));

/** Symmetric attic layer of front-to-back planks from x = a to 15 - a. */
function attic(a: number, y: number): Plank[] {
  const n = Math.floor((15 - 2 * a) / 3 + 1e-6);
  const xs: number[] = [];
  for (let i = 0; i < Math.floor(n / 2); i++) xs.push(a + 3 * i, 12 - a - 3 * i);
  if (n % 2) xs.push(6);
  return xs.sort((p, q) => p - q).map((x) => at('flat-z', x, y, 0));
}
// steps below the top one sit inside the roof line, so a step pushed out by a clumsy hand does
// not lift the roof planks (the one under the top keeps two planks)
const INSET = (j: number) => (j < ATTIC - 2 ? 0.75 : j < ATTIC - 1 ? 0.3 : 0);
const steps = Array.from({ length: ATTIC }, (_, j) => attic(ROOF_FOOT + (j + 1) / Math.tan(rad(ROOF)) + INSET(j), CAP + j));
const zs = [0, 3, 6, 9, 12];

export const moulin: Model = {
  id: 'moulin',
  name: 'Moulin à vent',
  theme: 'maisons',
  difficulty: 3,
  steps: [
    ...Array.from({ length: TOWER }, (_, y) => ({
      planks: logLayer(y),
      ...(y === 1 && { hint: 'Croise les planchettes : les bouts dépassent' }),
      ...(y === HUB && { hint: 'Le moyeu : deux planchettes au milieu qui dépassent devant' }),
      ...(y === LEDGE && { hint: 'Deux planchettes de plus dépassent devant, sur les côtés' }),
    })),
    ...steps.map((planks, i) => ({ planks, ...(i === 0 && { hint: 'Le chapeau : chaque étage rentre d’un cran' }) })),
    // one on each side at a time, so the attic is pushed from both sides
    ...zs.map((z, i) => ({
      planks: [ramp('flat-x', ROOF_FOOT, CAP, ROOF, 1, z + 1.5), ramp('flat-x', 15 - ROOF_FOOT, CAP, ROOF, -1, z + 1.5)],
      ...(i === 0 && { hint: 'Une à gauche, une à droite : le pied sur le bord, le dos contre le milieu' }),
    })),
    {
      planks: [ramp('edge-x', LOW_FOOT, 0, SAIL, 1, 15.7), ramp('edge-x', 15 - LOW_FOOT, 0, SAIL, -1, 15.7)],
      hint: 'Les ailes du bas, sur la tranche : le pied par terre, le dos sur le moyeu',
    },
    { planks: [ramp('edge-x', UP_FOOT, Y, SAIL, -1, 17)], hint: 'Le pied sur le moyeu, le dos sur la planchette qui dépasse' },
    { planks: [ramp('edge-x', 15 - UP_FOOT, Y, SAIL, 1, 18.3)] },
  ],
};

export default moulin;
