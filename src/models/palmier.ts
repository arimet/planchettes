import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Palm tree. Trunk: three tubes of 4 standing planks with two lying planks between them, each tube a
// bit further along so the trunk leans. Head: a square deck, 4 long fronds on its diagonals (two
// planks thick), two more decks, a pinwheel of 4 flat fronds and 4 fronds leaning on them. Last, 4
// drooping fronds slid into the gap between the decks: each one lies on the edge of the lower deck
// and its tail pushes up under the upper deck, so the weight of the head holds it.

const LEAN = 1;
const C = 2.5 * LEAN; // axis of the head
const H = 49; // top of the lower deck
const tube = (cx: number, y: number): Plank[] => [
  at('up-x', cx - 1.5, y, 1.1), at('up-x', cx - 1.5, y, -2.1), at('up-z', cx + 1.7, y, -1.5), at('up-z', cx - 2.7, y, -1.5),
];
const pair = (cx: number, y: number): Plank[] => [at('flat-x', cx - 7.5, y, -3.1), at('flat-x', cx - 7.5, y, 0.1)];
const deck = (y: number): Plank[] => [-1.5, -4.5, 1.5, -7.5, 4.5].map((x) => at('flat-z', C + x, y, -7.5));
const quarter = (p: Plank, turns = [0, 90, 180, 270]): Plank[] => turns.map((k) => spin(p, k, C, 0));

// leaning frond on the top deck: lies on a ridge (RIDGE from the axis, 1 above the deck) and on the deck edge (RIM)
const RIDGE = 4;
const RIM = 8.25;
const T = Math.atan2(1, RIM - RIDGE);
const LEN = (-1 - RIDGE) / Math.cos(T) + 7.5; // from the ridge to the middle of the plank
const leaning = (h: number): Plank => (
  { o: 'flat-x', x: C + RIDGE + LEN * Math.cos(T) + 0.52 * Math.sin(T), y: h + 1 - LEN * Math.sin(T) + 0.52 * Math.cos(T), z: 3, tilt: (-T * 180) / Math.PI }
);
/** top deck, turned so its edges reach RIM right where the leaning fronds lie */
const wideDeck = (y: number): Plank[] => [
  at('flat-z', C - 1.5, y, -7.5), at('flat-z', C - 4.5, y, RIM - 15), at('flat-z', C + 1.5, y, -RIM), at('flat-z', C - RIM, y, -7.5), at('flat-z', C + RIM - 3, y, -7.5),
].map((p) => spin(p, 90, C, 0));
// drooping frond: its underside on the edge of the lower deck (7.5 from the axis, height h), the top
// of its tail under the upper deck (4 from the axis, 2 higher). Bisection for the angle that fits.
const droop = (h: number): Plank => {
  const gap = 2 - 0.04;
  const tail = (t: number) => 7.5 + ((Math.cos(t) - gap) * Math.cos(t)) / Math.sin(t) + Math.sin(t);
  let [lo, hi] = [0.05, 1];
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (tail(mid) < 4) lo = mid; else hi = mid; }
  const len = (Math.cos(lo) - gap) / Math.sin(lo) + 7.5; // from the deck edge to the middle of the plank
  return { o: 'flat-x', x: C + 7.5 + len * Math.cos(lo) + 0.5 * Math.sin(lo), y: h + 0.02 - len * Math.sin(lo) + 0.5 * Math.cos(lo), z: 0, tilt: (-lo * 180) / Math.PI };
};
const diagonals = (y: number): Plank[] => quarter(spin(at('flat-x', C + 1.6, y, -1.5), 45, C, 0));

const steps: Step[] = [
  { planks: tube(0, 0), hint: 'Le tronc : 4 planchettes debout, en carré' },
  { planks: pair(0.5 * LEAN, 15), hint: 'Deux planchettes couchées dessus' },
  { planks: tube(LEAN, 16), hint: 'Encore 4 debout, un peu décalées : le tronc penche' },
  { planks: pair(1.5 * LEAN, 31) },
  { planks: tube(2 * LEAN, 32) },
  { planks: pair(C, 47) },
  { planks: deck(H - 1), hint: 'Un plateau : 5 planchettes en travers' },
  { planks: diagonals(H), hint: 'Quatre grandes palmes vers les coins' },
  { planks: diagonals(H + 1), hint: 'Pareil par-dessus' },
  { planks: deck(H + 2), hint: 'Un deuxième plateau' },
  { planks: wideDeck(H + 3), hint: 'Un troisième en travers, un peu écarté' },
  { planks: quarter(at('flat-x', C - 1, H + 4, -RIDGE)), hint: 'Quatre palmes en moulinet' },
  { planks: quarter(leaning(H + 4)), hint: 'Quatre palmes penchées : le haut sur une palme, le bas sur le bord du plateau' },
  // the one against the lean first
  { planks: quarter(droop(H), [180, 90, 270, 0]), hint: 'Les palmes qui tombent : glisse-les entre les deux plateaux, elles restent coincées' },
];

export const palmier: Model = { id: 'palmier', name: 'Palmier', theme: 'originaux', difficulty: 3, steps };
export default palmier;
