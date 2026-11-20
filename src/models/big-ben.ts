import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Big Ben. A square shaft of standing planks with window slots, tied every storey by a pinwheel of
// 4 flat planks (18 wide, so it juts out like a cornice). The clock stage is wider than the shaft:
// on each side a square frame (two thin posts between two flat planks) around a recessed dial.
// Then a belfry on four corner pillars, and a steep pointed roof leaning on a column, with a spire.
const C = 10; // tower axis (x = z = C)
const SHAFT = 3; // storeys of the shaft

/** The 4 sides of the tower: the front piece turned a quarter turn at a time. */
const around = (front: Plank[]): Plank[] => [0, 1, 2, 3].flatMap((k) => front.map((p) => (k ? spin(p, -90 * k, C, C) : p)));

/** Shaft wall: 4 standing planks per side, 1 apart (the window slots). */
const walls = (y: number): Plank[] => around([0, 4, 8, 12].map((d) => at('up-x', C - 8 + d, y, C - 8)));

/** Pinwheel of 4 flat planks around an 18 × 18 square. */
const ring = (y: number): Plank[] => around([at('flat-x', C - 9, y, C - 9)]);

/** Clock frame posts at both ends of each ring plank, and the dial: 4 standing planks set back. */
const posts = (y: number): Plank[] => around([at('up-z', C - 9, y, C - 9), at('up-z', C + 5, y, C - 9)]);
const dial = (y: number): Plank[] => around([0, 3, 6, 9].map((d) => at('up-x', C - 7.5 + d, y, C - 7.5)));

/** Floor of n flat planks side by side, centered on the axis. */
const floor = (o: 'flat-x' | 'flat-z', zs: number[], y: number): Plank[] =>
  zs.map((d) => (o === 'flat-x' ? at(o, C - 7.5, y, C + d) : at(o, C + d, y, C - 7.5)));
const FULL = [-1.5, -4.5, 1.5, -7.5, 4.5];

/** Belfry pillar: three standing planks pressed together, in the corner (sx, sz). */
const pillar = (sx: number, sz: number, y: number): Plank[] => {
  const x = sx < 0 ? C - 7.5 : C + 4.5, z = sz < 0 ? C - 7.5 : C + 4.5;
  return [0, 1, 2].map((d) => at('up-x', x, y, z + d));
};

/** Roof plank leaning on the face x = C + 1.5 of the column, foot on y, turned by deg. */
const SLOPE = 78;
const roofPlank = (y: number, deg: number): Plank => {
  const a = (SLOPE * Math.PI) / 180;
  return spin({ o: 'flat-x', tilt: -SLOPE, x: C + 1.5 + 0.02 + 7.5 * Math.cos(a) + 0.5 * Math.sin(a), y: y + 0.01 + 7.5 * Math.sin(a) + 0.5 * Math.cos(a), z: C }, deg, C, C);
};

const steps: Step[] = [];
let y = 0;
for (let s = 0; s < SHAFT; s++) {
  const w = walls(y);
  steps.push(
    { planks: w.slice(0, 8), ...(s === 0 && { hint: 'Debout, en carré : laisse un doigt entre deux planchettes' }) },
    { planks: w.slice(8) },
  );
  y += 15;
  if (s < SHAFT - 1) steps.push({ planks: ring(y), ...(s === 0 && { hint: 'Quatre planchettes en moulinet : elles dépassent un peu' }) });
  else steps.push({ planks: ring(y), hint: 'L’horloge commence ici' });
  y += 1;
}
const d = dial(y);
steps.push(
  { planks: posts(y), hint: 'Un poteau debout à chaque bout, la tranche vers l’extérieur' },
  { planks: d.slice(0, 8), hint: 'Le cadran : un peu en retrait, entre les poteaux' },
  { planks: d.slice(8) },
);
y += 15;
steps.push({ planks: ring(y) });
y += 1;
steps.push({ planks: floor('flat-x', FULL, y), hint: 'Le plancher du clocher' });
y += 1;
const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
steps.push(
  { planks: corners.slice(0, 2).flatMap(([sx, sz]) => pillar(sx, sz, y)), hint: 'Le clocher : un pilier de trois planchettes dans chaque coin' },
  { planks: corners.slice(2).flatMap(([sx, sz]) => pillar(sx, sz, y)) },
);
y += 15;
steps.push({ planks: floor('flat-x', [-7.5, 4.5], y) });
steps.push({ planks: floor('flat-z', FULL, y + 1) });
y += 2;
steps.push(
  { planks: [-1, 0, 1].map((dz) => at('up-x', C - 1.5, y, C - 0.5 + dz)), hint: 'Trois planchettes debout, collées, au milieu' },
  { planks: [0, 90, 180, 270].map((deg) => roofPlank(y, deg)), hint: 'Le toit pointu s’appuie contre elles' },
  { planks: [at('up-x', C - 1.5, y + 15, C - 0.5)], hint: 'La flèche, tout en haut' },
);

export const bigBen: Model = { id: 'big-ben', name: 'Big Ben', theme: 'monuments', difficulty: 2, steps };
export default bigBen;
