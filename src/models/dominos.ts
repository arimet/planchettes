import type { Plank } from '../geometry';
import { chunk, type Model } from '../model';

// A domino spiral: planks standing on end along an Archimedean spiral, each one facing along the path.
// Built from the centre outwards so a careless hand never knocks the line over; pushed from the outside.
const SPACING = 6.5; // between two dominos, along the path (about two fingers apart)
const R0 = 14; // first turn radius
const GAP = 17; // between turns: more than a domino's height, so a falling turn never hits the next one
const TURNS = 2;

function spiral(): Plank[] {
  const out: Plank[] = [];
  const b = GAP / (2 * Math.PI);
  let t = 0;
  while (t < TURNS * 2 * Math.PI) {
    const r = R0 + b * t;
    const x = r * Math.cos(t);
    const z = r * Math.sin(t);
    // tangent direction of the spiral; an up-z plank is thin along x, so turn x onto the tangent
    const dx = b * Math.cos(t) - r * Math.sin(t);
    const dz = b * Math.sin(t) + r * Math.cos(t);
    const yaw = (-Math.atan2(dz, dx) * 180) / Math.PI;
    out.push({ x, y: 7.5, z, o: 'up-z', yaw });
    t += SPACING / Math.hypot(dx, dz); // equal steps along the path
  }
  return out;
}

const planks = spiral();

export const dominos: Model = {
  id: 'dominos',
  name: 'Spirale de dominos',
  theme: 'originaux',
  difficulty: 1,
  steps: chunk(planks, 6).map((s, i) =>
    i === 0
      ? { ...s, hint: 'Debout, face au chemin, deux doigts entre chaque domino' }
      : i === 1
        ? { ...s, hint: 'On part du milieu : comme ça, on ne les fait pas tomber en posant' }
        : s,
  ),
};

export default dominos;
