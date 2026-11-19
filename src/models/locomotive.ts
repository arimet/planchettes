import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A steam engine seen from the side (+z), front toward +x. Three wheels are drums of planks lying
// across: their ends draw a round wheel with a hub. A chassis of staggered beams, a round boiler,
// a log-cabin cab with side windows and a roof, a tall chimney standing at the front.
const WHEELS = [6, 21, 36.75]; // wheel centers along x
const DECK = 8; // top of the chassis

const across = (xs: number[], y: number): Plank[] => xs.map((x) => at('flat-z', x, y, 0));
const two = (c: number) => [c - 3.75, c + 0.75]; // 2 planks, a small gap between them
const three = (c: number) => [c - 4.5, c - 1.5, c + 1.5]; // 3 planks side by side

/** A wheel, bottom up: rows of 2 or 3 planks lying across, 9 wide and 7 high, the gap in the middle row is the hub. */
const wheel = (c: number): Plank[][] => [two, three, three, two, three, three, two].map((f, y) => across(f(c), y));

// side beams under the cab and boiler, the middle beam shifted forward to carry the chimney
const chassis = [
  ...[3, 9].flatMap((z) => [-3, 12, 27].map((x) => at('flat-x', x, DECK - 1, z))),
  ...[0, 15, 30].map((x) => at('flat-x', x, DECK - 1, 6)),
];

// boiler: two planks end to end per strip, strips given by their z
const strip = (y: number, zs: number[]): Plank[] => zs.flatMap((z) => [at('flat-x', 12, y, z), at('flat-x', 27, y, z)]);
const boiler = [
  strip(DECK, [3.75, 8.25]),
  ...[1, 2, 3, 4, 5].map((i) => strip(DECK + i, [3, 6, 9])),
  strip(DECK + 6, [3.75, 8.25]),
  strip(DECK + 7, [6]),
];

// cab: a floor across, then log-cabin walls; the side walls stop for 4 floors (the windows)
const floor = across([-3, 0, 3, 6, 9], DECK);
const sides = (y: number) => [at('flat-x', -3, y, 0), at('flat-x', -3, y, 12)];
const ends = (y: number) => [at('flat-z', -3, y, 0), at('flat-z', 9, y, 0)];
const cab = [sides, ends, sides, ends, sides, ends, ends, ends, ends, sides, ends, sides].map((f, i) => f(DECK + 1 + i));
const roof = across([-3, 0, 3, 6, 9], DECK + 13);

const chimney = [6, 7, 8].map((z) => at('up-x', 42, DECK, z));

const steps: Step[] = [
  ...WHEELS.flatMap((c, i) => {
    const w = wheel(c);
    return [
      { planks: w.slice(0, 3).flat(), ...(i === 0 && { hint: 'Une roue : des planchettes couchées en travers' }) },
      { planks: w.slice(3, 6).flat(), ...(i === 0 && { hint: 'Laisse un petit trou au milieu : le moyeu' }) },
      { planks: w[6] },
    ];
  }),
  { planks: chassis.slice(0, 6), hint: 'Le châssis repose sur les 3 roues' },
  { planks: chassis.slice(6), hint: 'Celles du milieu dépassent devant' },
  ...boiler.map((planks, i) => ({ planks, ...(i === 0 && { hint: 'La chaudière, ronde comme un tonneau' }) })),
  { planks: floor, hint: 'Le plancher de la cabine' },
  ...cab.map((planks, i) => ({ planks, ...(i === 0 && { hint: 'Les murs de la cabine se croisent' }), ...(i === 6 && { hint: 'Pas de murs sur les côtés : les fenêtres' }) })),
  { planks: roof, hint: 'Le toit' },
  { planks: chimney, hint: 'La cheminée : 3 planchettes debout, collées' },
];

export const locomotive: Model = { id: 'locomotive', name: 'Locomotive', theme: 'vehicules', difficulty: 2, steps };

export default locomotive;
