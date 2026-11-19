import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// An airliner resting on its belly, nose toward +x. The fuselage is 3 strips of planks end to end,
// each floor one notch further back: the nose slopes like a windscreen, the tail sweeps up.
// The wing floor crosses the fuselage; its outer planks, swept back, rest on the two engines lying
// under the wing. On the tail, two planks across make the small wings, and the fin climbs backwards.
const SHEAR = 1; // each floor of the fuselage moves back this much
const NOSE = 1.5; // the middle strip runs further forward: a pointed nose
const WIDE = [-4.5, -1.5, 1.5]; // z of the 3 fuselage strips
const TOP = 7; // the top floor has only 2 strips, to round the back
const WING = 3; // floor of the wing

const start = (y: number) => 6 - SHEAR * y; // tail end of fuselage floor y
const floor = (y: number, xs: number[], nose = NOSE): Plank[] =>
  xs.flatMap((x) => (y === TOP ? [-3, 0] : WIDE).map((z) => at('flat-x', x + (z === -1.5 ? nose : 0), y, z)));
const fuselage = (y: number) => floor(y, [0, 15, 30].map((d) => start(y) + d));

const wx = start(WING) + 15; // trailing edge of the wing: its floor is a tail piece, 5 planks across, a nose piece
const center = [0, 1, 2, 3, 4].map((i) => at('flat-z', wx + 3 * i, WING, -7.5));
// outer wing: 3 planks swept back by SWEEP, spaced so they stay side by side once turned
const SWEEP = 20;
const [sin, cos] = [Math.sin, Math.cos].map((f) => f((SWEEP * Math.PI) / 180));
const outer = (side: 1 | -1) =>
  [0, 1, 2].map((i) => {
    const cx = wx + 1.5 + (3.02 / cos) * i;
    const cz = side * (7.55 + 1.5 * sin); // the trailing corner just touches the middle plank's end
    return spin(at('flat-z', cx - 1.5, WING, side === 1 ? cz : cz - 15), -side * SWEEP, cx, cz);
  });
const ENGINE = 7.55 + 1.5 * sin + 7.5 * cos; // under the middle of the outer planks
const engines = [0, 1, 2].map((y) => [1, -1].map((side) => at('flat-x', wx - 3, y, side * ENGINE - 1.5)));
const stab = [0, 1].map((i) => at('flat-z', start(TOP) + 3 * i, TOP + 1, -7.5));
const fin = [0, 1, 2, 3, 4].map((k) => at('flat-x', start(TOP) - 3 - k, TOP + 2 + k, -1.5));

// a floor of 9 planks is too much for one step: the two back thirds, then the nose third
const twoSteps = (planks: Plank[], hint?: string): Step[] => [
  { planks: planks.filter((_, i) => i < 6), ...(hint && { hint }) },
  { planks: planks.filter((_, i) => i >= 6) },
];

const steps: Step[] = [
  ...engines.map((planks, y) => ({ planks, ...(y === 0 && { hint: 'Les 2 moteurs d’abord, sous les ailes' }) })),
  ...[0, 1, 2].flatMap((y) => twoSteps(fuselage(y), ['Le ventre de l’avion : 3 rangées bout à bout', 'Chaque étage recule d’un petit cran', undefined][y])),
  { planks: floor(WING, [start(WING), wx + 15], 0), hint: 'Un trou au milieu pour l’aile' },
  { planks: center, hint: 'L’aile traverse l’avion' },
  { planks: [...outer(1), ...outer(-1)], hint: 'Le bout des ailes repose sur les moteurs' },
  ...[4, 5, 6].flatMap((y) => twoSteps(fuselage(y))),
  { planks: fuselage(TOP), hint: 'Le dos, plus étroit' },
  { planks: stab, hint: 'Les petites ailes de la queue' },
  { planks: fin, hint: 'La dérive : chaque planchette recule d’un cran' },
];

export const avion: Model = { id: 'avion', name: 'Avion', theme: 'vehicules', difficulty: 2, steps };

export default avion;
