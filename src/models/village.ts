import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A little village around a square: a bell tower, four different houses, a well, a tree, a bench.
// Every building is designed on its own, then moved and turned into place; they never touch.
// Houses share one roof: on each ceiling plank a post of two standing planks, and a plank leaning
// on it from each side (the church's roof).
// Built back to front, and spread along the camera's diagonal, so that no building hides another.

type Part = Step[];
const A = (72 * Math.PI) / 180; // roof slope
const RUN = 1.5 + 0.02 + 7.5 * Math.cos(A) + 0.5 * Math.sin(A); // post axis to the middle of a roof plank
const RISE = 0.01 + 7.5 * Math.sin(A) + 0.5 * Math.cos(A);

/** Roof over ceiling planks lying along x (x 0..15) at each z, their top at y: posts, then leaning planks. */
function roof(zs: number[], y: number, hint = false): Part {
  const posts = zs.flatMap((z) => [0.5, 1.5].map((d) => at('up-x', 6, y, z + d)));
  const legs = zs.flatMap((z) => [-1, 1].map((s): Plank => ({ o: 'flat-x', tilt: -s * 72, x: 7.5 + s * RUN, y: y + RISE, z: z + 1.5 })));
  return [
    { planks: posts, ...(hint && { hint: 'Sur chaque planchette du plafond, deux planchettes debout, collées' }) },
    { planks: legs, ...(hint && { hint: 'Le toit : une planchette penchée de chaque côté, contre elles' }) },
  ];
}
const ceiling = (zs: number[], y: number): Plank[] => zs.map((z) => at('flat-x', 0, y, z));

/** Moves a part designed around (cx, cz) to (x, z), turned by deg. */
const put = (part: Part, cx: number, cz: number, x: number, z: number, deg: number): Part =>
  part.map((s) => ({ ...s, planks: s.planks.map((p) => spin({ ...p, x: p.x - cx + x, z: p.z - cz + z }, deg, x, z)) }));

// --- bell tower (15 × 13): a room of standing planks, an open belfry, a spire leaning on a column
const towerSides = (y: number, zs: number[]): Plank[] => [1, 13].flatMap((x) => zs.map((z) => at('up-z', x, y, z)));
const towerEnds = (y: number): Plank[] => [0.5, 11.5].flatMap((z) => [3, 9].map((x) => at('up-x', x, y, z)));
const S = (75 * Math.PI) / 180;
const SPIRE = 33;
const spire = [0, 90, 180, 270].map((deg) =>
  spin({ o: 'flat-x', tilt: -75, x: 7.5 + 1.52 + 7.5 * Math.cos(S) + 0.5 * Math.sin(S), y: SPIRE + 0.01 + 7.5 * Math.sin(S) + 0.5 * Math.cos(S), z: 6.5 }, deg, 7.5, 6.5),
);
const tower: Part = [
  { planks: towerSides(0, [0, 5, 10]), hint: 'Le clocher, plus haut que les maisons : deux murs de planchettes debout' },
  { planks: towerEnds(0), hint: 'Derrière et devant, laisse un trou : la fenêtre et la porte' },
  { planks: ceiling([0, 5, 10], 15), hint: 'Le plancher, en travers sur les murs' },
  { planks: [...towerSides(16, [0, 10]), ...towerEnds(16)], hint: 'L’étage des cloches : des planchettes debout seulement dans les coins' },
  { planks: ceiling([0, 10], 31) },
  { planks: [0, 3, 6, 9, 12].map((x) => at('flat-z', x, 32, -1)), hint: 'Cinq planchettes collées, dans l’autre sens' },
  { planks: [5, 6, 7].map((z) => at('up-x', 6, SPIRE, z)), hint: 'Trois planchettes debout, collées, au milieu' },
  { planks: spire, hint: 'La flèche s’appuie contre elles' },
  { planks: [at('up-x', 6, SPIRE + 15, 6)], hint: 'La pointe, tout en haut' },
];

// --- tall house (15 × 10): standing walls, gable and door to the front
const T = [0, 3.5, 7];
const tall: Part = [
  { planks: [1.5, 12.5].flatMap((x) => T.map((z) => at('up-z', x, 0, z))), hint: 'La maison haute : deux murs de planchettes debout' },
  { planks: [...[3.5, 8.5].map((x) => at('up-x', x, 0, 1)), ...[3, 9].map((x) => at('up-x', x, 0, 8))], hint: 'Devant, laisse un trou : la porte' },
  { planks: ceiling(T, 15), hint: 'Le plafond, en travers sur les murs' },
  ...roof(T, 16, true),
  { planks: [at('flat-z', 6, 31, -2.5)], hint: 'Le faîte, à plat sur les poteaux' },
];

