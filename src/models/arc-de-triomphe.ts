import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Arc de triomphe, front facing +z. Two hollow pillars (x 0..15 and 30..45): each course is a box
// of four planks on edge, then flat ties across it. Above the pillars, the front wall goes on while
// flat planks just behind it reach further into the passage at every layer: a corbelled arch that
// shows its curve without notching the front. Planks lying front to back close the arch, then a
// frieze of planks on edge, a cornice sticking out, and the attic.
const W = 45;
const CYCLES = 6; // pillar courses of 4 units: edges (3) + ties (1)
const SHIFT = [2, 2.75, 3.75, 4.75, 6, 7.25]; // corbel: how far each layer reaches into the passage

const mirror = (p: Plank): Plank => ({ ...p, x: W - p.x });
const both = (left: Plank[]): Plank[] => [...left, ...left.map(mirror)];
const SIDES = [0.5, 13, 16, 28, 31, 43.5]; // under both ends of every plank of a row
const row = (o: 'flat-x' | 'edge-x', y: number, z: number) => [0, 15, 30].map((x) => at(o, x, y, z));

// Neighbouring planks keep a small gap (0.5 to 1): a child never places them exactly touching.
// one pillar course (left pillar, outer side at x = 0): front, back, outer side, passage side
const front = (y: number) => at('edge-x', 0, y, 16.5);
const side = (x: number, y: number) => at('edge-z', x, y, 1.25);
const edges = (y: number): Plank[] => [front(y), at('edge-x', 0, y, -0.5), side(0.5, y), side(13.5, y)];
const ties = (y: number, rows: number[]): Plank[] => rows.map((z) => at('flat-x', 0, y, z));

const steps: Step[] = [];
for (let c = 0; c < CYCLES; c++) {
  steps.push({ planks: both(edges(4 * c)) });
  steps.push({ planks: both(ties(4 * c + 3, c === CYCLES - 1 ? [-1, 3.5, 11.5, 15] : [-1, 15])) });
}
steps[0].hint = 'Sur la tranche : deux carrés creux';
steps[1].hint = 'Couchées en travers, devant et derrière';
steps[2 * CYCLES - 1].hint = 'Quatre par pilier cette fois';

// corbelled arch: front wall and outer side go on; behind the front wall one plank, at the back two
let y = 4 * CYCLES;
for (const [i, s] of SHIFT.entries()) {
  if (i % 3 === 0) steps.push({ planks: both([front(y), side(0.5, y)]), ...(i === 0 && { hint: 'Le devant et le côté continuent' }) });
  steps.push({
    planks: both([at('flat-x', s, y, 13), at('flat-x', s, y, -1), at('flat-x', s, y, 3.5)]),
    ...(i === 0 && { hint: 'Derrière le mur, elles dépassent au-dessus du passage' }),
    ...(i === 1 && { hint: 'Chaque étage avance d’un cran' }),
  });
  y++;
}

// arch closed: lintels on the pillars, planks lying front to back over the passage
steps.push({ planks: [...both([at('flat-x', 0, y, 15)]), ...row('flat-x', y, -1)] });
steps.push({ planks: [15.5, 19, 23, 26.5].map((x) => at('flat-z', x, y, 3)), hint: 'D’avant en arrière : elles ferment l’arche' });
y++;
// frieze: planks on edge, front and back, then sides
steps.push({ planks: [...row('edge-x', y, 16.5), ...row('edge-x', y, -0.5)] });
steps.push({ planks: SIDES.map((x) => side(x, y)), hint: 'Sur la tranche, d’avant en arrière' });
y += 3;
// cornice: sticks out at front and back
steps.push({ planks: [...row('flat-x', y, 15.5), ...row('flat-x', y, -1.5)], hint: 'La corniche dépasse un peu devant' });
steps.push({ planks: row('flat-x', y, 7) });
y++;
// attic: a box of planks on edge, ties, a second box, a flat lid
const attic = (y: number) => [...row('edge-x', y, 16.5), ...row('edge-x', y, -0.5)];
const atticSides = (y: number) => SIDES.map((x) => side(x, y));
steps.push({ planks: attic(y), hint: 'L’attique : un peu en retrait' });
steps.push({ planks: atticSides(y) });
y += 3;
steps.push({ planks: [...row('flat-x', y, 15), ...row('flat-x', y, -1)] });
y++;
steps.push({ planks: attic(y) });
steps.push({ planks: atticSides(y) });
y += 3;
steps.push({ planks: [...row('flat-x', y, 15), ...row('flat-x', y, -1)] });
steps.push({ planks: row('flat-x', y, 7) });

export const arcDeTriomphe: Model = { id: 'arc-de-triomphe', name: 'Arc de triomphe', theme: 'monuments', difficulty: 2, steps };
export default arcDeTriomphe;
