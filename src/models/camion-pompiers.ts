import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Fire engine, cab toward +x. Each axle is a drum of planks lying across (like the tractor's wheels),
// cut flat on top. Side lockers low between the axles, two beams along the top of it all, then the body:
// columns of planks across, like the doors of the equipment lockers. The cab is taller, its top floors only
// a back and a front column so the windows go right through, a light bar on its roof. On the body roof, a
// ladder: rails along, rungs across, rails again, on four rests across the roof, sticking out behind.

/** Rows of planks across for a wheel of radius r centred on x = cx, cut below row `top` (see tracteur.ts). */
function wheel(cx: number, r: number, top: number, flat: number): Plank[][] {
  const rows: Plank[][] = [];
  let prev = 0;
  let growing = true;
  for (let y = 0; y < top; y++) {
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

const AXLES = [7, 17, 42];
const DECK = 7; // the wheels are cut here
const wheels = AXLES.map((cx) => wheel(cx, 4.5, DECK, 3));

const SIDES = [-7, 4]; // lanes along the sides
const lanes = (x: number, y: number, zs = SIDES): Plank[] => zs.map((z) => at('flat-x', x, y, z));
const across = (x: number, y: number): Plank => at('flat-z', x, y, -7.5);
const floors = (n: number, y0: number, f: (y: number) => Plank[]): Plank[][] => Array.from({ length: n }, (_, i) => f(y0 + i));

const lockers = floors(DECK, 0, (y) => lanes(22.5, y));
const bumper = floors(2, 0, (y) => [across(46.5, y)]);
const beams = [4, 19.5, 35].map((x) => lanes(x, DECK));
const BODY = Array.from({ length: 9 }, (_, i) => 4.5 + 3.5 * i); // columns of the body, x
const CAB = [36.5, 40, 43.5, 47]; // columns of the cab, x
const WINDOWS = [36.5, 47]; // around the windows, only the back and front columns
const ROOF = DECK + 4; // top of the body
const CAB_TOP = ROOF + 3; // the cab roof lies here
const rests = [4.5, 9, 16, 25].map((x) => across(x, ROOF));
const RUNGS = Array.from({ length: 8 }, (_, i) => 0.5 + 3.5 * i);

const steps: Step[] = [
  ...Array.from({ length: DECK }, (_, y) => ({
    planks: wheels.flatMap((w) => w[y]),
    ...(y === 0 && { hint: 'Les 3 essieux : des planchettes en travers' }),
    ...(y === 1 && { hint: 'Celles du milieu d’abord' }),
  })),
  ...lockers.map((planks, y) => ({
    planks: [...planks, ...(bumper[y] ?? [])],
    ...(y === 0 && { hint: 'Les coffres du bas et le pare-chocs' }),
  })),
  ...beams.map((planks, i) => ({ planks, ...(i === 0 && { hint: 'Deux longerons sur tout le camion' }) })),
  ...floors(3, DECK + 1, (y) => [...BODY, ...CAB].map((x) => across(x, y))).flatMap((row, k) => [
    {
      planks: row.filter((_, i) => i % 2 === 0),
      ...(k === 0 && { hint: 'Les coffres et la cabine : une planchette sur deux…' }),
    },
    { planks: row.filter((_, i) => i % 2 === 1), ...(k === 0 && { hint: '…puis celles qui manquent' }) },
  ]),
  ...floors(3, ROOF, (y) => WINDOWS.map((x) => across(x, y))).map((planks, i) => ({
    planks,
    ...(i === 0 && { hint: 'Un trou entre les deux : les fenêtres' }),
  })),
  { planks: lanes(35.5, CAB_TOP, [-7.5, -3.5, 0.5, 4.5]), hint: 'Le toit de la cabine' },
  { planks: [at('edge-z', 47, CAB_TOP + 1, -7.5)], hint: 'Le gyrophare, sur la tranche' },
  { planks: rests, hint: 'Les supports de l’échelle' },
  { planks: [-1, 14.5].flatMap((x) => lanes(x, ROOF + 1)), hint: 'L’échelle : deux montants en long' },
  { planks: RUNGS.slice(0, 4).map((x) => across(x, ROOF + 2)), hint: 'Les barreaux en travers' },
  { planks: RUNGS.slice(4).map((x) => across(x, ROOF + 2)) },
  { planks: [-4, 11.5].flatMap((x) => lanes(x, ROOF + 3)), hint: 'Encore deux montants : l’échelle dépasse derrière' },
];

export const camionPompiers: Model = {
  id: 'camion-pompiers',
  name: 'Camion de pompiers',
  theme: 'vehicules',
  difficulty: 3,
  steps,
};
export default camionPompiers;
