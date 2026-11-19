import { at } from '../geometry';
import type { Model } from '../model';

// Standing legs, a deck for the body, a two-plank neck and a head balanced on top.
export const girafe: Model = {
  id: 'girafe',
  name: 'Girafe',
  theme: 'animaux',
  difficulty: 1,
  steps: [
    { planks: [at('up-z', 0, 0, 0), at('up-z', 0, 0, 12), at('up-z', 14, 0, 0), at('up-z', 14, 0, 12)], hint: 'Les pattes, debout' },
    { planks: [at('flat-x', 0, 15, 0), at('flat-x', 0, 15, 12), ...[0, 3, 6, 9, 12].map((x) => at('flat-z', x, 16, 0))] },
    { planks: [3, 6, 9].map((z) => at('flat-x', 0, 17, z)) },
    { planks: [at('up-z', 12, 18, 6), at('up-z', 13, 18, 6), at('flat-x', 5.5, 33, 6)], hint: 'Le cou debout, puis la tête bien au milieu' },
  ],
};
