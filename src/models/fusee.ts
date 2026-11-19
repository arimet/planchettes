import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A round body of standing planks (3 barrels of 16, tied by flat square rings), 4 stepped fins
// that pass through gaps at the foot of the bottom barrel, and a pointed nose: 4 planks leaning
// against a fat post of 3 standing planks that pokes out at the top. Centered on (0, 0).
const R = 8.4; // radius of the barrel (plank middles)
const STAVE = 22.5; // degrees between two staves
const FIN0 = 10.5; // spin angle of the first fin gap
const FIN_LAYERS = 15;
const four = (p: Plank): Plank[] => [0, 90, 180, 270].map((d) => spin(p, d, 0, 0));

// one fin layer: 4 flat planks, each a step closer to the middle than the one below
const fins = (k: number): Plank[] => four(at('flat-x', (9 * (FIN_LAYERS - 1 - k)) / (FIN_LAYERS - 1), k, -3));

const barrel = (y: number, gaps: boolean): Plank[] =>
  Array.from({ length: 16 }, (_, j) => j)
    .filter((j) => !gaps || j % 4 !== 0)
    .map((j) => spin({ x: R, y: y + 7.5, z: 0, o: 'up-z' }, FIN0 + j * STAVE, 0, 0));

const ring = (y: number): Plank[] => [at('flat-x', -9, y, -9), at('flat-z', 6, y, -9), at('flat-x', -6, y, 6), at('flat-z', -9, y, -6)];

// a nose plank leaning from the top ring (outer foot at x = FOOT) onto the post face (x = 1.5)
const FOOT = 8.1;
const nose = (y: number): Plank[] => {
  const a = Math.acos((FOOT - 1.5) / 15);
  const [ux, uy, nx, ny] = [-Math.cos(a), Math.sin(a), Math.sin(a), Math.cos(a)];
  return four({ x: FOOT + 7.5 * ux + 0.5 * nx, y: y + 7.5 * uy + 0.5 * ny, z: 0, o: 'flat-x', tilt: (-a * 180) / Math.PI });
};

const TOP = 47; // the third ring
const steps: Step[] = [
  ...Array.from({ length: FIN_LAYERS }, (_, k) => ({
    planks: fins(k),
    ...(k === 0 && { hint: '4 ailerons en moulinet, chacun le long d’une ligne' }),
    ...(k === 1 && { hint: 'Chaque étage recule d’un cran vers le milieu' }),
  })),
  ...[0, 1, 2].flatMap((t) => {
    const staves = barrel(t * 16, t === 0);
    const per = t === 0 ? 4 : 8;
    return [
      ...Array.from({ length: staves.length / per }, (_, i) => ({
        planks: staves.slice(i * per, (i + 1) * per),
        ...(t === 0 && i === 0 && { hint: 'Debout en rond, en laissant passer les ailerons' }),
      })),
      { planks: ring(t * 16 + 15), ...(t === 0 && { hint: 'Un carré couché pour serrer le rond' }) },
    ];
  }),
  { planks: [0, 1, 2, 3, 4].map((i) => at('flat-x', -7.5, TOP + 1, -7.5 + 3 * i)), hint: 'Un plancher pour fermer le haut' },
  { planks: [-1.5, -0.5, 0.5].map((z) => at('up-x', -1.5, TOP + 2, z)), hint: 'Trois planchettes debout, collées : le mât' },
  { planks: nose(TOP + 1), hint: 'Penche-les contre le mât pour faire la pointe' },
];

export const fusee: Model = { id: 'fusee', name: 'Fusée', theme: 'originaux', difficulty: 2, steps };
export default fusee;
