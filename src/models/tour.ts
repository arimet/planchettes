import { at, type Plank } from '../geometry';
import { chunk, type Model } from '../model';

// Classic square tower: 4 planks on edge around a 16 × 16 square, the pinwheel mirrored every layer.
function ring(y: number, mirrored: boolean): Plank[] {
  return mirrored
    ? [at('edge-x', 1, y, 0), at('edge-z', 15, y, 1), at('edge-x', 0, y, 15), at('edge-z', 0, y, 0)]
    : [at('edge-x', 0, y, 0), at('edge-z', 15, y, 0), at('edge-x', 1, y, 15), at('edge-z', 0, y, 1)];
}

const LAYERS = 16;
const TOP = LAYERS * 3;
const walls = Array.from({ length: LAYERS }, (_, i) => ring(i * 3, i % 2 === 1)).flat();
const roof = [0.5, 3.5, 6.5, 9.5, 12.5].map((z) => at('flat-x', 0.5, TOP, z));
const flag = at('up-x', 6.5, TOP + 1, 7.5);

export const tour: Model = {
  id: 'tour',
  name: 'Tour carrée',
  theme: 'tours',
  difficulty: 1,
  steps: [
    ...chunk(walls, 8, 'Sur la tranche : un tour de 4, puis le suivant décalé'),
    { planks: [...roof, flag], hint: 'Le toit, puis le drapeau debout au milieu' },
  ],
};
