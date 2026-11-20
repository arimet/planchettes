import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Skyscraper: the fast Kapla tower. Each storey is 4 planks standing at the corners of a square,
// two planks across their tops, then a floor across those. Storeys alternate direction so they tie.
// A fifth plank stands in the middle of each face (windows). Main shaft 15 wide, then a setback 9 wide
// turned 45° (its floors stick out at the corners), a crown of 3 standing planks and an antenna.

type P = Plank[];

/** One storey of a square [a, b]² standing at y: 4 posts, 2 beams, floor planks at offsets fl. */
function storey(a: number, b: number, y: number, odd: boolean, fl: number[]): { posts: P; beams: P; floor: P } {
  const m = (a + b) / 2 - 7.5; // min corner of a 15 plank centered on the square
  if (!odd)
    return {
      posts: [[a, a], [b - 2, a], [a, b - 3], [b - 2, b - 3]].map(([x, z]) => at('up-z', x + 0.5, y, z)),
      beams: [at('flat-x', m, y + 15, a), at('flat-x', m, y + 15, b - 3)],
      floor: fl.map((x) => at('flat-z', x, y + 16, m)),
    };
  return {
    posts: [[a, a], [b - 3, a], [a, b - 2], [b - 3, b - 2]].map(([x, z]) => at('up-x', x, y, z + 0.5)),
    beams: [at('flat-z', a, y + 15, m), at('flat-z', b - 3, y + 15, m)],
    floor: fl.map((z) => at('flat-x', m, y + 16, z)),
  };
}

/** A stander in the middle of each face, under the beams or beside them: the facade gets windows. */
function mids(a: number, b: number, y: number): P {
  const c = (a + b) / 2 - 1.5;
  return [at('up-x', c, y, a + 0.5), at('up-z', b - 1.5, y, c), at('up-x', c, y, b - 1.5), at('up-z', a + 0.5, y, c)];
}

const steps: Step[] = [];
let y = 0;
let n = 0;
const tier = (a: number, b: number, count: number, fl: number[], hints: string[], withMids: boolean) => {
  for (let i = 0; i < count; i++, n++, y += 17) {
    const s = storey(a, b, y, n % 2 === 1, fl);
    steps.push({ planks: s.posts, ...(hints[0] && i === 0 && { hint: hints[0] }) });
    if (withMids) steps.push({ planks: mids(a, b, y), ...(i === 0 && { hint: 'Une au milieu de chaque côté : les fenêtres' }) });
    steps.push({ planks: s.beams, ...(hints[1] && i === 0 && { hint: hints[1] }) });
    steps.push({ planks: s.floor, ...(hints[2] && i === 0 && { hint: hints[2] }) });
  }
};

const full = (a: number, b: number) => Array.from({ length: (b - a) / 3 }, (_, i) => a + 3 * i);
// main shaft 15 × 15
tier(0, 15, 4, full(0, 15), [
  'Quatre planchettes debout, aux coins',
  'Deux planchettes posées sur les coins',
  'Le plancher, en travers',
], true);
// setback: a 9 square turned 45° on the shaft, its floors stick out at the corners
const before = steps.length;
tier(3, 12, 2, full(3, 12), ['Plus petit, et en biais'], true);
for (const st of steps.slice(before)) st.planks = st.planks.map((p) => spin(p, 45, 7.5, 7.5));
// crown: three planks standing side by side, the antenna standing across their tops
steps.push({ planks: [6, 7, 8].map((z) => at('up-x', 6, y, z)), hint: 'Trois planchettes debout, collées' });
steps.push({ planks: [at('up-z', 7, y + 15, 6)], hint: 'L’antenne, debout en travers des trois' });

export const gratteCiel: Model = { id: 'gratte-ciel', name: 'Gratte-ciel', theme: 'tours', difficulty: 2, steps };
export default gratteCiel;
