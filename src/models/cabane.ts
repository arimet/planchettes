import { at } from '../geometry';
import { chunk, logWall, type Model } from '../model';

// 12-layer log walls, then a flat roof of 5 planks.
const roof = [0, 3, 6, 9, 12].map((z) => at('flat-x', 0, 12, z));

export const cabane: Model = {
  id: 'cabane',
  name: 'Cabane',
  theme: 'maisons',
  difficulty: 1,
  steps: [...chunk(logWall(0, 0, 0, 12), 6, 'Croise les planchettes à chaque étage'), { planks: roof, hint: 'Le toit' }],
};
