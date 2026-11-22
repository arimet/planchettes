import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A village church, bell tower to the front (+z). The nave: two walls of standing planks, the gaps
// are tall windows; a ceiling of planks across, then a steep roof of card-house tents (two planks
// leaning on a post of two standing planks), a ridge plank on the posts.
// The tower: standing walls with a door, a floor, a belfry on four corner pillars, and a pointed
// spire leaning on a column (Big Ben's).
const ZT = 32; // front of the nave, back of the tower
const TENTS = 9;
const tz = (i: number) => 0.5 + 3.5 * i; // z of tent i

// nave walls: pairs of standing planks, the gaps between pairs are the windows
const WALL_Z = [0.5, 8.25, 16, 23.75].flatMap((z) => [z, z + 3.25]);
const walls = [1.5, 12.5].flatMap((x) => WALL_Z.map((z) => at('up-z', x, 0, z)));
const plates = [0.5, 11.5].flatMap((x) => [0.5, 16].map((z) => at('flat-z', x, 15, z)));
const ceiling = Array.from({ length: TENTS }, (_, i) => at('flat-x', 0, 16, tz(i)));

const A = (72 * Math.PI) / 180; // roof slope: the top stays 0.4 under the ridge plank
/** Roof plank leaning on the post of tent i; side -1 = left, 1 = right. */
function leg(i: number, side: 1 | -1): Plank {
  const dx = 1.5 + 0.02 + 7.5 * Math.cos(A) + 0.5 * Math.sin(A);
  return { o: 'flat-x', tilt: -side * 72, x: 7.5 + side * dx, y: 17.01 + 7.5 * Math.sin(A) + 0.5 * Math.cos(A), z: tz(i) + 1.5 };
}
const post = (i: number) => [0.5, 1.5].map((d) => at('up-x', 6, 17, tz(i) + d));
const ridge = [0.5, 16].map((z) => at('flat-z', 6, 32, z));

// tower: two storeys of standing walls, the gap in the front wall is the door, then a window
const towerSides = (y: number) => [1, 13].flatMap((x) => [0, 3.25, 6.5, 9.75].map((d) => at('up-z', x, y, ZT + d)));
const towerFront = (y: number) => [0, 3.25, 8.75, 12].map((x) => at('up-x', x, y, ZT + 13));
const B = 32; // belfry floor
const floor = (y: number) => [0, 3, 6, 9, 12].map((d) => at('flat-x', 0, y, ZT + d));
const pillar = (x: number, z: number) => [0, 1, 2].map((d) => at('up-x', x, B, z + d));
const pillars = [[0, ZT + 1], [12, ZT + 1], [0, ZT + 11], [12, ZT + 11]].map(([x, z]) => pillar(x, z));
const belfryTop = [at('flat-x', 0, B + 15, ZT + 1), at('flat-x', 0, B + 15, ZT + 11)];
const belfryFloor = [0, 3, 6, 9, 12].map((x) => at('flat-z', x, B + 16, ZT));

// spire: four planks leaning on a column of three standing planks, and the tip on top
const C = [7.5, ZT + 7.5];
const SLOPE = 75;
function spirePlank(deg: number): Plank {
  const a = (SLOPE * Math.PI) / 180;
  const p: Plank = { o: 'flat-x', tilt: -SLOPE, x: C[0] + 1.52 + 7.5 * Math.cos(a) + 0.5 * Math.sin(a), y: B + 17.01 + 7.5 * Math.sin(a) + 0.5 * Math.cos(a), z: C[1] };
  return spin(p, deg, C[0], C[1]);
}
const column = [-1, 0, 1].map((d) => at('up-x', 6, B + 17, C[1] - 0.5 + d));

const roof: Step[] = [];
for (let i = 0; i < TENTS; i += 3) {
  const ids = [i, i + 1, i + 2].filter((k) => k < TENTS);
  roof.push(
    { planks: ids.flatMap(post), ...(i === 0 && { hint: 'Sur chaque planchette du plafond, deux planchettes debout, collées' }) },
    { planks: ids.flatMap((k) => [leg(k, -1), leg(k, 1)]), ...(i === 0 && { hint: 'Le toit : une planchette penchée de chaque côté, contre elles' }) },
  );
}

const steps: Step[] = [
  { planks: walls.slice(0, 8), hint: 'Le mur de l’église : des planchettes debout deux par deux, les trous sont les fenêtres' },
  { planks: walls.slice(8) },
  { planks: plates, hint: 'Couche-les sur les murs' },
  { planks: ceiling.slice(0, 5), hint: 'Le plafond : des planchettes en travers' },
  { planks: ceiling.slice(5) },
  ...roof,
  { planks: ridge, hint: 'Le faîte, à plat sur les poteaux' },
  { planks: towerSides(0), hint: 'Le clocher, devant l’église' },
  { planks: towerFront(0), hint: 'Laisse un trou au milieu : la porte' },
  { planks: floor(15) },
  { planks: towerSides(16), hint: 'Un étage de plus, pareil' },
  { planks: towerFront(16) },
  { planks: floor(31) },
  { planks: pillars.slice(0, 2).flat(), hint: 'Un pilier de trois planchettes dans chaque coin : les cloches sont au milieu' },
  { planks: pillars.slice(2).flat() },
  { planks: belfryTop },
  { planks: belfryFloor },
  { planks: column, hint: 'Trois planchettes debout, collées, au milieu' },
  { planks: [0, 90, 180, 270].map(spirePlank), hint: 'La flèche s’appuie contre elles' },
  { planks: [at('up-x', 6, B + 32, C[1] - 0.5)], hint: 'La pointe, tout en haut' },
];

export const eglise: Model = { id: 'eglise', name: 'Église', theme: 'maisons', difficulty: 3, steps };
export default eglise;
