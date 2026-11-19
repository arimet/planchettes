import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Eiffel tower. Four open lattice legs (two planks on edge per layer, crossing the layer below) in the
// corners of a 44 × 44 square: each layer moves the legs toward the middle, slowly then faster, so the
// gap between two legs closes like an arch. First floor on the legs; four posts with planks leaning on
// them; second floor; two "needles" (three standing planks with four planks leaning on them), a tiny
// third floor between them, and an antenna. The leaning planks around the posts go last, when the
// posts carry the whole top.
const B = 45;
const C = B / 2;
const R = [14.5, 14.5, 14, 13, 11.8, 10.4, 9, 7.5]; // distance from the middle to the leg axes, per layer
const W = [13, 12, 9, 9, 9, 9, 9, 9]; // leg width per layer: wide feet, then slim legs

/** One layer of the four legs: two planks on edge each, crossing the layer below (open lattice). */
const legs = (k: number): Plank[] =>
  [[0, 0], [1, 0], [1, 1], [0, 1]].flatMap(([qx, qz]) => {
    const x = C + (qx ? R[k] : -R[k]), z = C + (qz ? R[k] : -R[k]);
    const w = W[k] / 2;
    return (k + qx + qz) % 2 === 0
      ? [at('edge-x', x - 7.5, 3 * k, z - w), at('edge-x', x - 7.5, 3 * k, z + w - 1)]
      : [at('edge-z', x - w, 3 * k, z - 7.5), at('edge-z', x + w - 1, 3 * k, z - 7.5)];
  });

/** Floor quadrant (5 planks), direction alternating around the middle. */
const quadrant = (qx: number, qz: number, y: number): Plank[] => {
  const x = C - 15 + 15 * qx, z = C - 15 + 15 * qz;
  return [0, 3, 6, 9, 12].map((d) => ((qx + qz) % 2 === 0 ? at('flat-x', x, y, z + d) : at('flat-z', x + d, y, z)));
};

/** Corner post: three standing planks pressed together (3 × 3), in the corner (sx, sz) of a square of half-side h. */
const post = (sx: number, sz: number, h: number, y: number): Plank[] => {
  const x = sx < 0 ? C - h : C + h - 3, z = sz < 0 ? C - h : C + h - 3;
  return [0, 1, 2].map((d) => at('up-x', x, y, z + d));
};

/** Plank leaning on the face x = C + f, foot on y, at slope degrees, then turned by deg around the axis. */
const tilted = (f: number, y: number, slope: number, z: number, deg: number): Plank => {
  const a = (slope * Math.PI) / 180;
  return spin({ o: 'flat-x', tilt: -slope, x: C + f + 0.02 + 7.5 * Math.cos(a) + 0.5 * Math.sin(a), y: y + 0.01 + 7.5 * Math.sin(a) + 0.5 * Math.cos(a), z }, deg, C, C);
};

/** Two planks leaning on the outer faces of the corner post (sx, sz), one per face. */
const lean = (sx: number, sz: number, h: number, y: number, slope: number): Plank[] => {
  const x = sx < 0 ? C - h + 1.5 : C + h - 1.5, z = sz < 0 ? C - h + 1.5 : C + h - 1.5; // post axis
  return [tilted(h, y, slope, sx > 0 ? z : 2 * C - z, sx > 0 ? 0 : 180), tilted(h, y, slope, sz < 0 ? x : 2 * C - x, sz < 0 ? 90 : -90)];
};

/** Needle: three standing planks, then four planks leaning on them. */
const needle = (y: number, slope: number): Step[] => [
  { planks: [-1, 0, 1].map((d) => at('up-x', C - 1.5, y, C - 0.5 + d)), hint: 'Trois planchettes debout, collées, au milieu' },
  { planks: [0, 90, 180, 270].map((deg) => tilted(1.5, y, slope, C, deg)), hint: 'Quatre planchettes penchées contre elles' },
];

const steps: Step[] = [];
const LEG_HINTS = ['Sur la tranche : deux planchettes par pied, dans chaque coin', 'Chaque étage croise celui du dessous', 'Les pieds se rapprochent du milieu : l’arche se ferme'];
R.forEach((_, k) => steps.push({ planks: legs(k), ...(LEG_HINTS[k] && { hint: LEG_HINTS[k] }) }));
let y = 3 * R.length;
steps.push(
  { planks: [...quadrant(0, 0, y), ...quadrant(1, 0, y).slice(0, 3)], hint: 'Le premier étage repose sur les quatre pieds' },
  { planks: [...quadrant(1, 0, y).slice(3), ...quadrant(1, 1, y)] },
  { planks: [...quadrant(0, 1, y)] },
);
y += 1;
const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
steps.push(
  { planks: corners.slice(0, 2).flatMap(([sx, sz]) => post(sx, sz, 7.5, y)), hint: 'Des piliers de trois planchettes debout, collées' },
  { planks: corners.slice(2).flatMap(([sx, sz]) => post(sx, sz, 7.5, y)) },
);
const stage2 = y;
y += 15;
steps.push({ planks: [at('flat-x', C - 7.5, y, C - 7.5), at('flat-x', C - 7.5, y, C + 4.5)] });
steps.push({ planks: [at('flat-z', C - 7.5, y + 1, C - 7.5), at('flat-z', C + 4.5, y + 1, C - 7.5)] });
y += 2;
steps.push({ planks: [6, 3, 9, 0, 12].map((d) => at('flat-x', C - 7.5, y, C - 7.5 + d)), hint: 'Le deuxième étage' });
y += 1;
steps.push(...needle(y, 80));
y += 15;
steps.push({ planks: [at('flat-x', C - 7.5, y, C - 1.5)], hint: 'Le troisième étage, tout petit' });
steps.push({ planks: [0, -3, 3].map((d) => at('flat-z', C - 1.5 + d, y + 1, C - 7.5)) });
y += 2;
steps.push(...needle(y, 82));
y += 15;
steps.push({ planks: [at('up-x', C - 1.5, y, C - 0.5)], hint: 'L’antenne, debout tout en haut' });
steps.push({ planks: corners.flatMap(([sx, sz]) => lean(sx, sz, 7.5, stage2, 78)), hint: 'Pour finir, penche une planchette contre chaque pilier' });

export const tourEiffel: Model = { id: 'tour-eiffel', name: 'Tour Eiffel', theme: 'tours', difficulty: 3, steps };
export default tourEiffel;
