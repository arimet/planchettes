// Draws a model from 4 sides into one PNG, to judge its look without a browser:
//   npx tsx scripts/preview.ts src/models/chateau.ts [step] → <out dir>/<id>.png
// step (1-based, optional): planks of that step in coral, later steps hidden.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Vector3 } from 'three';
import { corners, type Plank } from '../src/geometry';
import type { Model } from '../src/model';

const [file, stepArg] = process.argv.slice(2);
const mod = await import(resolve(file));
const m: Model = mod.default ?? Object.values(mod)[0];
const upTo = stepArg ? Number(stepArg) : m.steps.length;
const old = m.steps.slice(0, upTo - (stepArg ? 1 : 0)).flatMap((s) => s.planks);
const fresh = stepArg ? m.steps[upTo - 1].planks : [];

type View = { name: string; project: (v: Vector3) => [number, number, number] }; // x, y (down), depth (bigger = nearer)
const c30 = Math.cos(Math.PI / 6), s30 = 0.5;
const views: View[] = [
  { name: 'face (+z)', project: (v) => [v.x, -v.y, v.z] },
  { name: 'côté (+x)', project: (v) => [-v.z, -v.y, v.x] },
  { name: 'dessus', project: (v) => [v.x, v.z, v.y] },
  { name: '3/4', project: (v) => [(v.x - v.z) * c30, -v.y + (v.x + v.z) * s30 * 0.6, v.x + v.z + v.y] },
];

function hull(p: [number, number][]): [number, number][] {
  p = [...p].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const h = (l: [number, number][]) => { const o: [number, number][] = []; for (const q of l) { while (o.length > 1 && cr(o[o.length - 2], o[o.length - 1], q) <= 0) o.pop(); o.push(q); } return o.slice(0, -1); };
  return [...h(p), ...h([...p].reverse())];
}

const CELL = 420;
const parts: string[] = [];
views.forEach((view, vi) => {
  const all = [...old.map((p) => ({ p, hot: false })), ...fresh.map((p) => ({ p, hot: true }))];
  const polys = all.map(({ p, hot }) => {
    const pts = corners(p as Plank).map(view.project);
    return { hot, depth: Math.max(...pts.map((q) => q[2])), pts: hull(pts.map((q) => [q[0], q[1]] as [number, number])) };
  });
  const xs = polys.flatMap((q) => q.pts.map((p) => p[0])), ys = polys.flatMap((q) => q.pts.map((p) => p[1]));
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = (CELL - 40) / Math.max(x1 - x0, y1 - y0, 1);
  const ox = (vi % 2) * CELL + (CELL - (x1 - x0) * k) / 2, oy = Math.floor(vi / 2) * CELL + 30 + (CELL - 40 - (y1 - y0) * k) / 2;
  parts.push(`<text x="${(vi % 2) * CELL + 10}" y="${Math.floor(vi / 2) * CELL + 20}" font-family="sans-serif" font-size="16">${view.name}</text>`);
  for (const q of polys.sort((a, b) => a.depth - b.depth))
    parts.push(`<polygon points="${q.pts.map(([x, y]) => `${(ox + (x - x0) * k).toFixed(1)},${(oy + (y - y0) * k).toFixed(1)}`).join(' ')}" fill="${q.hot ? '#ff7a5c' : '#ecc993'}" stroke="#6b4a22" stroke-width="1"/>`);
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL * 2}" height="${CELL * 2}"><rect width="100%" height="100%" fill="#fff"/>${parts.join('')}</svg>`;
const out = resolve(process.env.OUT ?? 'previews');
mkdirSync(out, { recursive: true });
const base = `${out}/${m.id}${stepArg ? `-step${stepArg}` : ''}`;
writeFileSync(`${base}.svg`, svg);
execFileSync('sips', ['-s', 'format', 'png', `${base}.svg`, '--out', `${base}.png`], { stdio: 'ignore' });
console.log(`${base}.png  (${old.length + fresh.length} planks, ${m.steps.length} steps)`);
