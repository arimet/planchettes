import { at } from '../geometry';
import type { Model } from '../model';

const body = (y: number) => [3, 6, 9].map((z) => at('flat-x', 0, y, z));

export const voiture: Model = {
  id: 'voiture',
  name: 'Voiture',
  theme: 'vehicules',
  difficulty: 1,
  steps: [
    { planks: [1, 11].flatMap((x) => [at('flat-z', x, 0, 0), at('flat-z', x, 1, 0)]), hint: 'Les roues' },
    { planks: body(2) },
    { planks: [...body(3), ...body(4)] },
    { planks: [5, 6, 7].flatMap((y) => [at('flat-z', 3, y, 0), at('flat-z', 9, y, 0)]), hint: 'Les montants des fenêtres' },
    { planks: body(8), hint: 'Le toit' },
  ],
};
