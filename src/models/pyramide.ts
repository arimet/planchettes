import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Mayan pyramid. Each terrace is a pinwheel of four "arms" (bundles of planks lying side by side, one
// arm per side, each turning the corner of the next): side = 15 + arm width. One plank less per arm
// and the terrace is 3 narrower: each terrace moves in by 1.5. Two layers per terrace, the second
// mirrored so the planks cross. A staircase of planks across the front climbs with the terraces in
// small steps. On the top platform, a temple: walls of planks with a doorway, a roof, a roof crest.
const B = 30; // base side
const C = B / 2;

/** One pinwheel layer of side s (s = 15 + 3n), arms listed in placing order. */
const arms = (s: number, y: number, mirror: boolean): Plank[][] => {
  const o = (B - s) / 2;
  const rows = Array.from({ length: (s - 15) / 3 }, (_, i) => 3 * i);
  const out = [
    rows.map((r) => at('flat-x', o, y, o + r)),
    rows.map((r) => at('flat-z', o + s - 3 - r, y, o)),
    rows.map((r) => at('flat-x', o + s - 15, y, o + s - 3 - r)),
    rows.map((r) => at('flat-z', o + r, y, o + s - 15)),
  ];
  return mirror ? out.map((arm) => arm.map((p) => ({ ...p, x: 2 * C - p.x }))) : out;
};

/** Staircase layer y: two planks across, the back one against the terrace, the front one 0.75 further in each layer. */
const stair = (y: number, face: number): Plank[] => [at('flat-x', C - 7.5, y, face), at('flat-x', C - 7.5, y, B + 3.75 - 0.75 * y)];

const steps: Step[] = [];
let y = 0;
for (let s = B; s >= 18; s -= 3) {
  for (const mirror of [false, true]) {
    const a = arms(s, y, mirror);
    const per = a[0].length > 4 ? 1 : 2; // at most 8 planks per step
    for (let i = 0; i < 4; i += per) steps.push({ planks: a.slice(i, i + per).flat() });
    steps.push({ planks: stair(y, (B + s) / 2) });
    y++;
  }
}

// temple: 15 × 15 on the 18 × 18 top terrace, walls of planks pointing front to back, doorway in the middle
const T = C - 7.5;
for (let l = 0; l < 4; l++) steps.push({ planks: [0, 3, 9, 12].map((d) => at('flat-z', T + d, y + l, T)) });
y += 4;
steps.push({ planks: [6, 3, 9, 0, 12].map((d) => at('flat-x', T, y, T + d)) });
steps.push({ planks: [at('edge-x', T, y + 1, C - 0.5)] });

steps[0].hint = 'Cinq planchettes collées, pour un coin';
steps[1].hint = 'Le paquet suivant tourne autour du carré';
steps[4].hint = 'L’escalier : deux planchettes devant';
steps[5].hint = 'Même carré, mais les planchettes se croisent';
steps[10].hint = 'Une planchette de moins : la marche rentre d’un cran';
const temple = steps.length - 6;
steps[temple].hint = 'Le temple : quatre planchettes, une porte au milieu';
steps[temple + 1].hint = 'Monte les murs bien droit';
steps[temple + 4].hint = 'Le toit couvre la porte';
steps[temple + 5].hint = 'La crête du toit, sur la tranche';

export const pyramide: Model = { id: 'pyramide', name: 'Pyramide maya', theme: 'originaux', difficulty: 2, steps };
export default pyramide;
