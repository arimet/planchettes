import { at, box, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A corbelled dome: every floor is a ring of flat planks around the same center, each ring a bit
// smaller than the one below and turned half a plank so it bridges the joints. Rings drop a plank
// whenever they get too small (7, 6, 5, 4, 3), a lid closes the top, and a tunnel sticks out in front (+z).
const R = 21; // radius at the ground; the dome is a half ball

type Ring = { n: number; a: number };

/** n flat planks, inner edge at distance a from the center (0, 0), turned by deg. */
const ring = ({ n, a }: Ring, y: number, deg: number): Plank[] =>
  Array.from({ length: n }, (_, k) => spin(at('flat-x', -7.5, y, a), deg + (k * 360) / n, 0, 0));

/** Ring whose plank corners reach radius r, with as many planks as fit without touching. */
function fit(r: number): Ring | undefined {
  const a = Math.sqrt(r * r - 7.5 ** 2) - 3;
  const n = [7, 6, 5, 4, 3].find((n) => a >= 7.5 / Math.tan(Math.PI / n) + 0.3);
  return n ? { n, a } : undefined;
}

const dome: Plank[][] = [];
for (let y = 0; ; y++) {
  const f = fit(R * Math.sqrt(1 - (y / R) ** 2));
  if (!f) break;
  dome.push(ring(f, y, y % 2 ? 180 / f.n : 0));
}
const top = dome.length;
const lid = [-4.5, -1.5, 1.5].map((x) => at('flat-z', x, top, -7.5));

// Tunnel: two low walls of flat planks along z, a roof across, a ridge on top.
const z0 = Math.max(...dome.slice(0, 6).flat().filter((p) => Math.abs(p.x) < 9).map((p) => box(p).max[2]));
const walls = [0, 1, 2, 3].flatMap((y) => [at('flat-z', -6, y, z0), at('flat-z', 3, y, z0)]);
const roof = [0, 1, 2, 3, 4].map((i) => at('flat-x', -7.5, 4, z0 + i * 3));
const ridge = [-4.5, -1.5, 1.5].map((x) => at('flat-z', x, 5, z0));

const steps: Step[] = [
  ...dome.map((planks, y) => ({
    planks,
    ...(y === 0 && { hint: 'Un grand cercle de planchettes couchées' }),
    ...(y === 1 && { hint: 'Chaque étage rentre un peu vers le milieu' }),
  })),
  { planks: lid, hint: 'Le couvercle ferme le trou du haut' },
  { planks: walls.slice(0, 4), hint: 'Deux petits murs devant : le tunnel' },
  { planks: walls.slice(4) },
  { planks: roof, hint: 'Le toit du tunnel, en travers' },
  { planks: ridge },
];

export const igloo: Model = { id: 'igloo', name: 'Igloo', theme: 'maisons', difficulty: 2, steps };

export default igloo;
