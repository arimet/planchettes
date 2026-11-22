import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Parthenon, front facing +z: 6 columns across, 10 along the sides. Everything runs in rows of
// flat planks around a rectangle (column lines at x = ±14, z = ±26): front and back rows full width,
// side rows between them. Stylobate: two layers with an outer row for the step. Columns: two
// standing planks pressed together, three on each side-row plank so none stands on a joint. Then
// the entablature (flat, a frieze of planks on edge in pairs, a flat cornice) and on each end a
// pediment: two flat planks of steps, and two leaning planks for the slopes of the roof.
const X = 14; // side column lines
const Z = 26; // front and back column lines
const FRONT = 6;

const sym = (p: Plank): Plank[] => [p, { ...p, z: -p.z }]; // front and back
const mx = (p: Plank): Plank => ({ ...p, x: -p.x, ...(p.tilt && { tilt: -p.tilt }) });

/** n planks along an axis from a to b, equal gaps. */
function row(o: 'flat-x' | 'flat-z' | 'edge-x' | 'edge-z', a: number, b: number, y: number, c: number): Plank[] {
  const n = Math.round((b - a + 0.5) / 15.5);
  const g = n > 1 ? (b - a - 15 * n) / (n - 1) : 0;
  return Array.from({ length: n }, (_, i) => {
    const s = a + i * (15 + g);
    return o.endsWith('-x') ? at(o, s, y, c) : at(o, c, y, s);
  });
}
/** Front and back rows (full width), band d (outward offset of the band's inner edge from the line). */
const ends = (o: 'flat-x' | 'edge-x', y: number, d: number, half = X + 1.25) => row(o, -half, half, y, Z + d).flatMap(sym);
/** Side rows between the front and back rows. */
const SIDE = [-Z + 2, Z - 2];
const sides = (o: 'flat-z' | 'edge-z', y: number, d: number, from = SIDE[0], to = SIDE[1]) =>
  row(o, from, to, y, X + d).flatMap((p) => [p, mx(p)]);

// stylobate
const base = (y: number) => [ends('flat-x', y, -1.5), sides('flat-z', y, -1.5)];
const outerSides = sides('flat-z', 0, 2, -Z - 5, Z + 5);
const outerEnds = ends('flat-x', 0, 2);

// columns, standing on the top layer (y = 2)
const frontCols = Array.from({ length: FRONT }, (_, i) => -X + 0.5 + (i * (2 * X - 1)) / (FRONT - 1));
const endColumn = (x: number) => [x - 1, x].flatMap((xx) => sym(at('up-z', xx, 2, Z - 1.5)));
const sideCols = row('flat-z', SIDE[0], SIDE[1], 0, 0).flatMap((p) => [2, 7.5, 13].map((d) => p.z - 7.5 + d));
const sideColumn = (z: number) => [z - 1, z].flatMap((zz) => [at('up-x', X - 1.5, 2, zz), mx(at('up-x', X - 1.5, 2, zz))]);

// entablature
const TOP = 17;
const frieze = (y: number) => [...[-1, 0].flatMap((d) => ends('edge-x', y, d))];
const friezeSides = (y: number) => [-0.5, 0.5].flatMap((d) => sides('edge-z', y, d - 0.5));

// pediment: two flat planks with a gap, two in the middle, two leaning planks
const P = TOP + 5; // on the cornice
const SLOPE = 15.5;
const rake = (): Plank => {
  const t = (SLOPE * Math.PI) / 180;
  const fx = -7.5 - 2 / Math.tan(t); // foot, resting on the first layer
  return { o: 'flat-x', tilt: SLOPE, x: fx + 7.5 * Math.cos(t) - 0.5 * Math.sin(t), y: P + 1.01 + 7.5 * Math.sin(t) + 0.5 * Math.cos(t), z: Z };
};

const chunk8 = (ps: Plank[], hint?: string): Step[] =>
  Array.from({ length: Math.ceil(ps.length / 8) }, (_, i) => ({ planks: ps.slice(8 * i, 8 * i + 8), ...(i === 0 && hint && { hint }) }));

const [b0Ends, b0Sides] = base(0);
const [b1Ends, b1Sides] = base(1);
const steps: Step[] = [
  { planks: b0Ends, hint: 'Le socle : devant et derrière' },
  { planks: b0Sides, hint: 'Les côtés, entre les deux' },
  { planks: outerSides, hint: 'Une rangée de plus dehors : la marche' },
  { planks: outerEnds },
  { planks: b1Ends, hint: 'Deuxième étage du socle, juste au-dessus' },
  { planks: b1Sides },
  ...chunk8(frontCols.slice(0, 3).flatMap(endColumn), 'Colonnes : deux debout, collées'),
  ...chunk8(frontCols.slice(3).flatMap(endColumn)),
  ...chunk8(sideCols.slice(0, 4).flatMap(sideColumn), 'Les côtés : jamais sur une fente du socle'),
  ...chunk8(sideCols.slice(4).flatMap(sideColumn)),
  { planks: ends('flat-x', TOP, -1.5), hint: 'Couchées sur les colonnes' },
  { planks: sides('flat-z', TOP, -1.5) },
  { planks: frieze(TOP + 1), hint: 'Sur la tranche, deux par deux' },
  ...chunk8(friezeSides(TOP + 1)),
  { planks: ends('flat-x', TOP + 4, -1.5), hint: 'Couchées par-dessus, tout autour' },
  { planks: sides('flat-z', TOP + 4, -1.5) },
  { planks: [-15.75, 0.75].flatMap((x) => sym(at('flat-x', x, P, Z - 1.5))), hint: 'Le fronton : la base du triangle' },
  { planks: sym(at('flat-x', -7.5, P + 1, Z - 1.5)) },
  { planks: sym(at('flat-x', -7.5, P + 2, Z - 1.5)) },
  { planks: [rake(), mx(rake())].flatMap(sym), hint: 'Penchées, appuyées sur les marches du triangle' },
];

export const parthenon: Model = { id: 'parthenon', name: 'Parthénon', theme: 'monuments', difficulty: 2, steps };
export default parthenon;
