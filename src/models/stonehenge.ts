import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Stonehenge. Every standing stone is six standing planks pressed together (6 wide, 3 thick),
// built facing +z and turned around the center. Outer ring: 10 stones, flat lintels end to end on
// the far side; the near side, facing the camera, has lost stones, now lying in the grass. Inside,
// a horseshoe of 5 trilithons (two stones, a thick lintel: a flat plank and a plank on edge) opening
// towards the camera, taller than the ring. The altar stone lies in the middle.
const R = 27; // outer ring radius
const r = 17; // horseshoe radius
const N = 10;
const A = 360 / N;
const AXIS = 216; // the horseshoe opens towards the camera, at 36°

const turn = (ps: Plank[], deg: number) => ps.map((p) => spin(p, deg, 0, 0));
/** A stone at radius rad, tangential offset dx: 2 × 3 standing planks. */
const stone = (rad: number, dx = 0): Plank[] =>
  [rad - 1.5, rad - 0.5, rad + 0.5].flatMap((z) => [-3, 0].map((x) => at('up-x', dx + x, 0, z)));
/** A fallen stone lying on the grass. */
const fallen = (rad: number, dx = 0): Plank[] => [rad - 3.25, rad + 0.25].map((z) => at('flat-x', dx - 7.5, 0, z));

const ring = (k: number) => turn(stone(R), (k + 0.5) * A);
const lintel = (k: number) => turn([at('flat-x', -7.5, 15, R * Math.cos(Math.PI / N) - 1.5)], (k + 1) * A);

const TRI = [0, -1, 1, -2, 2].map((i) => AXIS + 54 * i); // back first
const upright = (deg: number, dx: number) => turn(stone(r, dx), deg);
const triFlat = (deg: number) => turn([at('flat-x', -7.5, 15, r - 1.5)], deg);
const triEdge = (deg: number) => turn([at('edge-x', -7.5, 16, r - 0.5)], deg);

const steps: Step[] = [
  { planks: [at('flat-x', -7.5, 0, -1.5)], hint: 'Au milieu, couchée : la pierre de l’autel' },
];
// horseshoe, built first while the middle is easy to reach; the last one has fallen
for (const [i, deg] of TRI.entries()) {
  if (i < 4) {
    steps.push({ planks: upright(deg, -4.5), ...(i === 0 && { hint: 'Une pierre : six planchettes debout, collées' }) });
    steps.push({ planks: upright(deg, 4.5), ...(i === 0 && { hint: 'Sa voisine, avec un passage entre elles' }) });
    steps.push({ planks: triFlat(deg), ...(i === 0 && { hint: 'Couchée à cheval sur les deux' }) });
    steps.push({ planks: triEdge(deg), ...(i === 0 && { hint: 'Une sur la tranche par-dessus' }) });
  } else {
    steps.push({ planks: upright(deg, -4.5), hint: 'Celle-ci est restée seule debout' });
    steps.push({ planks: turn([...fallen(r - 6, 3), at('flat-x', -4, 0, r + 2.5)], deg + 8), hint: 'Les autres sont tombées dans l’herbe' });
  }
}
// outer ring: the stones still standing, then the lintels
const STANDING = [3, 4, 5, 6, 7, 8, 9, 2];
for (const [i, k] of STANDING.entries()) steps.push({ planks: ring(k), ...(i === 0 && { hint: 'Le grand cercle, tout autour' }) });
steps.push({ planks: [3, 4, 5, 6, 7].flatMap(lintel), hint: 'Bout à bout, d’une pierre à l’autre' });
steps.push({ planks: lintel(2) });
steps.push({ planks: [...turn(fallen(R + 4), 1.5 * A), ...turn([at('flat-x', -7.5, 0, R + 2.5)], 6)], hint: 'Une pierre tombée, couchée dehors' });

export const stonehenge: Model = { id: 'stonehenge', name: 'Stonehenge', theme: 'monuments', difficulty: 1, steps };
export default stonehenge;
