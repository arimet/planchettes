import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// The space shuttle orbiter resting on the ground, nose toward +x. The delta wing lies on the
// ground first: rows of planks across, a pair per row (one per side, their inner ends under the
// body), each row a little narrower toward the nose; then single planks across (the narrow strip
// along the body), and on top two planks turned at the same slant finish the front edge of each
// wing. The body is 3 strips end to end on top; its floors start further back as they go up (a round
// nose, the engine pods sticking out at the back). A tall fin steps back on the tail.
const G = 0.5; // gap between neighbouring strips
const BODY = [-3 - G, 0, 3 + G]; // z of the 3 body strips (centers)
const BACK = [1, 0, 0, 0.5, 1.5, 3, 5]; // each body floor starts this much further back
const NOSE = [1, 1.5, 1.5, 1, 0, 0, 0]; // the middle strip pokes out at the nose

const floor = (i: number): Plank[] =>
  BODY.flatMap((z) => [0, 15, 30].map((x) => at('flat-x', x - BACK[i] + (z === 0 ? NOSE[i] : 0), i + 1, z - 1.5)));

// wing rows: a pair of planks across, inner ends A off the middle (half span A + 15)
const ROWS = [3, 1.5, 0.25];
const pair = (j: number) => [at('flat-z', 3 * j, 0, ROWS[j]), at('flat-z', 3 * j, 0, -ROWS[j] - 15)];
const STRAKE = 6; // single planks across, in front of the pairs
const strake = Array.from({ length: STRAKE }, (_, k) => at('flat-z', 3 * (ROWS.length + k), 0, -7.5));
const KEEL = 3 * (ROWS.length + STRAKE); // under the front of the body
const keel = BODY.map((z) => at('flat-x', KEEL, 0, z - 1.5));

// front edge: planks turned by EDGE from the last pair's outer front corner toward the body;
// the inner one starts further back so its tip stays clear of the body
const EDGE = 30;
const [sn, cs] = [Math.sin, Math.cos].map((f) => f((EDGE * Math.PI) / 180));
const OUT = ROWS[ROWS.length - 1] + 15; // half span at the last pair
const edge = (s: 1 | -1, k: number): Plank => {
  const back = 0.6 + 5.8 * k; // slid back along its own length
  const cx = 3 * ROWS.length - 0.5 - 3.25 * sn * k - back * cs; // outer back corner
  const cz = s * (OUT - 3.25 * cs * k + back * sn);
  return spin(at('flat-x', cx, 1, s === 1 ? cz - 3 : cz), s * EDGE, cx, cz);
};

const TOP = BACK.length + 1; // the fin stands on the top floor
const fin = Array.from({ length: 8 }, (_, k) => at('flat-x', 7 - BACK[BACK.length - 1] - 1.5 * k, TOP + k, -1.5));

const steps: Step[] = [
  { planks: [0, 1, 2].flatMap(pair), hint: 'Les ailes : des paires en travers, de plus en plus courtes' },
  { planks: strake, hint: 'Puis des planchettes seules, bien au milieu' },
  { planks: keel, hint: 'Sous le nez' },
  ...BACK.flatMap((_, i) => [
    { planks: floor(i).slice(0, 6), ...(i === 0 && { hint: 'Le corps : 3 rangées bout à bout' }), ...(i === 3 && { hint: 'Le haut recule : le nez s’arrondit' }) },
    { planks: floor(i).slice(6) },
    ...(i === 0 ? [{ planks: [edge(1, 0), edge(1, 1), edge(-1, 0), edge(-1, 1)], hint: 'Le bord des ailes, en biais' }] : []),
  ]),
  { planks: fin.slice(0, 4), hint: 'La dérive : chaque planchette recule' },
  { planks: fin.slice(4) },
];

export const navette: Model = { id: 'navette', name: 'Navette spatiale', theme: 'originaux', difficulty: 3, steps };
export default navette;
