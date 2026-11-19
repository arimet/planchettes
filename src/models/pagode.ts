import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A pagoda of 3 floors, all centered on the origin, each smaller than the one below.
// Floor 0 is a pinwheel tower (18 wide); its roof is two layers of planks laid end to end, each one
// balanced on the tower wall below its middle, so the roof reaches 15 from the center (30 wide).
// Floor 1 is a log-cabin square (15) under a fan of pinwheel rings turned at different angles (25).
// Floor 2 is a 9 log cabin, crossed ends sticking out, under a flat roof doubled by the same roof
// turned 45°: an 8-pointed star (21). A spire on top.

type P = Plank[];

// pinwheel rings, alternately left- and right-handed so the corners interlock
const ringA = (y: number): P => [at('flat-x', -9, y, -9), at('flat-z', 6, y, -9), at('flat-x', -6, y, 6), at('flat-z', -9, y, -6)];
const ringB = (y: number): P => [at('flat-x', -6, y, -9), at('flat-z', -9, y, -9), at('flat-x', -9, y, 6), at('flat-z', 6, y, -6)];

/** Log-cabin square of side s centered on the origin, one layer: front/back logs, or left/right. */
const logs = (s: number, y: number, i: number): P =>
  i % 2 === 0
    ? [at('flat-x', -7.5, y, -s / 2), at('flat-x', -7.5, y, s / 2 - 3)]
    : [at('flat-z', -s / 2, y, -7.5), at('flat-z', s / 2 - 3, y, -7.5)];

const lanes = (o: 'flat-x' | 'flat-z', y: number, from: number, n: number, min: number): P =>
  Array.from({ length: n }, (_, i) => (o === 'flat-x' ? at(o, min, y, from + 3 * i) : at(o, from + 3 * i, y, min)));

const steps: Step[] = [];
const add = (planks: P, hint?: string) => {
  for (let i = 0; i < planks.length; i += 8) steps.push({ planks: planks.slice(i, i + 8), ...(hint && i === 0 && { hint }) });
};

// floor 0: pinwheel tower
const T0 = 8;
for (let y = 0; y < T0; y++)
  add(y % 2 ? ringB(y) : ringA(y), y === 0 ? 'Quatre planchettes en moulinet' : y === 1 ? 'Le moulinet dans l’autre sens : les coins se croisent' : undefined);
// roof 0: planks end to end, each one balanced on the wall under its middle
add(lanes('flat-x', T0, -9, 6, 0), 'Chaque planchette tient en équilibre sur le mur');
add(lanes('flat-x', T0, -9, 6, -15));
// across them, from the lanes above the walls outward, so each balanced plank stays balanced
const R0B = [-9, 6, -12, -6, 3, 9, -15, -3, 0, 12].map((x) => [at('flat-z', x, T0 + 1, 0), at('flat-z', x, T0 + 1, -15)]);
add(R0B.slice(0, 4).flat(), 'Le toit croise : commence au-dessus des murs');
add(R0B.slice(4, 8).flat());
add(R0B.slice(8).flat());

// floor 1: log cabin 15 under a fan roof: pinwheel rings turned 45°, 15° and 75° on a floor
const Y1 = T0 + 2;
const T1 = 7;
for (let i = 0; i < T1; i++) add(logs(15, Y1 + i, i), i === 0 ? 'Un carré croisé, posé au milieu du toit' : undefined);
const S1 = Y1 + T1;
add(lanes('flat-z', S1, -7.5, 5, -7.5), 'Un plancher sur le mur');
const FAN = [45, 15, 75];
FAN.forEach((deg, k) =>
  add(ringA(S1 + 1 + k).map((p) => spin(p, deg, 0, 0)), k === 0 ? 'Le moulinet, tourné en biais' : k === 1 ? 'Chaque moulinet tourne encore : le toit s’arrondit' : undefined),
);

// floor 2: log cabin 9, the log ends stick out under the roof
const Y2 = S1 + 1 + FAN.length;
const T2 = 6;
for (let i = 0; i < T2; i++) add(logs(9, Y2 + i, i), i === 0 ? 'Plus petit : les bouts dépassent' : undefined);
const S2 = Y2 + T2;
add(lanes('flat-x', S2, -7.5, 5, -7.5), 'Le dernier toit');
add([-6, -3, 0, 3, 6].map((d) => spin({ x: 0, y: S2 + 1.5, z: d, o: 'flat-x' }, 45, 0, 0)), 'Le même, tourné en biais : une étoile');

// the spire
add([at('up-x', -1.5, S2 + 2, -1), at('up-x', -1.5, S2 + 2, 0)], 'La flèche : deux planchettes debout');

export const pagode: Model = { id: 'pagode', name: 'Pagode', theme: 'tours', difficulty: 3, steps };
export default pagode;
