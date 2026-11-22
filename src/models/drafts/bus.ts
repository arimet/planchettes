import { at, type Plank } from '../../geometry';
import type { Model, Step } from '../../model';

// A city bus seen from the side (+z), front toward +x. Two wheels are drums of planks lying across
// (the locomotive's). Beams centered on each wheel, then the body: two side walls of planks end to
// end (the middle one bridges the wheels), a grille of planks across at the front, a band of windows
// (pillars of planks across, the gaps are the windows), and a flat roof over the open windscreen.
/** A wheel, bottom up: rows of 2 or 3 planks lying across, 9 wide and 7 high; the gaps in the 2-plank rows draw the hub. */
const two = (c: number) => [c - 3.75, c + 0.75];
const three = (c: number) => [c - 4.5, c - 1.5, c + 1.5];
const wheel = (c: number): Plank[][] => [two, three, three, two, three, three, two].map((f, y) => f(c).map((x) => at('flat-z', x, y, 0)));

const H = 7; // top of the wheels
const WHEELS = [11, 35];
const SIDES = [0, 12]; // z of the two side walls
const side = (x: number, y: number): Plank[] => SIDES.map((z) => at('flat-x', x, y, z));
const across = (x: number, y: number): Plank => at('flat-z', x, y, 0);

// beams centered on the wheels, then the body bottom: three planks end to end, the middle one bridging
const beams = WHEELS.flatMap((c) => side(c - 7.5, H));
const BODY = [0, 15.5, 31]; // x of the 3 planks of a side wall, the bus is 46 long
/** One layer of the lower body; with a grille, the front third is 4 planks across instead. */
const wall = (y: number, grille = false) =>
  grille ? [...BODY.slice(0, 2).flatMap((x) => side(x, y)), ...[31, 35, 39, 43].map((x) => across(x, y))] : BODY.flatMap((x) => side(x, y));
// window band: pillars of planks across, 6 high, the gaps are the windows; the front stays open:
// the windscreen
const PILLARS = [0, 7.5, 15, 22.5, 30, 37];
const BAND = H + 5;
const band = (i: number) => PILLARS.map((x) => across(x, BAND + i));
const roof = BODY.flatMap((x) => [0, 3, 6, 9, 12].map((z) => at('flat-x', x, BAND + 6, z)));

const steps: Step[] = [
  ...WHEELS.flatMap((c, w) =>
    [wheel(c).slice(0, 3), wheel(c).slice(3, 6), wheel(c).slice(6)].map((rows, i) => ({
      planks: rows.flat(),
      ...(w === 0 && i === 0 && { hint: 'Une roue : des planchettes couchées en travers' }),
      ...(w === 0 && i === 1 && { hint: 'Laisse un petit trou au milieu : le moyeu' }),
    })),
  ),
  { planks: beams, hint: 'Une poutre de chaque côté, bien au milieu de chaque roue' },
  { planks: wall(H + 1), hint: 'Le bas du bus : celle du milieu fait le pont entre les roues' },
  { planks: wall(H + 2, true), hint: 'Devant, des planchettes en travers : la calandre' },
  { planks: wall(H + 3, true) },
  { planks: wall(H + 4, true) },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ planks: band(i), ...(i === 0 && { hint: 'Les montants des fenêtres : laisse un trou entre deux' }) })),
  { planks: roof.slice(0, 5), hint: 'Le toit, en long' },
  { planks: roof.slice(5, 10) },
  { planks: roof.slice(10), hint: 'Devant, pas de montant : le pare-brise' },
];

export const bus: Model = { id: 'bus', name: 'Bus', theme: 'vehicules', difficulty: 2, steps };
export default bus;
