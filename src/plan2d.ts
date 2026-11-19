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
  const minX = Math.min(...focus.map((q) => q.x0)) - MARGIN;
  const minY = Math.min(...focus.map((q) => q.y0)) - MARGIN;
  const w = Math.max(...focus.map((q) => q.x1)) + MARGIN - minX;
  const h = Math.max(...focus.map((q) => q.y1)) + MARGIN - minY;
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
  return `<svg xmlns="http://www.w3.org/2000/svg" class="plan" overflow="hidden" viewBox="${r(minX)} ${r(minY)} ${r(w)} ${r(h)}">${body.join('')}${texts.join('')}</svg>`;
}
