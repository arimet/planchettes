import { at, size, type Orientation, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A lesson: three staircases built one after another, from the easiest to the cleverest.
// All of them climb toward -x (to the left), so the camera on the right sees every tread.
// u = distance from the foot of a staircase whose first step starts at x = foot.
const from = (foot: number) => (o: Orientation, u: number, y: number, z: number): Plank => at(o, foot - u - size(o)[0], y, z);
const range = (n: number) => Array.from({ length: Math.max(0, n) }, (_, i) => i);

// 1. Solid: flat layers, each one step shorter. Rise 1, going 3.
const N = 7;
const s1 = from(3 * N);
const solid: Step[] = range(N).map((k) => ({ planks: range(N - k).map((j) => s1('flat-z', 3 * (N - 1 - j), k, 0)) }));
solid[0].hint = 'Escalier plein : chaque étage est plus court d’une marche';
solid[1].hint = 'La planchette de devant reste libre : c’est la marche';

// 2. Light: a level is two planks on edge with flat planks across. The front flat plank is the tread,
// the two others carry the next level, which starts one step further. Rise 4, going 3.
// Three levels lean without falling; the fourth is the landing, with two posts under its far end.
const s2 = from(52);
const RAILS = [1.5, 12.5];
const rails = (k: number): Step => ({ planks: RAILS.map((z) => s2('edge-x', 3 * k, 4 * k, z)) });
const light: Step[] = range(3).flatMap((k) => [
  rails(k),
  { planks: [3 * k, 3 * k + 3.5, 3 * k + 12].map((u) => s2('flat-z', u, 4 * k + 3, 0)) },
]);
light.push(rails(3));
light.push({ planks: [4, 8].map((z) => s2('up-z', 22, 0, z)), hint: 'Deux poteaux debout sous le bout du palier' });
light.push({ planks: [21, 18, 15, 12, 9].map((u) => s2('flat-z', u, 15, 0)), hint: 'Le palier : cinq planchettes côte à côte' });
light[0].hint = 'Escalier léger : deux planchettes sur la tranche portent les marches';
light[1].hint = 'Trois planchettes en travers : la marche devant, une juste derrière, une au fond';
light[2].hint = 'L’étage suivant démarre juste derrière la marche';

// 3. Turning: a solid flight of three steps, a square landing with crossed layers,
// then a second solid flight that leaves sideways, behind the landing.
const s3 = from(83);
const X = 59; // left side of the landing
const landing = (k: number): Plank[] =>
  k % 2 ? [0, 3, 6, 9, 12].map((z) => at('flat-x', X, k, z)) : [21, 18, 15, 12, 9].map((u) => s3('flat-z', u, k, 0));
const turning: Step[] = [
  ...range(4).map((k) => ({ planks: [...landing(k), ...range(3 - k).map((j) => s3('flat-z', 3 * (2 - j), k, 0))] })),
  ...range(7).map((k) => ({ planks: [-9, -6, -3].slice(0, 7 - k).map((z) => at('flat-x', X, k, z)) })),
];
turning[0].hint = 'Escalier qui tourne : trois marches et un palier carré';
turning[1].hint = 'Le palier croise ses étages pour être solide';
turning[4].hint = 'On repart de côté : un deuxième escalier, collé derrière le palier';
turning[8].hint = 'Plus haut que le palier : chaque étage a une marche de moins';

export const escaliers: Model = { id: 'escaliers', name: 'Escaliers', theme: 'originaux', difficulty: 2, steps: [...solid, ...light, ...turning] };
export default escaliers;
