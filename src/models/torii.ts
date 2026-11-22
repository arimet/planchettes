import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Torii, the Japanese shrine gate, facing +z. Two tall posts, each three standing planks pressed
// together, two storeys high (the upper storey turned a quarter turn so it sits across the lower
// one). On top the nuki: a flat plank balanced on each post and one across the middle. A small
// stack across each post makes the gap, then the kasagi: planks across the middle hold down the
// inner ends while the outer ones step further out at every layer, so the ends sweep up.
const C = 12; // posts at x = ±C
const Y = 30; // top of the posts

const mirror = (p: Plank): Plank => ({ ...p, x: -p.x });
const both = (left: Plank[]): Plank[] => [...left, ...left.map(mirror)];

const lower = [0, 1, 2].map((d) => at('up-x', -C - 1.5, 0, -1.5 + d));
const upper = [0, 1, 2].map((d) => at('up-z', -C - 1.5 + d, 15, -1.5));
/** Flat plank lying along x, from x0. */
const flat = (x0: number, y: number): Plank => at('flat-x', x0, y, -1.5);
const middle = (y: number) => flat(-7.5, y);
const cap = (y: number) => at('flat-z', -C - 1.5, y, -7.5);

const steps: Step[] = [
  { planks: both(lower), hint: 'Trois debout, collées : un gros poteau' },
  { planks: both(upper), hint: 'Le poteau continue, tourné d’un quart de tour' },
  { planks: both([flat(-C - 7.5, Y)]), hint: 'Couchée, bien au milieu du poteau' },
  { planks: both([cap(Y + 1)]), hint: 'En travers du poteau' },
  { planks: [middle(Y + 1)], hint: 'À cheval sur les deux' },
  { planks: both([cap(Y + 2)]) },
  { planks: both([cap(Y + 3)]) },
  { planks: both([flat(-C - 7.5, Y + 4)]) },
  { planks: [middle(Y + 5)], hint: 'D’abord celle du milieu : elle tient les bouts' },
  { planks: both([flat(-C - 11, Y + 5)]), hint: 'Elles dépassent vers l’extérieur' },
  { planks: [middle(Y + 6)] },
  { planks: both([flat(-C - 12.5, Y + 6)]), hint: 'Encore un cran plus loin' },
  { planks: both([flat(-C - 13, Y + 7)]), hint: 'Les bouts remontent' },
];

export const torii: Model = { id: 'torii', name: 'Torii', theme: 'monuments', difficulty: 1, steps };
export default torii;
