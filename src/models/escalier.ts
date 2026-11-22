import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Spiral staircase (a double one, like Chambord's): every layer is two planks side by side through the
// middle, sticking out on opposite sides (two steps), the pair balanced on the axis. Each layer turns a
// notch: the steps fan out around the thin central column made by their overlapping inner ends.
// The turn goes toward the side of each step's partner, so a new step always lands on the pair below.
const LAYERS = 40; // two turns and a bit; a taller twisted stack settles too much
const TURN = 20; // degrees per layer
const R = 11; // the step tips reach this far from the axis
const W = 1.75; // lateral offset of each plank from the axis (gap 0.5 between the two)

const layer = (k: number): Plank[] => [
  spin(at('flat-x', R - 15, k, W - 1.5), k * TURN, 0, 0),
  spin(at('flat-x', -R, k, -W - 1.5), k * TURN, 0, 0),
];

const steps: Step[] = Array.from({ length: LAYERS }, (_, k) => ({ planks: layer(k) }));
steps[0].hint = 'Deux planchettes côte à côte, qui dépassent chacune d’un côté';
steps[1].hint = 'Chaque étage tourne d’un petit cran';
steps[2].hint = 'Le milieu reste bien empilé : c’est le pilier';

export const escalier: Model = { id: 'escalier', name: 'Escalier en colimaçon', theme: 'originaux', difficulty: 2, steps };
export default escalier;
