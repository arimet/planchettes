import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Tower crane, jib to +x. An open lattice mast (two planks on edge per floor, crossing the floor below),
// a platform of planks across on top. The jib: two rails that step 3 further out on every floor, each
// held down at its back end by a pile of planks across. Over the mast the piles make the cab; along
// the jib, one plank across per rail. Behind, the counter-jib (two outer rails) carries the
// counterweight, so the whole top stays balanced over the mast. A load waits on the ground.

const MAST = 6; // mast steps, two floors 3 high each
const H = 6 * MAST; // platform
const Y = H + 2; // first jib floor
const LEFTS = [-6, -3, 0, 3, 6, 9, 12, 15]; // back end of the jib rail, per floor
const PILES = [7, 6, 5, 4, 3, 1, 1]; // planks across on the back end of each jib rail
const WEIGHT = 5; // counterweight floors
const ZJ = [-4.5, 1.5]; // jib rails
const ZC = [-7.5, 4.5]; // counter-jib rails

const rails = (zs: number[], x: number, y: number): Plank[] => zs.map((z) => at('flat-x', x, y, z));
const across = (x: number, y: number): Plank => at('flat-z', x, y, -7.5);

const mast: Step[] = Array.from({ length: MAST }, (_, i) => ({
  planks: [...[-6, 5].map((z) => at('edge-x', -7.5, 6 * i, z)), ...[-6, 5].map((x) => at('edge-z', x, 6 * i + 3, -7.5))],
  ...(i === 0 && { hint: 'Deux planchettes sur la tranche, deux autres en croix dessus' }),
}));

const jib: Step[] = [
  { planks: [...rails(ZJ, LEFTS[0], Y), ...rails(ZC, -15, Y)], hint: 'La flèche au milieu, la contre-flèche dehors' },
];
for (let k = 1; k <= LEFTS.length; k++) {
  const planks = [
    ...PILES.flatMap((h, j) => (k > j && k <= j + h ? [across(LEFTS[j], Y + k)] : [])),
    ...(k <= WEIGHT ? [across(-15, Y + k), across(-12, Y + k)] : []),
  ];
  if (planks.length) jib.push({
    planks,
    ...(k === 1 && { hint: 'Une planchette en travers sur le bout du rail le retient ; à gauche, le contrepoids' }),
    ...(k === 2 && { hint: 'Toujours sur le bout des rails : la cabine monte' }),
  });
  if (k < LEFTS.length) jib.push({ planks: rails(ZJ, LEFTS[k], Y + k), ...(k === 1 && { hint: 'Chaque rail dépasse de 3 de plus' }) });
}

// the tower head: three standing planks on a plank lying across the cab
const TOP = Y + PILES[0] + 1;
const head: Plank[] = [-1.5, -0.5, 0.5].map((z) => at('up-x', -1.5, TOP + 1, z));

// a pallet of planks in front of the jib tip
const load: Step[] = [
  { planks: [21, 30].map((x) => at('flat-z', x, 0, 4)), hint: 'Le chargement, devant le bout de la flèche' },
  { planks: [5.5, 8.5, 11.5, 14.5].map((z) => at('flat-x', 19.5, 1, z)) },
  { planks: [7, 10, 13].map((z) => at('flat-x', 19.5, 2, z)) },
];

const steps: Step[] = [
  ...mast,
  { planks: [...rails(ZC, -9, H), ...rails(ZJ, -6, H)], hint: 'En haut du mât, deux rails décalés à gauche, deux à droite' },
  { planks: [3, 2, 4, 1, 5, 0].map((i) => across(-9 + 3 * i, H + 1)), hint: 'Commence par le milieu' },
  ...jib,
  { planks: [-3, 0].map((z) => at('flat-x', -6, TOP, z)), hint: 'Deux planchettes en long sur la cabine' },
  { planks: head, hint: 'La pointe : trois planchettes debout, collées' },
  ...load,
];

export const grue: Model = { id: 'grue', name: 'Grue', theme: 'vehicules', difficulty: 3, steps };
export default grue;
