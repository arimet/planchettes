import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Spider standing on its legs. The body is a small log cabin (2 planks a floor) raised on a narrow
// foot, with a rounded back. Eight legs: a flat plank (the thigh) sticks out of each corner of the
// cabin, held by the floor above; a tilted plank (the shin) rests on its tip, foot on the ground.
// The cabin turns by 30° between the two sets of thighs, which gives four legs on each side.
const D = Math.PI / 180;

/** One floor of a 15 × 15 log cabin turned by yaw: 2 planks along x, or along z when odd. */
const floor = (y: number, yaw: number, odd: boolean): Plank[] =>
  (odd ? [at('flat-z', -7.5, y, -7.5), at('flat-z', 4.5, y, -7.5)] : [at('flat-x', -7.5, y, -7.5), at('flat-x', -7.5, y, 4.5)])
    .map((p) => spin(p, yaw, 0, 0));

const IN = 2; // inner end of a thigh, from the center
/** Thigh pointing at dir (deg), out of a cabin corner. */
const thigh = (dir: number, y: number): Plank => spin(at('flat-x', IN, y, -1.5), dir, 0, 0);

/** Shin rising toward the center at t (deg), its underside on the thigh's tip edge at height h, foot on the ground. */
function shin(dir: number, h: number, t: number): Plank {
  const a = t * D;
  const s0 = (h + 0.02) / Math.sin(a); // from the foot to the tip edge, along the underside
  const x = IN + 15 - (7.5 - s0) * Math.cos(a) + 0.5 * Math.sin(a);
  const y = h + 0.02 + (7.5 - s0) * Math.sin(a) + 0.5 * Math.cos(a);
  return spin({ x, y, z: 0, o: 'flat-x', tilt: -t }, dir, 0, 0);
}

const F = 2; // the cabin starts here, on a narrow foot
const TURN = 15; // the cabin turns by -15°, then by 15°
const A = [30, 120, 210, 300]; // corners of the cabin turned by -15°
const B = [60, 150, 240, 330]; // corners of the cabin turned by 15°
const LOW = F + 2;
const HIGH = LOW + 4;
const TOP = HIGH + 3;

/** Narrow foot under the body: two planks side by side, 9 wide. */
const foot = (y: number) => [-4.5, 1.5].map((c) => spin(y % 2 ? at('flat-x', -7.5, y, c) : at('flat-z', c, y, -7.5), -TURN, 0, 0));
/** Rounded back: planks across, one fewer each floor. */
const back = (rows: number[]): Step[] =>
  rows.map((n, i) => ({
    planks: Array.from({ length: n }, (_, k) => at('flat-z', 3 * k - 1.5 * n, TOP + i, -7.5)),
    ...(i === 0 && { hint: 'Le dos : chaque étage a une planchette de moins' }),
  }));

const steps: Step[] = [
  { planks: foot(0), hint: 'Le pied du corps : deux planchettes' },
  { planks: foot(1), hint: 'Deux en travers' },
  { planks: floor(F, -TURN, true), hint: 'Deux planchettes, bien écartées' },
  { planks: floor(F + 1, -TURN, false), hint: 'Puis deux dans l’autre sens : un carré' },
  { planks: A.map((d) => thigh(d, LOW)), hint: 'Les cuisses : une sur chaque coin, qui dépasse dehors' },
  { planks: floor(LOW + 1, -TURN, true), hint: 'Deux planchettes les tiennent' },
  { planks: floor(LOW + 2, 0, false), hint: 'Le carré tourne d’un cran à chaque étage' },
  { planks: floor(LOW + 3, TURN, true) },
  { planks: B.map((d) => thigh(d, HIGH)), hint: 'Quatre autres cuisses, sur les nouveaux coins' },
  { planks: floor(HIGH + 1, TURN, true) },
  { planks: floor(HIGH + 2, TURN, false) },
  ...back([5, 4, 3, 2]),
  { planks: A.map((d) => shin(d, LOW + 1, 30)), hint: 'Les pattes : penche une planchette sur le bout de chaque cuisse' },
  { planks: B.map((d) => shin(d, HIGH + 1, 40)) },
];

const FACE = -55; // turn the whole spider so it looks at the camera of the 3/4 view
export const araignee: Model = {
  id: 'araignee',
  name: 'Araignée',
  theme: 'animaux',
  difficulty: 2,
  steps: steps.map((s) => ({ ...s, planks: s.planks.map((p) => spin(p, FACE, 0, 0)) })),
};

export default araignee;
