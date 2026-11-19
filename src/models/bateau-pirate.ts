import { at, spin, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// Pirate ship, bow toward +x. Each hull layer is a boat outline: a transom, two straight sides and
// two bow planks turned in until they touch the stem post (a standing plank at the bow). Every
// layer is a little wider than the one below and its stern a little further back (the hull flares).
// On the deck: a raised stern castle, then a mast with a square sail of standing planks and yards.
const LAYERS = 9; // full hull layers
const BOW = 4; // bow-only layers above the deck
const P = 30; // the stem post stands on x = P..P+3

function hullLayer(i: number, deckEnd = -Infinity): Plank[] {
  const w = 5.5 + 0.3 * i; // outer half width of the sides
  // bow plank turned by t around its outer back corner, its inner front corner touching the post
  let t = 0;
  while (w - 15 * Math.sin(t) - 3 * Math.cos(t) > 0.5) t += 0.0005;
  let xj = P + 2.8 - (2.6 * i) / (LAYERS + BOW - 1) - 15 * Math.cos(t) + 3 * Math.sin(t);
  xj = Math.max(xj, deckEnd + 3 * Math.sin(t) + 0.05); // bow-only layers clear the deck
  const xa = xj - 3 * Math.sin(t) - 15.05; // a gap so the bow plank's back corner clears the side's end
  const deg = (t * 180) / Math.PI;
  const bow = [spin(at('flat-x', xj, i, w - 3), deg, xj, w), spin(at('flat-x', xj, i, -w), -deg, xj, -w)];
  if (i >= LAYERS) return bow;
  return [at('flat-z', xa - 3, i, -7.5), at('flat-x', xa, i, w - 3), at('flat-x', xa, i, -w), ...bow];
}

const H = LAYERS; // deck height
const X = hullLayer(LAYERS - 1)[1].x - 7.5; // the deck starts where the top sides start
const deck = Array.from({ length: 5 }, (_, j) => at('flat-z', X + 3 * j, H, -7.5));

// stern castle: log-cabin walls on the back 4 deck planks, overhanging the stern by 4
const sides = (y: number) => [at('flat-x', X - 4, y, 4.5), at('flat-x', X - 4, y, -7.5)];
const ends = (y: number) => [at('flat-z', X + 8, y, -7.5), at('flat-z', X - 4, y, -7.5)];
const roof = Array.from({ length: 5 }, (_, j) => at('flat-x', X - 4, H + 5, -7.5 + 3 * j));

// mast: 2 standing planks on the last deck plank; the sail stands just behind it, its middle
// planks one step further back so it looks puffed. The yard ties their tops, the top mast
// (3 planks standing side by side) carries the top yard.
const M = X + 12; // the yard and top mast's back edge
const sail = [-7.5, -4.5, -1.5, 1.5, 4.5].map((z, j) => at('up-z', M - (j % 4 ? 1 : 0), H + 1, z));
const yard = (y: number) => at('flat-z', M, y, -7.5);

const steps: Step[] = [
  { planks: [at('up-x', P, 0, -0.5)], hint: 'La proue, debout' },
  ...Array.from({ length: LAYERS }, (_, i) => ({
    planks: hullLayer(i),
    ...(i === 0 && { hint: 'Le fond du bateau : l’avant touche la proue' }),
    ...(i === 1 && { hint: 'Chaque étage dépasse un peu vers l’extérieur' }),
  })),
  { planks: deck, hint: 'Le pont, en travers' },
  ...Array.from({ length: BOW }, (_, i) => ({ planks: hullLayer(LAYERS + i, X + 15), ...(i === 0 && { hint: 'L’avant monte plus haut que le pont' }) })),
  { planks: sides(H + 1), hint: 'Le château arrière dépasse derrière' },
  { planks: ends(H + 2) },
  { planks: sides(H + 3) },
  { planks: ends(H + 4) },
  { planks: roof },
  { planks: [at('up-z', M + 1, H + 1, -1.5), at('up-z', M + 2, H + 1, -1.5)], hint: 'Le mât : deux planchettes debout' },
  { planks: sail, hint: 'La voile derrière le mât, le milieu gonflé' },
  { planks: [yard(H + 16)], hint: 'La vergue couchée en travers' },
  { planks: [-1.5, -0.5, 0.5].map((z) => at('up-x', M, H + 17, z)), hint: 'Le haut du mât, trois planchettes collées' },
  { planks: [yard(H + 32)] },
];

export const bateauPirate: Model = { id: 'bateau-pirate', name: 'Bateau pirate', theme: 'originaux', difficulty: 3, steps };
export default bateauPirate;
