import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A small town: a street along x, tall buildings behind it, low ones in front (camera side).
// Back row: an apartment tower, the town hall (a hall of standing planks carrying a belfry with a
// pointed roof) and a block with balconies and a roof terrace. Front row: a small block and a shop
// whose roof planks stick out as an awning. Each building is finished before the next one starts.
// Blocks are pairs of planks on edge crossing floor by floor: the gaps are the windows.

type P = Plank[];
const steps: Step[] = [];
const add = (planks: P, hint?: string) => steps.push({ planks, ...(hint && { hint }) });

// ---- town hall: hall 30 × 15, belfry on the roof above the door ----
const MX = 21; // left end of the hall
const CX = MX + 15, CZ = 7.5; // belfry axis
add(
  [
    ...[0.5, 5.5, 21.5, 26.5].map((x) => at('up-x', MX + x, 0, 12.5)),
    ...[11.5, 17.5].map((x) => at('up-z', MX + x, 0, 11.5)),
  ],
  'On commence par la mairie : six planchettes debout, la porte au milieu',
);
add(
  [
    ...[1, 11.5, 17.5, 28].map((x) => at('up-z', MX + x, 0, 0.5)),
    ...[5.5, 21.5].map((x) => at('up-x', MX + x, 0, 1.5)),
  ],
  'Le mur du fond, un peu moins loin qu’une longueur de planchette',
);
add([0.5, 28.5].flatMap((x) => [4.25, 8.25].map((z) => at('up-z', MX + x, 0, z))), 'Deux planchettes pour fermer chaque côté');
add([11.5, 0.5].flatMap((z) => [-0.25, 15.25].map((x) => at('flat-x', MX + x, 15, z))), 'Deux planchettes couchées sur chaque mur');
const hallRoof = Array.from({ length: 9 }, (_, i) => at('flat-z', MX + 3.375 * i, 16, 0));
add(hallRoof.slice(0, 5), 'Le toit, en travers');
add(hallRoof.slice(5));
add([-4, 3].flatMap((x) => [3, 9].map((z) => at('up-z', CX + x, 17, z))), 'Le clocher : quatre planchettes debout au milieu du toit');
add(
  [at('up-x', CX - 1.5, 17, 3.5), at('up-z', CX + 3, 17, 6), at('up-x', CX - 1.5, 17, 10.5), at('up-z', CX - 4, 17, 6)],
  'Une planchette au milieu de chaque côté',
);
add([3, 9].map((z) => at('flat-x', CX - 7.5, 32, z)));
add(Array.from({ length: 5 }, (_, i) => at('flat-z', CX - 7.5 + 3 * i, 33, 0)));
add([0, 1, 2].map((d) => at('up-x', CX - 1.5, 34, CZ - 1.5 + d)), 'Trois planchettes debout, collées, au milieu');
const SLOPE = 78;
const leaning = (deg: number): Plank => {
  const a = (SLOPE * Math.PI) / 180;
  return spin({ o: 'flat-x', tilt: -SLOPE, x: CX + 1.52 + 7.5 * Math.cos(a) + 0.5 * Math.sin(a), y: 34.01 + 7.5 * Math.sin(a) + 0.5 * Math.cos(a), z: CZ }, deg, CX, CZ);
};
add([0, 90, 180, 270].map(leaning), 'Le toit pointu s’appuie contre elles');
add([at('up-x', CX - 1.5, 49, CZ - 0.5)], 'La flèche, tout en haut');
add([at('flat-x', CX - 7.5, 0, 15.5)], 'Une marche devant la porte');

