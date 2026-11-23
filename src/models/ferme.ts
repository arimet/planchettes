import { at, spin, type Plank } from '../geometry';
import { chunk, type Model, type Step } from '../model';

// A farmyard: separate small buildings that do not touch, built one at a time from the back.
// - Barn (back): walls of standing planks, a big doorway in the gable, and the chalet's roof:
//   a ceiling, a stepped attic, 30° roof planks standing on the ceiling and leaning on the steps.
// - Silo (back right): two rings of standing planks, a floor between them, a stepped cap.
// - Farmhouse (front left): a low block of front-to-back planks with a door and a window left
//   open. Its ceiling planks slide left and right to carry wide eaves; the 50° roof planks stand
//   on the eaves and lean on a ridge stack.
// - Paddock (front): planks on edge, a gate left ajar, a trough inside. A ploughed field beside it.

const move = (planks: Plank[], dx: number, dz: number): Plank[] => planks.map((p) => ({ ...p, x: p.x + dx, z: p.z + dz }));
const rad = (deg: number) => (deg * Math.PI) / 180;
const five = [0, 1, 2, 3, 4];

/** Roof plank whose lower face runs from (foot, top) up at `deg`; side -1 mirrors it around x = mid. */
function roofPlank(foot: number, top: number, deg: number, mid: number, z: number, side: 1 | -1): Plank {
  const t = rad(deg);
  const x = foot + 7.5 * Math.cos(t) - 0.5 * Math.sin(t);
  return { o: 'flat-x', tilt: side * deg, x: side === 1 ? x : 2 * mid - x, y: top + 7.5 * Math.sin(t) + 0.5 * Math.cos(t) + 0.02, z: z + 1.5 };
}

// ---------- barn: 30 wide (x), 15 deep (z), doorway from x 10.5 to 19.5 ----------
const POSTS = [0, 3.75, 7.5, 19.5, 23.25, 27];
const gableWall = (z: number) => POSTS.map((x) => at('up-x', x, 0, z));
const sideWall = (x: number) => [2.5, 6, 9.5].map((z) => at('up-z', x, 0, z));
// on the posts: a plate over each pair of side posts, a lintel over each doorway
const plates = [0, 3.75, 23.25, 27].map((x) => at('flat-z', x, 15, 0));
const lintels = [at('flat-x', 7.5, 15, 12), at('flat-x', 7.5, 15, 0)];
const ceiling = Array.from({ length: 10 }, (_, i) => at('flat-z', 3 * i, 16, 0));
const TOP = 17;
const TAN = Math.tan(rad(30));
const RIDGE = 7; // attic rows; the last one is the ridge at x 13.5
const FOOT = 13.5 - RIDGE / TAN; // x where the left roof plank stands on the ceiling
/** Symmetric row of front-to-back planks from x = a to 30 - a. */
function attic(a: number, y: number): Plank[] {
  const n = Math.floor((30 - 2 * a) / 3 + 1e-6);
  const xs: number[] = [];
  for (let i = 0; i < Math.floor(n / 2); i++) xs.push(a + 3 * i, 27 - a - 3 * i);
  if (n % 2) xs.push(13.5);
  return xs.sort((p, q) => p - q).map((x) => at('flat-z', x, y, 0));
}
const barn: Step[] = [
  { planks: gableWall(13), hint: 'On commence par la grange : six planchettes debout, un grand trou au milieu' },
  { planks: [...sideWall(1), ...sideWall(28)], hint: 'Les murs des côtés' },
  { planks: gableWall(1), hint: 'Devant, pareil qu’au fond : le grand trou, c’est la porte' },
  { planks: [...plates, ...lintels], hint: 'Couche-les sur les murs ; une au-dessus de chaque porte' },
  { planks: ceiling.slice(0, 5), hint: 'Le plafond' },
  { planks: ceiling.slice(5) },
  ...Array.from({ length: RIDGE }, (_, j) => ({
    planks: attic(FOOT + (j + 1) / TAN, TOP + j),
    ...(j === 0 && { hint: 'Le grenier : chaque étage rentre d’un cran' }),
  })),
  { planks: five.map((i) => roofPlank(FOOT, TOP, 30, 15, -0.2 + 3.1 * i, 1)), hint: 'Le toit : le pied sur le plafond, le dos contre les marches' },
  { planks: five.map((i) => roofPlank(FOOT, TOP, 30, 15, -0.2 + 3.1 * i, -1)) },
];

// ---------- silo: rings of twelve standing planks around (0, 0) ----------
const TURN = 35; // floors face the camera: their corners hide behind the round wall
const ring = (y: number): Plank[] => Array.from({ length: 12 }, (_, k) => spin(at('up-x', -1.5, y, 5.8), k * 30, 0, 0));
/** n flat planks side by side, centred on the axis, from the middle outward. */
const disc = (n: number, y: number, o: 'flat-x' | 'flat-z', turn = TURN): Plank[] =>
  Array.from({ length: n }, (_, i) => 3 * i - 1.5 * n)
    .sort((a, b) => Math.abs(a + 1.5) - Math.abs(b + 1.5))
    .map((d) => spin(o === 'flat-x' ? at(o, -7.5, y, d) : at(o, d, y, -7.5), turn, 0, 0));
