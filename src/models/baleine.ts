import { at, overlaps, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A whale swimming toward +x. The body is a long dome: rings of flat planks around ellipses, each ring
// a bit smaller than the one below and turned half a plank, the top sliding forward so the head is
// higher than the back. A floor across and a ridge close it; the spout is two standing planks held by
// the ridge, with a plank across on top. The tail lies on the floor behind, slid under the body, and
// climbs back in steps to the flukes: two planks crossing.

/** Ring of n flat planks whose inner edges sit on the ellipse (cx ± A, ± B), shifted by phase (in planks). */
function ring(A: number, B: number, cx: number, y: number, n: number, phase: number): Plank[] {
  const N = 720;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / N;
    return [cx - A * Math.cos(t), B * Math.sin(t)]; // starts at the back (-x)
  });
  const cum = [0];
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const P = cum[N];
  return Array.from({ length: n }, (_, k) => {
    const s = (((k + phase) / n) * P + P) % P;
    const i = Math.max(1, cum.findIndex((c) => c >= s));
    const [x0, z0] = pts[i - 1];
    const [x1, z1] = pts[i];
    const L = Math.hypot(x1 - x0, z1 - z0);
    const [tx, tz] = [(x1 - x0) / L, (z1 - z0) / L];
    const [nx, nz] = [tz, -tx]; // outward for this direction of travel
    return { x: x0 + 1.5 * nx, y: y + 0.5, z: z0 + 1.5 * nz, o: 'flat-x', yaw: (Math.atan2(-tz, tx) * 180) / Math.PI } as Plank;
  });
}

const RINGS: { A: number; B: number; cx: number; n: number }[] = [];
for (let i = 0, A = 22, B = 12; i < 13; i++, A -= 0.5, B -= 0.4 + 0.02 * i) {
  const P = Math.PI * (3 * (A + B) - Math.sqrt((3 * A + B) * (A + 3 * B)));
  RINGS.push({ A, B, cx: 0.5 * i, n: Math.floor(P / 15.8) });
}
/** The ring with as many planks as fit without touching each other. */
function fit(A: number, B: number, cx: number, y: number, n: number, phase: number): Plank[] {
  const r = ring(A, B, cx, y, n, phase);
  const ok = r.every((p, i) => r.every((q, j) => j <= i || !overlaps(p, q)));
  return ok ? r : fit(A, B, cx, y, n - 1, phase);
}
const body = RINGS.map(({ A, B, cx, n }, i) => fit(A, B, cx, i, n, i % 2 ? 0.5 : 0));
// the tail: two planks on the floor in place of the back of the first ring, two more behind
const SZ = [-3.5, 0.5];
const spokes = [-30, -45].flatMap((x) => SZ.map((z) => at('flat-x', x, 0, z)));
body[0] = body[0].slice(1);
// then a single row climbing back, one step per floor
const stair = Array.from({ length: 8 }, (_, k) => at('flat-x', -42 - k, 1 + k, -1.5));
const TAIL = -44; // fluke center x
const fluke = (y: number, deg: number): Plank => spin(at('flat-z', TAIL - 1.5, y, -7.5), deg, TAIL, 0);

// the top of the last ring (4 planks: back, front and two sides): a floor across, then a ridge along
const T = RINGS.length;
const lid = [-10, -1, 2.5, 6, 9.5, 19].map((x) => at('flat-z', x, T, -7.5));
const spout = [-1.5, 0.5].map((z) => at('up-x', 9.5, T + 1, z)); // on a plank of the floor
const splash = spin(at('flat-x', 3.5, T + 16, -1.5), 90, 11, 0); // across the top of the spout
const ridge = [...[-8, 7].flatMap((x) => [-5, 2].map((z) => at('flat-x', x, T + 1, z))), at('flat-x', -8, T + 1, -1.5)];

const steps: Step[] = [
  { planks: spokes, hint: 'La queue, posée par terre : quatre planchettes' },
  { planks: body[0], hint: 'Un grand ovale de planchettes couchées autour du bout de la queue' },
  ...body.slice(1).map((planks, i) => ({ planks, ...(i === 0 && { hint: 'Chaque ovale rentre un peu et tourne d’un demi-cran' }) })),
  { planks: lid, hint: 'Un plancher en travers' },
  { planks: spout, hint: 'Le jet d’eau : deux planchettes debout' },
  { planks: ridge, hint: 'Le dos, en long, qui tient le jet' },
  { planks: [splash], hint: 'L’eau retombe : une planchette en travers, en haut' },
  { planks: stair.slice(0, 4), hint: 'La queue monte : chaque marche recule d’un cran' },
  { planks: stair.slice(4) },
  { planks: [fluke(9, 30)], hint: 'La nageoire : deux planchettes en croix' },
  { planks: [fluke(10, -30)] },
];

const FACE = 15; // turn the whale so its side shows from the 3/4 view
export const baleine: Model = {
  id: 'baleine',
  name: 'Baleine',
  theme: 'animaux',
  difficulty: 2,
  steps: steps.map((s) => ({ ...s, planks: s.planks.map((p) => spin(p, FACE, 0, 0)) })),
};

export default baleine;
