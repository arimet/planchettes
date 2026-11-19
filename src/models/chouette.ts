import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Owl on a branch, facing +z (turned toward the camera). The body is a log cabin, 2 planks a floor,
// a little wider in the middle, with a pile of plank ends on each side: the folded wings. The head is
// a block of planks all lying front to back: seen from the front, their ends draw two big eyes with
// pupils that stick out, a beak between them, and two ear tufts on top.

const N = 17; // body floors
const B0 = 2; // the body starts above the branch and the feet
const W = 6; // half the distance between the two planks of a floor, at the widest

/** Body floor k: 2 planks, along x on even floors, along z on odd ones, wider in the middle. */
function floor(k: number): Plank[] {
  const s = 4.5 + (W - 4.5) * Math.sin((Math.PI * k) / (N - 1)); // half the distance between the two planks
  const y = B0 + k;
  return k % 2 ? [at('flat-z', -s - 1.5, y, -7.5), at('flat-z', s - 1.5, y, -7.5)] : [at('flat-x', -7.5, y, -s - 1.5), at('flat-x', -7.5, y, s - 1.5)];
}

const H = B0 + N; // the head starts here
const z = -7.5; // every head plank lies front to back, from z = -7.5
const flat = (x: number, y: number, dz = 0) => at('flat-z', x, y, z + dz); // 3 wide, 1 tall
const edge = (x: number, y: number, dz = 0) => at('edge-z', x, y, z + dz); // 1 wide, 3 tall

// Each eye is a ring 7 × 7 of plank ends, x0 = its left side; the pupil is 5 planks stacked in the
// middle, sticking out, which also hold the top of the ring. Between the eyes, a column 1 wide holds the beak.
const EYES = [-7.5, 0.5];
const row = (y: number) => [-7.5, -4.5, -1.5, 1.5, 4.5].map((x) => flat(x, y));
const pupil = (i: number) => EYES.map((x0) => flat(x0 + 2, H + 2 + i, 3));

/** Folded wings, both sides at once: a column of plank ends against the body, from the branch up. */
const WING = 14; // rows of flat planks
const wings = (k: number) => (k < WING ? [flat(-10.5, 1 + k), flat(7.5, 1 + k)] : k === WING ? [edge(-8.5, 1 + k), edge(7.5, 1 + k)] : []);

const steps: Step[] = [
  { planks: [at('flat-x', -15, 0, -1.5), at('flat-x', 0, 0, -1.5)], hint: 'La branche : deux planchettes bout à bout' },
  { planks: [-7.5, -4.5, 1.5, 4.5].map((x) => at('flat-z', x, 1, -7.5)), hint: 'Les pattes, en travers de la branche' },
  ...Array.from({ length: N }, (_, k) => ({
    planks: [...wings(k), ...floor(k)],
    ...(k === 0 && { hint: 'Les ailes sur la branche, de chaque côté ; le corps au milieu, deux planchettes' }),
    ...(k === 1 && { hint: 'Le corps en travers, un peu plus écarté à chaque étage ; une aile de plus de chaque côté' }),
    ...(k === 9 && { hint: 'Puis le corps se resserre' }),
    ...(k === WING && { hint: 'Le bout des ailes, sur la tranche' }),
  })),
  { planks: row(H), hint: 'Le menton : 5 planchettes côte à côte' },
  {
    planks: [...EYES.flatMap((x0) => [flat(x0, H + 1), flat(x0 + 3, H + 1), edge(x0 + 6, H + 1)]), edge(-0.5, H + 1, 4)],
    hint: 'Le bas des yeux, et le bec qui dépasse devant',
  },
  { planks: [...EYES.map((x0) => edge(x0, H + 2)), ...pupil(0)], hint: 'Le bord des yeux, sur la tranche ; la pupille dépasse devant' },
  { planks: pupil(1) },
  { planks: [...pupil(2), ...EYES.map((x0) => edge(x0 + 6, H + 4)), edge(-0.5, H + 4)] },
  { planks: [...pupil(3), ...EYES.map((x0) => edge(x0, H + 5))] },
  { planks: pupil(4) },
  { planks: EYES.flatMap((x0) => [flat(x0 + 1, H + 7), flat(x0 + 4, H + 7)]), hint: 'Le haut des yeux' },
  { planks: row(H + 8), hint: 'Le front' },
  { planks: [flat(-7.5, H + 9), flat(4.5, H + 9)], hint: 'Les aigrettes, aux deux coins' },
  { planks: [edge(-6.5, H + 10), edge(5.5, H + 10)] },
];

const FACE = 25; // turn the owl so it looks at the camera of the 3/4 view
export const chouette: Model = {
  id: 'chouette',
  name: 'Chouette',
  theme: 'animaux',
  difficulty: 2,
  steps: steps.map((s) => ({ ...s, planks: s.planks.map((p) => spin(p, FACE, 0, 0)) })),
};

export default chouette;