const silo: Step[] = [
  ...chunk(ring(0), 6).map((s, i) => (i ? s : { ...s, hint: 'Maintenant le silo, tout rond : douze planchettes debout, en cercle' })),
  { planks: disc(5, 15, 'flat-x'), hint: 'Un plancher posé sur le cercle' },
  ...chunk(ring(16), 6).map((s, i) => (i ? s : { ...s, hint: 'Un deuxième cercle, juste au-dessus du premier' })),
  { planks: disc(5, 31, 'flat-x'), hint: 'Encore un plancher' },
  { planks: disc(3, 32, 'flat-x', TURN + 45), hint: 'Le chapeau du silo : trois en biais, trois en croix par-dessus, et une tout en haut' },
  { planks: disc(3, 33, 'flat-z', TURN + 45) },
  { planks: disc(1, 34, 'flat-x') },
];

// ---------- farmhouse: block 15 × 15, door at x 3..6, window at x 9..12 ----------
const WALL = 7;
const houseRow = (y: number) => (y < 3 ? [0, 6, 9, 12] : [0, 6, 12]).map((x) => at('flat-z', x, y, 0));
const comb = five.map((i) => at('flat-x', i % 2 ? 3 : -3, WALL, 3 * i));
const lid = five.map((i) => at('flat-x', 0, WALL + 1, 3 * i));
const houseEaves = [at('flat-z', -3, WALL + 1, 0), at('flat-z', 15, WALL + 1, 0)];
const HTOP = WALL + 2;
const gableRow = (y: number) => [at('flat-x', 0, y, 12), at('flat-x', 0, y, 0)];
const STACK = 8; // ridge stack on the two gable rows
const HFOOT = -2.3;
const HDEG = (Math.atan((2 + STACK) / (6 - HFOOT)) * 180) / Math.PI; // touches the stack corner (x 6)
const house: Step[] = [
  ...Array.from({ length: WALL }, (_, y) => ({
    planks: houseRow(y),
    ...(y === 0 && { hint: 'La maison du fermier : quatre planchettes, le trou c’est la porte' }),
    ...(y === 3 && { hint: 'Plus que trois : le deuxième trou, c’est la fenêtre' }),
  })),
  { planks: comb, hint: 'Le plafond : une qui dépasse à gauche, une qui dépasse à droite…' },
  { planks: [...lid, ...houseEaves], hint: 'Cinq bien au milieu, et une de chaque côté sur les bouts qui dépassent' },
  { planks: gableRow(HTOP), hint: 'Une devant, une derrière' },
  { planks: gableRow(HTOP + 1) },
  ...Array.from({ length: STACK }, (_, j) => ({
    planks: [at('flat-z', 6, HTOP + 2 + j, 0)],
    ...(j === 0 && { hint: 'Une pile bien droite au milieu : huit planchettes' }),
  })),
  // left and right in turn: the pushes on the stack cancel
  { planks: [0, 1, 2, 3].flatMap((i) => ([1, -1] as const).map((s) => roofPlank(HFOOT, HTOP, HDEG, 7.5, -0.2 + 3.1 * i, s))), hint: 'Le toit : une à gauche, une à droite, le pied au bord et le dos contre la pile' },
  { planks: ([1, -1] as const).map((s) => roofPlank(HFOOT, HTOP, HDEG, 7.5, -0.2 + 3.1 * 4, s)) },
];

// ---------- paddock: 32 × 18, planks on edge ----------
const fence: Plank[] = [
  at('edge-x', 1, 0, 0), at('edge-x', 16.5, 0, 0),
  at('edge-z', 0, 0, 1.5), at('edge-z', 31.5, 0, 1.5),
  at('edge-x', 1, 0, 17),
  spin(at('edge-x', 16.5, 0, 17), 30, 31.5, 17.5), // the gate, ajar
];
const trough = [at('flat-x', 6, 0, 6), at('edge-x', 6, 0, 4.7), at('edge-x', 6, 0, 9.3)];
const paddock: Step[] = [
  { planks: fence, hint: 'La barrière pour les animaux : sur la tranche, et la dernière en biais, c’est le portillon ouvert' },
  { planks: trough, hint: 'L’abreuvoir : une à plat, une sur la tranche de chaque côté' },
];

// ---------- field: furrows ----------
const field: Step[] = [{ planks: five.map((i) => at('flat-x', 0, 0, 5 * i)), hint: 'Le champ : cinq sillons bien rangés' }];

const place = (steps: Step[], dx: number, dz: number): Step[] => steps.map((s) => ({ ...s, planks: move(s.planks, dx, dz) }));

export const ferme: Model = {
  id: 'ferme',
  name: 'Ferme',
  theme: 'maisons',
  difficulty: 3,
  steps: [...place(barn, 0, 0), ...place(silo, 44, 8), ...place(house, -17, 21), ...place(paddock, 8, 22), ...place(field, 45, 21)],
};

export default ferme;