// ---- apartment blocks ----
/** Block 15 × 15 at (x, z): pairs on edge crossing, a balcony on the listed floors, a flat roof. Returns the roof top. */
function block(x: number, z: number, floors: number, balconies: number[], hint: string): number {
  for (let i = 0; i < floors; i += 2) {
    const y = 3 * i;
    const planks = [at('edge-z', x + 1.5, y, z), at('edge-z', x + 12.5, y, z)];
    if (i === 0) planks.push(at('flat-z', x + 6, 0, z + 4)); // the path to the door
    if (balconies.includes(i)) planks.push(at('flat-z', x + 4.25, y, z + 1), at('flat-z', x + 7.75, y, z + 1));
    if (i + 1 < floors) planks.push(at('edge-x', x, y + 3, z + 1.5), at('edge-x', x, y + 3, z + 12.5));
    add(
      planks,
      i === 0 ? hint : balconies[0] === i ? 'Deux planchettes à plat qui dépassent devant : le balcon' : i === 2 ? 'Toujours pareil : deux dans un sens, deux dans l’autre' : undefined,
    );
  }
  const y = 3 * floors;
  add(Array.from({ length: 5 }, (_, k) => (floors % 2 ? at('flat-x', x, y, z + 3 * k) : at('flat-z', x + 3 * k, y, z))), 'Le toit plat');
  return y + 1;
}

// the tall tower, far left
{
  const y = block(0, 0, 16, [], 'Un grand immeuble, étage par étage : deux planchettes sur la tranche, une à plat pour l’entrée, puis deux en travers');
  add([at('edge-z', 4, y, 0), at('edge-z', 10, y, 0)], 'Le réservoir d’eau : deux pieds…');
  add([6, 7, 8].map((zz) => at('edge-x', 0, y + 3, zz)), '… et trois planchettes serrées dessus');
}
// the block with balconies and a roof terrace, right
{
  const x = 57;
  const y = block(x, 0, 10, [2, 4, 6, 8], 'Un autre immeuble, plus petit');
  add([at('edge-x', x, y, 13.5), at('edge-z', x + 0.5, y, -2), at('edge-z', x + 13.5, y, -2)], 'La terrasse sur le toit, avec sa barrière');
}

// ---- front row ----
const FZ = 33;
block(0, FZ, 7, [2, 4], 'De l’autre côté de la rue, un petit immeuble');

// shop: two thick side walls, two beams, a roof that sticks out in front, and a sloping awning leaning on a plank on edge
{
  const x = 66, z = FZ;
  add([0, 2, 12, 14].map((d) => at('edge-z', x + d, 0, z)), 'La boutique : deux planchettes sur la tranche de chaque côté');
  add([0, 12].map((d) => at('flat-z', x + d, 3, z)), 'Une à plat sur chaque paire');
  add([0.5, 1.5, 12.5, 13.5].map((d) => at('edge-z', x + d, 4, z)), 'Encore deux sur la tranche, collées, au milieu');
  add([0, 12].map((d) => at('flat-z', x + d, 7, z)));
  add([4.5, 12].map((d) => at('flat-x', x, 8, z + d)), 'Deux planchettes par-dessus la vitrine');
  add([0, 1, 2, 3, 4].map((k) => at('flat-z', x + 3 * k, 9, z + 4)), 'Le toit dépasse devant');
  add([at('edge-x', x, 10, z + 9)], 'Une planchette sur la tranche, en travers du toit');
  // awning: planks leaning on that plank's front top edge (z + 10, y 13) and on the roof's front edge (z + 19, y 10)
  const t = Math.atan(1 / 3);
  add(
    [0, 3.75, 7.5, 11.25].map((d): Plank => ({ o: 'flat-z', tilt: (t * 180) / Math.PI, x: x + d + 1.5, y: 13 - 5 / 3 + 0.5 * Math.cos(t) + 0.02, z: z + 15 + 0.5 * Math.sin(t) })),
    'L’auvent : quatre planchettes penchées, posées dessus, qui descendent vers la rue',
  );
}

// ---- street ----
add([20, 24.5, 29].map((z) => at('flat-x', CX - 7.5, 0, z)), 'Le passage piéton, devant la mairie');
add([-10, 9].map((d) => at('up-z', CX + d, 0, 30)), 'Deux lampadaires');

export const petiteVille: Model = { id: 'petite-ville', name: 'Petite ville', theme: 'maisons', difficulty: 3, steps };
export default petiteVille;
