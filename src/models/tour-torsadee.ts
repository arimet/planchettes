import { at, spin, type Plank } from '../geometry';
import type { Model } from '../model';

// 4 planks flat in a pinwheel around an 18 × 18 square; every floor turns 10° more: a full turn in 36 floors.
const FLOORS = 36;
const TURN = 10;
const ring = (y: number): Plank[] => [at('flat-x', 0, y, 0), at('flat-z', 15, y, 0), at('flat-x', 3, y, 15), at('flat-z', 0, y, 3)];

export const tourTorsadee: Model = {
  id: 'tour-torsadee',
  name: 'Tour torsadée',
  theme: 'tours',
  difficulty: 2,
  steps: Array.from({ length: FLOORS }, (_, i) => ({
    planks: ring(i).map((p) => spin(p, i * TURN, 9, 9)),
    ...(i === 0 && { hint: 'Un carré de 4 planchettes couchées' }),
    ...(i === 1 && { hint: 'Chaque étage tourne d’un petit cran' }),
  })),
};
