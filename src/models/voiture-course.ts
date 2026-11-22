import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A low race car, nose toward +x. Each axle is a drum of planks lying across (like the tractor's
// wheels): its ends are the two wheels, the narrow body crosses over its middle. Between the axles,
// the body with a slot for the driver and two side pods. The nose is two planks leaning from the front
// wheels down onto the front wing; behind, the engine cover lies on the rear wheels and carries the
// rear wing on two posts.

/** Rows of planks across for a round wheel of radius r centred on x = cx (see tracteur.ts). */
function wheel(cx: number, r: number, flat: number): Plank[][] {
  const rows: Plank[][] = [];
  let prev = 0;
  let growing = true;
  for (let y = 0; y < 2 * r; y++) {
    const dy = y + 0.5 - r;
    const circle = Math.sqrt(Math.max(0, r * r - dy * dy));
    let h: number;
    if (y === 0) h = Math.max(circle, flat);
    else if (growing && prev < r - 0.25) h = Math.min(Math.max(circle, prev + 0.3), prev + 0.5, r + 0.25);
    else ((h = Math.min(circle, prev - (growing ? 0.5 : 0))), (growing = false));
    prev = h;
    const n = Math.max(1, Math.floor((2 * h) / 3 + 0.01));
    const mid = Array.from({ length: Math.max(0, n - 4) }, (_, i) => cx - 1.5 * (n - 4) + 3 * i);
    const xs =
      n === 1
        ? [cx - 1.5]
        : n === 2
          ? [cx - h, cx + h - 3]
          : n === 3
            ? [cx - h, cx - 1.5, cx + h - 3]
            : [cx - h, cx - h + 3, ...mid, cx + h - 6, cx + h - 3];
    rows.push(xs.map((x) => at('flat-z', x, y, -7.5)).sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx)));
  }
  return rows;
}

const REAR = 0; // rear axle
const FRONT = 30; // front axle
const rear = wheel(REAR, 4.5, 3);
const front = wheel(FRONT, 4, 3);

const L2 = [-3.25, 0.25]; // the two lanes of the body
const lanes = (x: number, y: number, zs = L2): Plank[] => zs.map((z) => at('flat-x', x, y, z));
const across = (x: number, y: number): Plank => at('flat-z', x, y, -7.5);
// body floors between the axles, joints staggered
const tub = [5, 10.5, 5, 10.5, 5, 10.5].map((x, y) => lanes(x, y));
const cockpit = [lanes(5, 6, [-4, 1]), lanes(10.5, 7, [-4, 1])]; // a slot in the middle for the driver
const pods = [0, 1, 2].map((y) => lanes(7.5 + (y % 2), y, [-7.25, 4.25]));

/** Nose plank leaning from the top front edge of the front wheels (ex, ey) down to the wing top at y0. */
function nose(ex: number, ey: number, y0: number, z: number): Plank {
  const s = 14.5; // from the foot to the edge, along the underside
  const t = Math.asin((ey - y0) / s);
  const fx = ex + s * Math.cos(t); // foot
  return {
    x: fx - 7.5 * Math.cos(t) + 0.5 * Math.sin(t),
    y: y0 + 7.5 * Math.sin(t) + 0.5 * Math.cos(t) + 0.02,
    z: z + 1.5,
    o: 'flat-x',
    tilt: (-t * 180) / Math.PI,
  };
}
const top = front.length; // top of the front wheels
const WING = [44, 3]; // front wing: x, floors

const steps: Step[] = [
  ...rear.map((planks, i) => ({
    planks,
    ...(i === 0 && { hint: 'Les roues arrière : des planchettes en travers' }),
  })),
  ...front.map((planks, i) => ({
    planks,
    ...(i === 0 && { hint: 'Les roues avant, plus petites' }),
  })),
  ...tub.map((planks, y) => ({
    planks: [...planks, ...(pods[y] ?? [])],
    ...(y === 0 && { hint: 'Le corps au milieu, les flancs dehors' }),
  })),
  ...cockpit.map((planks, i) => ({
    planks,
    ...(i === 0 && { hint: 'Un trou au milieu pour le pilote' }),
  })),
  { planks: lanes(2, 8, [-4, 1]), hint: 'Derrière le pilote' },
  { planks: lanes(17.5, 8), hint: 'Le capot avant, sur les roues' },
  { planks: lanes(-4, 9), hint: 'Le capot arrière, sur les grandes roues' },
  {
    planks: [0, 1, 2].map((y) => across(WING[0], y)),
    hint: 'L’aileron avant, trois planchettes',
  },
  {
    planks: L2.map((z) => nose(32.5, top + 1, WING[1], z)),
    hint: 'Le nez : penche-les du capot jusqu’à l’aileron',
  },
  {
    planks: [-2.5, 1.5].map((z) => at('edge-x', -7, 10, z)),
    hint: 'Deux montants sur la tranche',
  },
  { planks: [across(-7, 13)], hint: 'L’aileron arrière' },
  {
    planks: [at('edge-z', -5.5, 14, -7.5)],
    hint: 'Une sur la tranche par-dessus',
  },
];

export const voitureCourse: Model = {
  id: 'voiture-course',
  name: 'Voiture de course',
  theme: 'vehicules',
  difficulty: 2,
  steps,
};
export default voitureCourse;
