import { at, type Orientation, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A friendly robot facing +z. Big boots, two hollow legs of standing planks, a hip plate, a box body
// of standing planks, arms sticking out at the shoulders (held down by the neck and the heavy head),
// a solid head of flat layers with a mouth slit and two square eye holes, and an antenna standing
// inside the forehead.
const row = (o: Orientation, y: number, xs: number[], zs: number[]): Plank[] => xs.flatMap((x) => zs.map((z) => at(o, x, y, z)));
const flatX = (y: number, zs: number[]) => row('flat-x', y, [-7.5], zs);
const flatZ = (y: number, xs: number[]) => row('flat-z', y, xs, [-7.5]);
const FULL = [-7.5, -4.5, -1.5, 1.5, 4.5]; // 5 planks side by side: a 15 × 15 floor

// boots: 2 planks per foot, toes forward
const foot = (y: number) => row('flat-z', y, [-7, -4, 1, 4], [-5]);
// a hollow leg: 2 planks on each side, one in front, one behind (x = left edge)
const leg = (x: number): Plank[] => [
  at('up-z', x, 2, -3), at('up-z', x + 4, 2, -3), at('up-z', x, 2, 0), at('up-z', x + 4, 2, 0),
  at('up-x', x + 1, 2, -4), at('up-x', x + 1, 2, 3),
];
const HIP = 17;
const BODY = HIP + 2; // the body walls stand on the hip plate
// walls kept 1.5 inside the plate edges, so a plank placed a bit off still stands on it
const back = FULL.map((x) => at('up-x', x, BODY, -6));
const front = FULL.map((x) => at('up-x', x, BODY, 5));
const sides = [-5, -1.5, 2].flatMap((z) => [at('up-z', -6.5, BODY, z), at('up-z', 5.5, BODY, z)]);
const ROOF = BODY + 15;
const SH = ROOF + 1; // shoulders: the two arms, crossing the body side by side
const arms1 = [at('flat-x', -13, SH, -3), at('flat-x', -2, SH, 0)];
// forearms: 2 floors on each arm, slid in beside the neck once the heavy head holds the arms down
const arms2 = (y: number) => [at('flat-x', -18, y, -3), at('flat-x', 3, y, 0)];
const neck = (y: number) => flatZ(y, [-3, 0]);
const H = SH + 4; // the head, on 3 floors of neck
const FORE = [-7.5, -3.5, -0.5, 2.5, 5.5]; // forehead rows: a slit for the antenna, a visor in front

const steps: Step[] = [
  { planks: foot(0), hint: 'Deux grosses chaussures' },
  { planks: foot(1) },
  { planks: leg(-6.5), hint: 'Une jambe : 6 planchettes debout en carré' },
  { planks: leg(1.5) },
  { planks: flatX(HIP, [-4, 1]), hint: 'Deux planchettes posées sur les deux jambes' },
  { planks: flatZ(HIP + 1, FULL), hint: 'Un plancher pour le ventre' },
  { planks: back, hint: 'Le dos du robot, debout' },
  { planks: front, hint: 'Le ventre, debout' },
  { planks: sides, hint: 'Les côtés' },
  { planks: flatZ(ROOF, FULL), hint: 'Un plancher pour fermer le haut' },
  { planks: [...arms1, ...flatX(SH, [-6, 3])], hint: 'Les épaules : chaque bras dépasse d’un côté' },
  { planks: neck(SH + 1), hint: 'Le cou tient les bras' },
  { planks: neck(SH + 2) },
  { planks: neck(SH + 3) },
  { planks: flatX(H, FULL), hint: 'Le menton' },
  { planks: flatZ(H + 1, [-7.5, 4.5]), hint: 'Un trou au milieu : la bouche' },
  { planks: flatX(H + 2, FULL) },
  ...[3, 4, 5].map((k) => ({ planks: flatZ(H + k, [-7.5, -1.5, 4.5]), ...(k === 3 && { hint: 'Deux trous : les yeux' }) })),
  { planks: flatX(H + 6, FULL) },
  ...[7, 8, 9, 10].map((k) => ({ planks: flatX(H + k, FORE), ...(k === 7 && { hint: 'Le front : une fente pour l’antenne, une visière devant' }) })),
  { planks: [at('up-x', -1.5, H + 7, -4.5)], hint: 'L’antenne, glissée debout dans la fente' },
  { planks: arms2(SH + 1), hint: 'Les bras s’allongent, glissés sous la tête' },
  { planks: arms2(SH + 2) },
];

export const robot: Model = { id: 'robot', name: 'Robot', theme: 'originaux', difficulty: 2, steps };

export default robot;
