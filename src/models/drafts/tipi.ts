import { at, overlaps, spin, type Plank } from '../../geometry';
import type { Model, Step } from '../../model';

// A tipi. The core is a hollow post of 4 standing planks. Poles stand on the ground and lean their top
// on the post: first on its faces, then on its corners, so their tips gather at the top. A second ring
// of flatter poles leans on the gaps. The front (+z) stays open: the door.
const D = Math.PI / 180;
const FRONT = 270; // spin turns +x toward -z, so +z is at 270
const A = 14; // lean of the poles on the post, from vertical
const C = 20; // lean of the cover poles

const post = [at('up-x', -2, 0, -2), at('up-z', 1, 0, -2), at('up-x', -1, 0, 1), at('up-z', -2, 0, -1)];

/** Pole on the +x side leaning in at beta, inner face r out from the axis at the foot, side offset t, turned to deg. */
function pole(beta: number, r: number, deg: number, t = 0): Plank {
  const b = beta * D;
  const x = r + 7.5 * Math.sin(b) + 0.5 * Math.cos(b);
  const y = 7.5 * Math.cos(b) + 0.5 * Math.sin(b) + 0.02;
  return spin({ x, y, z: t, o: 'flat-x', tilt: beta - 90 }, deg, 0, 0);
}

const all: Plank[] = [...post];
/** Slides poles in from outside until each touches what is already there; none at the door. */
const lean = (beta: number, degs: number[]): Plank[] =>
  degs.filter((d) => Math.abs(d - FRONT) > 30).map((d) => {
    let r = 20;
    while (!all.some((p) => overlaps(p, pole(beta, r - 0.05, d)))) r -= 0.05;
    all.push(pole(beta, r + 0.05, d));
    return all[all.length - 1];
  });

const faces = lean(A, [0, 180, 90, 270]);
const corners = lean(A, [45, 225, 135, 315]);
const cover = lean(C, [22.5, 202.5, 67.5, 247.5, 112.5, 292.5, 157.5, 337.5]);

const steps: Step[] = [
  { planks: post, hint: 'Un poteau : 4 planchettes debout qui tournent autour d’un trou' },
  { planks: faces, hint: 'Penche les perches, le haut contre le poteau. Pas devant : c’est la porte' },
  { planks: corners, hint: 'Puis contre les coins du poteau' },
  { planks: cover, hint: 'Les dernières dans les trous, un peu plus penchées' },
];

export const tipi: Model = { id: 'tipi', name: 'Tipi', theme: 'maisons', difficulty: 1, steps };

export default tipi;
