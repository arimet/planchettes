import { at, spin, type Plank } from '../geometry';
import { chunk, type Model, type Step } from '../model';

// Leaning Tower of Pisa: a closed ground floor, then galleries of thin columns (planks standing
// sideways, edge out), each storey capped by a two-layer floor (the cornice). Every storey sits a
// little further toward the lean side, so the whole tower leans to the right of the 3/4 view.
const C = 12;
const LEAN = 2.25; // sideways shift per storey: 2.5 tips over in the ±4 mm test
const DIR = (-35 * Math.PI) / 180; // lean direction: to the right in the 3/4 view
const off = (k: number): [number, number] => [C + k * LEAN * Math.cos(DIR), C + k * LEAN * Math.sin(DIR)];

/** n standing planks in a ring of radius r around storey k's axis, face out. */
const ring = (k: number, n: number, r: number, y: number, phase = 0): Plank[] => {
  const [cx, cz] = off(k);
  return Array.from({ length: n }, (_, i) => spin(at('up-x', cx - 1.5, y, cz + r - 0.5), phase + (i * 360) / n, cx, cz));
};

/** n columns: standing planks edge out, center at radius r. */
const columns = (k: number, n: number, r: number, y: number, phase = 0): Plank[] => {
  const [cx, cz] = off(k);
  return Array.from({ length: n }, (_, i) => spin(at('up-z', cx - 0.5, y, cz + r - 1.5), phase + (i * 360) / n, cx, cz));
};

/** n flat planks side by side, centered on axis k (fractional = between two storeys), turned by deg. */
const floor = (k: number, n: number, y: number, deg: number): Plank[] => {
  const [cx, cz] = off(k);
  const offs = Array.from({ length: n }, (_, i) => 3 * i - 1.5 * n).sort((a, b) => Math.abs(a + 1.5) - Math.abs(b + 1.5));
  return offs.map((d) => spin(at('flat-x', cx - 7.5, y, cz + d), deg, cx, cz));
};

const GALLERIES = 3;
const BELFRY = GALLERIES; // the belfry stands straighter, like the real one
const steps: Step[] = [];
let y = 0;
steps.push(...chunk(ring(0, 12, 6.3, y), 6, 'Debout, en cercle, bien serrées'));
y += 15;
for (let k = 1; k <= GALLERIES + 1; k++) {
  const deg = 125; // the top layer runs along the lean
  const a = Math.min(k - 0.5, BELFRY);
  steps.push({ planks: floor(a, 4, y, deg), ...(k === 1 && { hint: 'Le plancher' }) });
  steps.push({ planks: floor(a, 5, y + 1, deg - 90), ...(k === 1 && { hint: 'Une 2e couche en travers' }) });
  y += 2;
  if (k <= GALLERIES) {
    const cols = columns(k, 12, 5, y, 15);
    steps.push(
      { planks: cols.slice(0, 6), ...(k === 1 && { hint: 'Les colonnes : debout, la tranche vers l’extérieur' }), ...(k === 2 && { hint: 'Chaque étage glisse un peu sur le côté : la tour penche' }) },
      { planks: cols.slice(6) },
    );
  } else {
    steps.push({ planks: ring(BELFRY, 6, 3.6, y, 30), hint: 'Le clocher, plus petit' });
  }
  y += 15;
}
steps.push({ planks: floor(BELFRY, 3, y, 125) }, { planks: floor(BELFRY, 3, y + 1, 35), hint: 'Le toit du clocher' });

export const tourDePise: Model = { id: 'tour-de-pise', name: 'Tour de Pise', theme: 'monuments', difficulty: 3, steps };
export default tourDePise;
