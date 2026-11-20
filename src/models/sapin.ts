import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Christmas tree: layers of 4 branch planks in a windmill, tips reaching R from the axis.
// Branch 0 lies on x ∈ [R - 15, R], z ∈ [-w, 3 - w]; below R = 15 the branches slide sideways
// (w = 18 - R) so they never collide in the middle. Each tier of branches starts wide and steps in,
// the next tier starts a bit narrower: a sawtooth triangle. Every layer turns 2.5°, so the branches
// swirl up (more and the branch stacks lean off the plank below). Top: one plank, then the point.

type P = Plank[];
const TWIST = 2.5;
const windmill = (R: number, y: number): P =>
  [0, 90, 180, 270].map((k) => spin(at('flat-x', R - 15, y, -Math.max(3, 18 - R)), k + y * TWIST, 0, 0));

// tip reach per layer, tier by tier
const TIERS: number[][] = [
  [20, 19, 18, 17, 16, 15],
  [19, 18, 17, 16, 15, 14.25],
  [17.5, 16.5, 15.5, 15, 14.25, 13.5],
  [16, 15, 14.25, 13.5, 12.75, 12],
  [14.25, 13.5, 12.75, 12, 11.25],
];

const steps: Step[] = [];
let y = 0;
TIERS.forEach((tier, t) =>
  tier.forEach((R, i) => {
    const hint =
      t === 0 && i === 0 ? 'Quatre branches en moulinet, loin du milieu'
      : t === 0 && i === 1 ? 'Chaque étage tourne un peu et rentre d’un cran'
      : t === 1 && i === 0 ? 'Nouvel étage de branches : il ressort un peu'
      : t === 3 && i === 1 ? 'Les branches se touchent au milieu'
      : undefined;
    steps.push({ planks: windmill(R, y++), ...(hint && { hint }) });
  }),
);
// top: one plank across two branches, then three standing side by side
const top = (p: Plank) => spin(p, (y - 1) * TWIST, 0, 0);
steps.push({ planks: [top(at('flat-x', -7.5, y, -1.5))], hint: 'Une planchette au milieu' });
steps.push({ planks: [-1, 0, 1].map((d) => top(at('up-z', d - 0.5, y + 1, -1.5))), hint: 'La pointe : trois planchettes debout, collées' });

export const sapin: Model = { id: 'sapin', name: 'Sapin de Noël', theme: 'originaux', difficulty: 2, steps };
export default sapin;