// --- house with a chimney (15 × 15): the door is in the long side, plates carry the ceiling over it.
// The chimney stands in the third roof bay, on three planks, so that it sticks out above the roof.
const BAYS = [0, 4, 8, 12];
const chimney: Part = [
  { planks: [...[1, 6, 11].map((x) => at('up-x', x, 0, 0)), ...[1, 6, 11].map((x) => at('up-x', x, 0, 14))], hint: 'La maison à la cheminée : trois planchettes debout derrière, trois devant' },
  { planks: [...[2, 6, 10].map((z) => at('up-z', 12, 0, z)), ...[2, 8].map((z) => at('up-z', 2, 0, z))], hint: 'Les murs des côtés : le trou est la porte' },
  { planks: [1, 11].map((x) => at('flat-z', x, 15, 0)), hint: 'Couche-les sur les murs' },
  { planks: ceiling(BAYS, 16) },
  { planks: [17, 18, 19].map((y) => at('flat-x', 0, y, 8)), hint: 'Trois planchettes l’une sur l’autre, sur la troisième' },
  { planks: [6, 7, 8].map((x) => at('up-z', x, 20, 8)), hint: 'La cheminée : trois planchettes debout, collées' },
  ...roof([0, 4, 12], 17),
];

// --- low house (15 × 15): walls of planks on edge, the open gable is the door
const rails = (y: number): Plank[] => [1.5, 12.5].map((x) => at('edge-z', x, y, 0));
const low: Part = [
  { planks: rails(0), hint: 'La maison basse : deux planchettes sur la tranche' },
  { planks: [0, 12].map((z) => at('flat-x', 0, 3, z)), hint: 'Une planchette en travers à chaque bout' },
  { planks: rails(4), hint: 'Encore deux sur la tranche, juste au-dessus des premières' },
  { planks: ceiling(BAYS, 7) },
  ...roof(BAYS, 8),
  { planks: [at('flat-z', 6, 23, 0)] },
];

// --- log cabin (15 × 15)
const log = (i: number): Plank[] => (i % 2 ? [0, 12].map((x) => at('flat-z', x, i, 0)) : [0, 12].map((z) => at('flat-x', 0, i, z)));
const cabin: Part = [
  { planks: [...log(0), ...log(1)], hint: 'La cabane en rondins : croise les planchettes' },
  { planks: [...log(2), ...log(3)] },
  { planks: [...log(4), ...log(5)] },
  { planks: ceiling(BAYS, 6) },
  ...roof(BAYS, 7),
];

// --- well: a small log curb, a post in the notch on each side, a beam for the bucket
const curb = (i: number): Plank[] => (i % 2 ? [-5, 2].map((x) => at('flat-z', x, i, -7.5)) : [-5, 2].map((z) => at('flat-x', -7.5, i, z)));
const well: Part = [
  { planks: [...curb(0), ...curb(1)], hint: 'Le puits, au milieu de la place' },
  { planks: [...curb(2), ...curb(3)] },
  { planks: [-6.3, 5.3].map((x) => at('up-z', x, 0, -1.5)), hint: 'Un poteau debout de chaque côté' },
  { planks: [at('flat-x', -7.5, 15, -1.5)], hint: 'La poutre du seau, sur les poteaux' },
];

// --- tree: a trunk and a crown of planks turning like a fan
const CROWN = 7;
const tree: Part = [
  { planks: [-1.5, -0.5, 0.5].map((x) => at('up-z', x, 0, -1.5)), hint: 'L’arbre : trois planchettes debout, collées' },
  { planks: Array.from({ length: CROWN }, (_, k) => spin(at('flat-x', -7.5, 15 + k, -1.5), (k * 180) / CROWN, 0, 0)), hint: 'Les branches : chacune tourne un peu plus que celle d’en dessous' },
];

// --- bench
const bench: Part = [
  { planks: [0, 2].map((z) => at('edge-x', 0, 0, z)), hint: 'Le banc : deux planchettes sur la tranche' },
  { planks: [at('flat-x', 0, 3, 0)] },
];

export const village: Model = {
  id: 'village',
  name: 'Village',
  theme: 'maisons',
  difficulty: 3,
  steps: [
    ...put(tower, 7.5, 6.5, -17, -21, 5),
    ...put(tall, 7.5, 5, 2.5, -27, -10),
    ...put(low, 7.5, 7.5, 30, -17, 100),
    ...put(chimney, 7.5, 7.5, -24, 0, 172),
    ...put(well, 0, 0, 1, -1, 30),
    ...put(tree, 0, 0, 33, 20, 0),
    ...put(cabin, 7.5, 7.5, -28, 22, 20),
    ...put(bench, 7.5, 1.5, 5, 15, 10),
  ],
};

export default village;
