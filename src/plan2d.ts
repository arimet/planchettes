import { box, type Plank } from './geometry';

const MARGIN = 2;
const LABEL = 2.4; // label size in units, matches .order font-size
const r = (n: number) => +n.toFixed(2);

/**
 * Orthographic plan. top = seen from above (x → right, z → down);
 * front = seen from +z (x → right, y → up), same side as the 3D camera starts.
 * Fresh planks carry their placing order.
 */
export function planSvg(old: Plank[], fresh: Plank[], view: 'top' | 'front'): string {
  const all = [...old.map((p) => ({ p, fresh: 0 })), ...fresh.map((p, i) => ({ p, fresh: i + 1 }))];
  const rects = all.map(({ p, fresh }) => {
    const { min, max } = box(p);
    return view === 'top'
      ? { x0: min[0], x1: max[0], y0: min[2], y1: max[2], depth: max[1], fresh }
      : { x0: min[0], x1: max[0], y0: -max[1], y1: -min[1], depth: max[2], fresh };
  });
  const level = Math.max(...(fresh.length ? fresh : old).map((p) => box(p).max[1]));
  const minX = Math.min(...rects.map((q) => q.x0)) - MARGIN;
  const minY = Math.min(...rects.map((q) => q.y0)) - MARGIN;
  const w = Math.max(...rects.map((q) => q.x1)) + MARGIN - minX;
  const h = Math.max(...rects.map((q) => q.y1)) + MARGIN - minY;

  // painter's order: lower (top view) or farther (front view) first
  const body = [...rects]
    .sort((a, b) => a.depth - b.depth)
    .map((q) => {
      const faded = view === 'top' && !q.fresh && q.depth < level - 1e-6 ? ' opacity="0.35"' : '';
      return `<rect class="${q.fresh ? 'fresh' : 'old'}" x="${r(q.x0)}" y="${r(q.y0)}" width="${r(q.x1 - q.x0)}" height="${r(q.y1 - q.y0)}"${faded}/>`;
    });
  const labels: { x: number; y: number; text: string }[] = [];
  for (const q of rects) {
    if (!q.fresh) continue;
    const x = (q.x0 + q.x1) / 2;
    const y = (q.y0 + q.y1) / 2;
    // hidden under a plank drawn on top of it: the child cannot see it from this side
    if (rects.some((o) => o.depth > q.depth + 1e-6 && o.x0 < x && x < o.x1 && o.y0 < y && y < o.y1)) continue;
    // too close to another label (thin planks side by side): one merged label
    const near = labels.find((l) => Math.hypot(l.x - x, l.y - y) < LABEL);
    if (near) near.text += `·${q.fresh}`;
    else labels.push({ x, y, text: String(q.fresh) });
  }
  const texts = labels.map((l) => `<text class="order" x="${r(l.x)}" y="${r(l.y)}">${l.text}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="plan" viewBox="${r(minX)} ${r(minY)} ${r(w)} ${r(h)}">${body.join('')}${texts.join('')}</svg>`;
}
