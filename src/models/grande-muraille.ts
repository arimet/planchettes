import { at, spin, type Plank } from '../geometry';
import { logWall, type Model, type Step } from '../model';

// Great Wall: three straight stretches of wall zigzagging across the floor, joined by two square
// log-cabin watchtowers, much taller than the wall. A stretch is two rows of flat planks (front face, back face) and, on top,
// merlons: pairs of planks laid across both rows. The rows end flush against the slanted tower faces,
// so the back row starts a few units later than the front one (a parallelogram).
const REL = 20; // each stretch turns this much off the towers' axis
const ROW_H = 6; // layers of each row
const TOWER = 20; // log-cabin layers of a tower (even: the top layer runs front to back, under the floor)
const C = 0.3; // clearance against a tower face
const LC = 30 + 3 * Math.tan((REL * Math.PI) / 180) + (2 * C) / Math.cos((REL * Math.PI) / 180); // between two facing tower faces, along the stretch

type Pt = [number, number];
const add = (a: Pt, b: Pt, s = 1): Pt => [a[0] + s * b[0], a[1] + s * b[1]];
const dir = (d: number): Pt => [Math.cos((d * Math.PI) / 180), -Math.sin((d * Math.PI) / 180)];

/** Plank built in a stretch's own frame (u along the stretch, v across), moved to the floor. */
const place = (p: Plank, d: number, o: Pt): Plank => {
  const q = spin(p, d, 0, 0);
  return { ...q, x: q.x + o[0], z: q.z + o[1] };
};

/** A stretch leaving from (or arriving at, when back) a vertical tower face at o, heading d. */
function stretch(o: Pt, d: number, back: boolean) {
  const t = Math.tan((d * Math.PI) / 180), k = Math.cos((d * Math.PI) / 180);
  const base = C / k + 1.5 * Math.abs(t); // the row corner nearest the face keeps C off it
  const rows = [-6, 6].map((vc) => (back ? -base - vc * t - 30 : base - vc * t)); // start u of each row
  const lo = Math.max(...rows) + 1, hi = Math.min(...rows) + 30 - 1 - 3;
  const teeth = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);
  const layer = (y: number) => rows.flatMap((u, i) => [0, 15].map((s) => place(at('flat-x', u + s, y, i ? 4.5 : -7.5), d, o)));
  const merlons = (y: number) => teeth.map((u) => place(at('flat-z', u, y, -7.5), d, o));
  return { layer, merlons };
}

// towers: T1 at the origin, T2 at the far end of the middle stretch; both square to the x axis
const t1: Pt = [0, 0];
const f1: Pt = [7.5, 0];
const t2: Pt = add(add(f1, dir(-REL), LC), [7.5, 0]);
const parts = [
  stretch([-7.5, 0], REL, true), // arrives at T1's left face, heading back-right
  stretch(f1, -REL, false), // leaves T1 toward the front-right
  stretch(add(t2, [7.5, 0]), REL, false), // leaves T2 toward the back-right
];

const tower = (c: Pt) => logWall(c[0] - 7.5, c[1] - 7.5, 0, TOWER);
const floor = (c: Pt) => [12, 0, 6, 3, 9].map((z) => at('flat-x', c[0] - 7.5, TOWER, c[1] - 7.5 + z));
const crown = (c: Pt, y: number) => [0.5, 6, 11.5].map((x) => at('flat-z', c[0] - 7.5 + x, y, c[1] - 7.5));

const steps: Step[] = [];
const [w1, w2] = [tower(t1), tower(t2)];
for (let y = 0; y < TOWER; y++) steps.push({ planks: [...w1.slice(2 * y, 2 * y + 2), ...w2.slice(2 * y, 2 * y + 2)] });
steps.push({ planks: floor(t1) }, { planks: floor(t2) });
for (const y of [TOWER + 1, TOWER + 2]) steps.push({ planks: [...crown(t1, y), ...crown(t2, y)] });
for (let y = 0; y < ROW_H; y++) steps.push({ planks: [...parts[0].layer(y), ...parts[1].layer(y)] }, { planks: parts[2].layer(y) });
for (const y of [ROW_H, ROW_H + 1]) steps.push({ planks: [...parts[0].merlons(y), ...parts[1].merlons(y)] }, { planks: parts[2].merlons(y) });

steps[0].hint = 'Deux tours carrées, loin l’une de l’autre';
steps[1].hint = 'Chaque étage croise celui du dessous';
steps[TOWER].hint = 'Un plancher plein en haut de la tour';
steps[TOWER + 2].hint = 'Les créneaux : trois planchettes en travers';
steps[TOWER + 3].hint = 'Encore trois, juste dessus';
steps[TOWER + 4].hint = 'La muraille part de biais, collée à la tour';
steps[TOWER + 4 + 2 * ROW_H].hint = 'Les créneaux, à cheval sur les deux rangées';

export const grandeMuraille: Model = { id: 'grande-muraille', name: 'Grande Muraille', theme: 'monuments', difficulty: 2, steps };
export default grandeMuraille;
