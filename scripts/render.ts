// Shaded z-buffer render of a model, like the 3/4 view of the app: npx tsx scripts/render.ts <model.ts> <out.png> [azDeg] [elevDeg] [step]
import { unlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Vector3 } from 'three';
import { corners } from '../src/geometry';
const [file, out, azA, elA, stepA] = process.argv.slice(2);
const mod = await import(resolve(file));
const m = mod.default ?? Object.values(mod)[0];
const upTo = stepA ? Number(stepA) : m.steps.length;
const planks = m.steps.slice(0, upTo).flatMap((s: any, i: number) => s.planks.map((p: any) => ({ p, hot: stepA && i === upTo - 1 })));
const az = ((azA ? +azA : 35) * Math.PI) / 180, el = ((elA ? +elA : 28) * Math.PI) / 180;
// camera looks along -dir; dir points from scene to camera (+x side, +z front)
const dir = new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
const right = new Vector3(0, 1, 0).cross(dir).normalize(), up = dir.clone().cross(right).normalize();
const light = new Vector3(0.4, 1, 0.7).normalize();
const W = 900, H = 900;
const zb = new Float32Array(W * H).fill(-Infinity), img = new Uint8Array(W * H * 3).fill(255);
const FACES = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
const all = planks.flatMap(({ p }: any) => corners(p));
const proj = (v: Vector3) => [v.dot(right), -v.dot(up), v.dot(dir)];
const P = all.map(proj);
const [x0, x1] = [Math.min(...P.map((q) => q[0])), Math.max(...P.map((q) => q[0]))];
const [y0, y1] = [Math.min(...P.map((q) => q[1])), Math.max(...P.map((q) => q[1]))];
const k = (W - 60) / Math.max(x1 - x0, y1 - y0);
const scr = (q: number[]) => [30 + (q[0] - x0) * k, 30 + (q[1] - y0) * k, q[2]];
for (const { p, hot } of planks) {
  const c = corners(p);
  for (const f of FACES) {
    const v = f.map((i) => c[i]);
    const n = v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize();
    const ctr = v.reduce((a, b) => a.clone().add(b)).multiplyScalar(0.25);
    const pc = c.reduce((a, b) => a.clone().add(b)).multiplyScalar(1 / 8);
    if (n.dot(ctr.clone().sub(pc)) < 0) n.negate();
    if (n.dot(dir) <= 0) continue;
    const s = 0.45 + 0.55 * Math.max(0, n.dot(light));
    const base = hot ? [255, 122, 92] : [236, 201, 147];
    const col = base.map((b) => Math.round(b * s));
    const q = v.map((x) => scr(proj(x)));
    for (const tri of [[q[0], q[1], q[2]], [q[0], q[2], q[3]]]) {
      const [a, b, d] = tri;
      const minx = Math.max(0, Math.floor(Math.min(a[0], b[0], d[0]))), maxx = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], d[0])));
      const miny = Math.max(0, Math.floor(Math.min(a[1], b[1], d[1]))), maxy = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], d[1])));
      const area = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
      if (Math.abs(area) < 1e-9) continue;
      for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((b[0] - px) * (d[1] - py) - (b[1] - py) * (d[0] - px)) / area;
        const w1 = ((d[0] - px) * (a[1] - py) - (d[1] - py) * (a[0] - px)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * a[2] + w1 * b[2] + w2 * d[2];
        const i = y * W + x;
        if (z <= zb[i]) continue;
        zb[i] = z;
        const edge = Math.min(w0, w1, w2) * Math.abs(area) / Math.max(Math.hypot(b[0]-a[0],b[1]-a[1]), Math.hypot(d[0]-b[0],d[1]-b[1]), Math.hypot(a[0]-d[0],a[1]-d[1]));
        const e = edge < 0.8 && Math.min(w0,w1,w2) === w1 ? 0.55 : 1;
        img.set(col.map((cc) => Math.round(cc * e)), i * 3);
      }
    }
  }
}
const ppm = Buffer.concat([Buffer.from(`P6 ${W} ${H} 255\n`), Buffer.from(img)]);
writeFileSync(out + '.ppm', ppm);
execFileSync('sips', ['-s', 'format', 'png', out + '.ppm', '--out', out], { stdio: 'ignore' });
unlinkSync(out + '.ppm');
console.log(out);
