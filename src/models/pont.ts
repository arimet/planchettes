import { at, type Plank } from '../geometry';
import type { Model } from '../model';

// Corbelled arch: each floor of each half moves 1.5 toward the middle. The outer plank of each floor
// is the counterweight, and its steps make a staircase up to the deck.
const FLOORS = 8;
const STEP = 1.5;
const MID = 25.5; // the two top floors meet here
const ROWS = [0, 3, 6];

const half = (i: number, side: 1 | -1): Plank[] =>
  ROWS.flatMap((z) =>
    [STEP * i, STEP * i - 15].map((x) => at('flat-x', side === 1 ? x : 2 * MID - x - 15, i, z)),
  );

const steps = Array.from({ length: FLOORS }, (_, i) => [
  { planks: half(i, 1), ...(i === 0 && { hint: 'Le pied gauche : 3 rangées de 2 planchettes bout à bout' }), ...(i === 1 && { hint: 'Chaque étage avance d’un cran vers le milieu' }) },
  { planks: half(i, -1), ...(i === 0 && { hint: 'Pareil pour le pied droit' }) },
]).flat();

export const pont: Model = {
  id: 'pont',
  name: 'Pont en arche',
  theme: 'ponts',
  difficulty: 2,
  steps: [...steps, { planks: ROWS.map((z) => at('flat-x', MID - 7.5, FLOORS, z)), hint: 'Le tablier relie les deux moitiés' }],
};
