import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Butterfly with its wings open, head toward +x. Each wing is a fan of planks on the ground: their inner
// ends sit side by side along the body, each one turned a bit more, so they spread without touching.
// Every floor repeats the fan pushed a little further out: the wings rise toward their tips. The big
// front wings have more and taller rays. The body is a ridge laid on the wing roots, the antennae lie
// in a V in front of the head.
const D = Math.PI / 180;
const R = 3; // inner corner of the rays, from the middle line

type Ray = { x: number; z: number; phi: number }; // inner end centre (right wing), turned phi° toward the head
/** The ray and its mirror on the left wing. */
const pair = ({ x, z, phi }: Ray, y = 0): Plank[] =>
  [1, -1].map((s) => spin(at('flat-z', x - 1.5, y, s === 1 ? z : -z - 15), s * phi, x, s * z));

/** Rays on the ground turned by phis, roots stepping along x so each one clears the last. */
function fan(x0: number, dir: 1 | -1, phis: number[]): Ray[] {
  let x = x0;
  return phis.map((phi, i) => ({
    x: (x += i && (dir * 3.5) / Math.cos(phi * D)),
    z: R + 1.5 * Math.sin(Math.abs(phi) * D),
    phi,
  }));
}
const FORE = fan(-1, 1, [5, 12, 19, 26, 33, 40]);
const HIND = fan(-6, -1, [-28, -38, -48]);
const STEP = 1.5;
/** Layer k of a wing: every ray pushed k·STEP further out, if its column is that tall. */
const layer = (rays: Ray[], tall: number[], k: number): Plank[] =>
  rays.flatMap((r, i) =>
    k < tall[i]
      ? pair(
          {
            x: r.x + k * STEP * Math.sin(r.phi * D),
            z: r.z + k * STEP * Math.cos(r.phi * D),
            phi: r.phi,
          },
          k,
        )
      : [],
  );
const FT = [5, 7, 8, 8, 7, 5];
const HT = [3, 3, 2];

/** Body: rows along the middle line from x0 to x0 + 15; one plank wide on the ground, two above. */
const BODY: number[][] = [[-25, -9.5, 6], [-21, -5.5, 10], [-17, -1.5, 14], [-13, 2.5], [-9, 6.5], [-5, 10.5], [-1]];
const body = (y: number): Plank[] => BODY[y].flatMap((x) => (y === 0 ? [-1.5] : [-3.5, 0.5]).map((z) => at('flat-x', x, y, z)));
const antenna = (s: 1 | -1): Plank => spin(at('flat-x', 22.5, 0, s * 1.8 - 1.5), -s * 16, 22.5, s * 1.8);

const steps: Step[] = [
  ...Array.from({ length: Math.max(...FT) }, (_, k) => k).flatMap((k) => {
    const fore = layer(FORE, FT, k);
    return [
      {
        planks: fore.filter((_, i) => i % 2 === 0),
        ...(k === 0 && {
          hint: 'Une grande aile : chaque planchette tourne un peu plus',
        }),
        ...(k === 1 && {
          hint: 'Chaque étage dépasse un peu plus loin : l’aile se soulève',
        }),
      },
      {
        planks: fore.filter((_, i) => i % 2 === 1),
        ...(k === 0 && { hint: 'Pareil de l’autre côté' }),
      },
      ...(k < Math.max(...HT)
        ? [
            {
              planks: layer(HIND, HT, k),
              ...(k === 0 && { hint: 'Les petites ailes, vers l’arrière' }),
            },
          ]
        : []),
    ];
  }),
  { planks: [antenna(1), antenna(-1)], hint: 'Les antennes, en V devant' },
  ...BODY.map((_, y) => ({
    planks: body(y),
    ...(y === 0 && { hint: 'Le corps, entre les ailes' }),
    ...(y === 1 && { hint: 'Puis deux par deux, sur le bout des ailes' }),
  })),
];

const FACE = -55; // head toward the camera of the 3/4 view
export const papillon: Model = {
  id: 'papillon',
  name: 'Papillon',
  theme: 'animaux',
  difficulty: 1,
  steps: steps.map((s) => ({
    ...s,
    planks: s.planks.map((p) => spin(p, FACE, 0, 0)),
  })),
};
export default papillon;
