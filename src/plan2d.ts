import { corners, type Plank } from './geometry';

const MARGIN = 4;
const LABEL = 2.4; // smallest label size in units
const r = (n: number) => +n.toFixed(2);
type Pt = [number, number];

/** Convex hull (monotone chain), counterclockwise, no duplicate points. */
function hull(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: Pt[]) => {
    const out: Pt[] = [];
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 1e-9) out.pop();
      out.push(q);
    }
    return out.slice(0, -1);
  };
  return [...half(p), ...half([...p].reverse())];
}

/** Strictly inside a convex counterclockwise polygon. */
const inside = (poly: Pt[], x: number, y: number) =>
  poly.every((a, i) => {
    const b = poly[(i + 1) % poly.length];
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) > 1e-6;
  });

export type Gap = { a: Pt; b: Pt; size: number };
const NEAR = 0.75; // closer than this, the planks just touch
const FAR = 16; // beyond a plank's length, the neighbour no longer helps to place it

/**
 * Free space, seen from above, between each new plank and its nearest parallel neighbour
 * on the same level (already placed, or earlier in the step): one gap per plank, none when it touches one.
 * What a child measures with spare planks.
 */
export function gaps(old: Plank[], fresh: Plank[]): Gap[] {
  const foot = (p: Plank) => {
    const c = corners(p);
    const ys = c.map((v) => v.y);
    return { pts: hull(c.map((v) => [v.x, v.z] as Pt)), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  const span = (pts: Pt[], [ux, uy]: Pt) => {
    const d = pts.map(([x, y]) => x * ux + y * uy);
    return [Math.min(...d), Math.max(...d)];
  };
  const placed = old.map(foot);
  const out: Gap[] = [];
  for (const f of fresh.map(foot)) {
    if (f.pts.length === 4) {
      const axes = [0, 1].map((i) => {
        const [dx, dy] = [f.pts[i + 1][0] - f.pts[i][0], f.pts[i + 1][1] - f.pts[i][1]];
        const len = Math.hypot(dx, dy);
        return [dx / len, dy / len] as Pt;
      });
      const peers = placed.filter(
        (c) =>
          c.pts.length === 4 &&
          Math.min(f.y1, c.y1) - Math.max(f.y0, c.y0) > 0.1 &&
          // parallel: its first edge runs along one of our two axes
          axes.some(([ux, uy]) => Math.abs(ux * (c.pts[1][1] - c.pts[0][1]) - uy * (c.pts[1][0] - c.pts[0][0])) < 0.03 * Math.hypot(c.pts[1][0] - c.pts[0][0], c.pts[1][1] - c.pts[0][1])),
      );
      let best: Gap | undefined;
      axes.forEach((along, i) => {
        const across = axes[1 - i];
        const [f0, f1] = span(f.pts, along);
        const [g0, g1] = span(f.pts, across);
        for (const c of peers) {
          const [c0, c1] = span(c.pts, along);
          const [d0, d1] = span(c.pts, across);
          const lo = Math.max(g0, d0);
          const hi = Math.min(g1, d1);
          if (hi - lo < 0.9) continue; // not facing each other
          if (c0 < f1 - 1e-6 && c1 > f0 + 1e-6) continue; // side by side along this axis, no gap
          const [from, to] = c0 >= f1 - 1e-6 ? [f1, c0] : [c1, f0];
          const size = to - from;
          if (size > FAR || (best && best.size <= size)) continue;
          const mid = (lo + hi) / 2;
          const at = (t: number): Pt => [along[0] * t + across[0] * mid, along[1] * t + across[1] * mid];
          best = { a: at(from), b: at(to), size };
        }
      });
      if (best && best.size >= NEAR) out.push(best); // touching its neighbour: nothing to measure
    }
    placed.push(f);
  }
  return out;
}

/** A gap in spare planks: 15 = one lengthwise, 3 = one lying flat, 1 = one on its edge. */
export function gapText(size: number): string {
  let n = Math.round(size);
  const parts: [number, string][] = [];
  for (const [unit, name] of [[15, 'en long'], [3, 'à plat'], [1, 'sur la tranche']] as const) {
    const k = Math.floor(n / unit);
    if (k) parts.push([k, name]);
    n -= k * unit;
  }
  if (parts.length === 1) return `${parts[0][0]} planchette${parts[0][0] > 1 ? 's' : ''} ${parts[0][1]}`;
  return parts.map(([k, name]) => `${k} ${name}`).join(' + ');
}

/** The different gaps of a step, in placing order: the plan marks them A, B, C… */
export const gapKeys = (marks: Gap[]) => [...new Set(marks.map((g) => gapText(g.size)))];

/**
 * Orthographic plan. top = seen from above (x → right, z → down);
 * front = seen from +z (x → right, y → up), same side as the 3D camera starts.
 * Fresh planks carry their placing order.
 */
export function planSvg(old: Plank[], fresh: Plank[], view: 'top' | 'front'): string {
  const all = [...old.map((p) => ({ p, fresh: 0 })), ...fresh.map((p, i) => ({ p, fresh: i + 1 }))];
  const rects = all.map(({ p, fresh }) => {
    const c = corners(p);
    const pts = hull(c.map((v) => (view === 'top' ? [v.x, v.z] : [v.x, -v.y]) as Pt));
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    return {
      pts,
      x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys),
      cx: xs.reduce((a, b) => a + b) / xs.length, cy: ys.reduce((a, b) => a + b) / ys.length,
      depth: Math.max(...c.map((v) => (view === 'top' ? v.y : v.z))),
      fresh,
    };
  });
  const level = Math.max(...(fresh.length ? fresh : old).map((p) => Math.max(...corners(p).map((v) => v.y))));
  // framed on this step's planks (with some context around), so numbers stay readable on big models
  const focus = rects.filter((q) => q.fresh).length ? rects.filter((q) => q.fresh) : rects;
  const marks = view === 'top' ? gaps(old, fresh) : [];
  const xs = [...focus.flatMap((q) => [q.x0, q.x1]), ...marks.flatMap((g) => [g.a[0], g.b[0]])];
  const ys = [...focus.flatMap((q) => [q.y0, q.y1]), ...marks.flatMap((g) => [g.a[1], g.b[1]])];
  const minX = Math.min(...xs) - MARGIN;
  const minY = Math.min(...ys) - MARGIN;
  const w = Math.max(...xs) + MARGIN - minX;
  const h = Math.max(...ys) + MARGIN - minY;
  const label = Math.max(LABEL, Math.max(w, h) / 22);
  // painter's order: lower (top view) or farther (front view) first
  const body = [...rects]
    .sort((a, b) => a.depth - b.depth)
    .map((q) => {
      const faded = view === 'top' && !q.fresh && q.depth < level - 1e-6 ? ' opacity="0.35"' : '';
      return `<polygon class="${q.fresh ? 'fresh' : 'old'}" points="${q.pts.map(([x, y]) => `${r(x)},${r(y)}`).join(' ')}"${faded}/>`;
    });
  const labels: { x: number; y: number; text: string }[] = [];
  for (const q of rects) {
    if (!q.fresh) continue;
    const x = q.cx;
    const y = q.cy;
    // hidden under a plank drawn on top of it: the child cannot see it from this side
    if (rects.some((o) => o.depth > q.depth + 1e-6 && inside(o.pts, x, y))) continue;
    // too close to another label (thin planks side by side): one merged label
    const near = labels.find((l) => Math.hypot(l.x - x, l.y - y) < label);
    if (near) near.text += `·${q.fresh}`;
    else labels.push({ x, y, text: String(q.fresh) });
  }
  const texts = labels.map((l) => `<text class="order" x="${r(l.x)}" y="${r(l.y)}" font-size="${r(label)}" stroke-width="${r(label / 4.5)}">${l.text}</text>`);
  // the gap to the neighbour: a line between the two planks, and a letter explained in the legend
  const keys = gapKeys(marks);
  const seen = new Set<string>();
  const rules = marks.map(({ a, b, size }) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const [nx, ny] = [(-(b[1] - a[1]) / len) * label * 0.3, ((b[0] - a[0]) / len) * label * 0.3];
    const tick = ([x, y]: Pt) => `M${r(x - nx)} ${r(y - ny)}L${r(x + nx)} ${r(y + ny)}`;
    const line = `<path class="gap" stroke-width="${r(label / 8)}" d="M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}${tick(a)}${tick(b)}"/>`;
    const text = gapText(size);
    if (seen.has(text)) return line; // same gap again: the line is enough
    seen.add(text);
    const [x, y] = [r((a[0] + b[0]) / 2), r((a[1] + b[1]) / 2)];
    return `${line}<circle class="gap-dot" cx="${x}" cy="${y}" r="${r(label * 0.5)}"/><text class="gap-key" x="${x}" y="${y}" font-size="${r(label * 0.7)}">${String.fromCharCode(65 + keys.indexOf(text))}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" class="plan" overflow="hidden" viewBox="${r(minX)} ${r(minY)} ${r(w)} ${r(h)}">${body.join('')}${rules.join('')}${texts.join('')}</svg>`;
}
