import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Colosseum: an oval arcade wall. The oval is a ring of 14 planks around the center, pulled apart
// along x with one more plank on the front and on the back (16 slots). Each storey of a slot is two
// planks standing under the ends of a flat plank (an arch between them, a double pier between two
// slots), then a band: a plank on edge, and a flat plank across the joint with the next slot, which
// ties the wall. The ground storey goes all around; the front, facing the camera, has lost its upper
// storey, so you see inside; the back keeps two storeys and the attic on top. In the arena, the low
// walls of the underground cages, built first while the arena is easy to reach.
const N = 14;
const A = 7.5 / Math.tan(Math.PI / N) + 1; // inner edge of the ring planks, from the center of each half
const DX = 8; // each half moves this far along x
const H = 20; // storey: standing plank, flat, on edge, flat

type Slot = [number, number]; // angle, x shift
const half = (from: number, to: number, dx: number): Slot[] =>
  Array.from({ length: to - from + 1 }, (_, i) => [((from + i) * 360) / N, dx]);
// in order around the oval, starting at the front
const SLOTS: Slot[] = [...half(0, N / 2, DX), ...half(N / 2, N, -DX).map(([d, dx]): Slot => [d % 360, dx])];

/** Between slot i and the next one. */
const joint = (i: number): Slot => {
  const [d, dx] = SLOTS[i];
  const [, ex] = SLOTS[(i + 1) % SLOTS.length];
  return dx === ex ? [d + 180 / N, dx] : [d, 0];
};

const place = (p: Plank, [deg, dx]: Slot): Plank => {
  const q = spin(p, deg, 0, 0);
  return { ...q, x: q.x + dx };
};
const piers = (y: number, s: Slot) => [-6.75, 3.75].map((x) => place(at('up-x', x, y, A + 1), s));
const flat = (y: number, s: Slot) => place(at('flat-x', -7.5, y, A), s);
const edge = (y: number, s: Slot, z = A + 1) => place(at('edge-x', -7.5, y, z), s);

/** Slot indexes from..to (inclusive, may wrap around). */
function span(from: number, to: number): number[] {
  const idx: number[] = [];
  for (let i = from; ; i = (i + 1) % SLOTS.length) {
    idx.push(i);
    if (i === to) return idx;
  }
}

/** Band on top of the slots idx at height y: planks on edge, then flat planks across the joints.
 * On top nothing holds the flat planks down: two planks on edge per slot, so they lie wide. */
function band(idx: number[], y: number, chunks: number[][], top = false): Step[] {
  const ring = idx.length === SLOTS.length;
  const out: Step[] = [];
  for (const [c, part] of chunks.entries()) {
    out.push({ planks: part.flatMap((k) => (top ? [edge(y, SLOTS[k], A), edge(y, SLOTS[k], A + 2)] : [edge(y, SLOTS[k])])) });
    // across a joint once both of its slots are there
    const joints = [...(c > 0 ? [chunks[c - 1].at(-1)!] : []), ...part.slice(0, -1)];
    if (joints.length) out.push({ planks: joints.map((k) => flat(y + 3, joint(k))) });
  }
  if (ring) out.push({ planks: [flat(y + 3, joint(idx.at(-1)!))] });
  return out;
}

const chunked = (idx: number[]) => Array.from({ length: Math.ceil(idx.length / 4) }, (_, i) => idx.slice(4 * i, 4 * i + 4));

/** One storey of arches over the slots from..to. */
function storey(level: number, from: number, to: number): Step[] {
  const idx = span(from, to);
  const chunks = chunked(idx);
  const y = level * H;
  const arches = chunks.flatMap((part) => [
    { planks: part.flatMap((k) => piers(y, SLOTS[k])) },
    { planks: part.map((k) => flat(y + 15, SLOTS[k])) },
  ]);
  return [...arches, ...band(idx, y + 16, chunks)];
}

const ground = storey(0, 0, 15);
ground[0].hint = 'Debout, deux par deux, avec un trou entre elles';
ground[1].hint = 'Une couchée sur chaque paire : l’arche';
ground[8].hint = 'Le bandeau : sur la tranche, au milieu';
ground[9].hint = 'Couchées à cheval sur deux arches';
const upper = storey(1, 4, 15);
upper[0].hint = 'Le deuxième étage, sauf devant : il s’est écroulé';
const atticIdx = span(6, 13);
const attic = band(atticIdx, 2 * H, chunked(atticIdx), true);
attic[0].hint = 'Tout en haut, au fond : l’attique';

// the arena floor is gone: low walls of the underground cages, a corridor down the middle
const CROSS = [-20.5, -12.5, -4.5, 3.5, 11.5, 19.5];
const cages: Step[] = [
  { planks: [-22.5, -7.5, 7.5].flatMap((x) => [at('edge-x', x, 0, 1.5), at('edge-x', x, 0, -2.5)]), hint: 'Au milieu, sur la tranche : un couloir' },
  { planks: CROSS.map((x) => at('edge-z', x, 0, 3.5)), hint: 'Des petits murs en travers : les cages' },
  { planks: CROSS.map((x) => at('edge-z', x, 0, -18.5)) },
];

const steps: Step[] = [...cages, ...ground, ...upper, ...attic];

export const colisee: Model = { id: 'colisee', name: 'Colisée', theme: 'monuments', difficulty: 3, steps };
export default colisee;
