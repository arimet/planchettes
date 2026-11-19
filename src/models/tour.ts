import { at, type Plank } from '../geometry';
import { chunk, type Model } from '../model';

// Pinwheel ring: 4 planks per layer around an 18 × 18 square, mirrored every other layer.
function ring(y: number, mirrored: boolean): Plank[] {
  return mirrored
    ? [at('flat-x', 3, y, 0), at('flat-z', 15, y, 3), at('flat-x', 0, y, 15), at('flat-z', 0, y, 0)]
    : [at('flat-x', 0, y, 0), at('flat-z', 15, y, 0), at('flat-x', 3, y, 15), at('flat-z', 0, y, 3)];
}

const LAYERS = 18;
const walls = Array.from({ length: LAYERS }, (_, y) => ring(y, y % 2 === 1)).flat();
const roof = [0, 3, 6, 9, 12, 15].map((z) => at('flat-x', 1.5, LAYERS, z));
const flag = at('up-x', 7.5, LAYERS + 1, 8);

export const tour: Model = {
  id: 'tour',
  name: 'Tour en rondins',
  theme: 'tours',
  difficulty: 1,
  steps: [...chunk(walls, 8, 'Un tour de 4 planchettes, puis le suivant dans l’autre sens'), { planks: [...roof, flag], hint: 'Le toit, puis le drapeau debout au milieu' }],
};
