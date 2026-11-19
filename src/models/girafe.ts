import { at, type Plank } from '../geometry';
import type { Model } from '../model';

// Standing-plank legs and neck, a flat-plank body, a two-plank head balanced over the neck.
const leg = (x: number, z: number): Plank[] => [at('up-x', x, 0, z), at('up-x', x, 0, z + 1)];
const neck = (y: number): Plank[] => [at('up-x', 12, y, 2), at('up-x', 12, y, 6), at('up-z', 12, y, 3), at('up-z', 14, y, 3)];

export const girafe: Model = {
  id: 'girafe',
  name: 'Girafe',
  theme: 'animaux',
  difficulty: 2,
  steps: [
    { planks: [...leg(0, 0), ...leg(0, 7), ...leg(13, 0), ...leg(13, 7)], hint: 'Les pattes : 2 planchettes debout, collées' },
    { planks: [at('flat-x', 0.5, 15, 0), at('flat-x', 0.5, 15, 6)], hint: 'Le dos, posé sur les pattes' },
    { planks: [0.5, 3.5, 6.5, 9.5, 12.5].map((x) => at('flat-z', x, 16, -3)) },
    { planks: [0, 3, 6].map((z) => at('flat-x', 0.5, 17, z)) },
    { planks: neck(18), hint: 'Le cou : 4 planchettes debout en carré' },
    { planks: [at('flat-x', 6, 33, 2), at('flat-x', 6, 33, 5), ...neck(34)], hint: 'Une crinière couchée, puis encore un étage de cou' },
    { planks: [at('flat-x', 5, 49, 3), at('flat-x', 8, 50, 3), at('flat-x', 4, 51, 3)], hint: 'La tête : le museau devant, l’arrière de la tête par-dessus' },
  ],
};
