import { beforeAll, expect, test } from 'vitest';
import { at } from '../src/geometry';
import { logWall } from '../src/model';
import { hasMargin, initPhysics, isStable } from '../src/physics';

beforeAll(initPhysics);

test('a plank on the ground stays put', () => {
  expect(isStable([at('flat-x', 0, 0, 0)])).toBe(true);
});

test('a lone standing plank stays up', () => {
  expect(isStable([at('up-x', 0, 0, 0)])).toBe(true);
});

test('a plank overhanging by 10 of 15 falls', () => {
  expect(isStable([at('flat-x', 0, 0, 0), at('flat-x', 10, 1, 0)])).toBe(false);
});

test('a log wall of 10 layers stands', () => {
  expect(isStable(logWall(0, 0, 0, 10))).toBe(true);
});

test('sensitivity: overhang 8 of 15 falls, 6 of 15 holds', () => {
  expect(isStable([at('flat-x', 0, 0, 0), at('flat-x', 8, 1, 0)])).toBe(false);
  expect(isStable([at('flat-x', 0, 0, 0), at('flat-x', 6, 1, 0)])).toBe(true);
});

test('a tilted plank leaning on a wall stays, a lone tilted one falls', () => {
  // a plank tilted 20° has nothing holding it: it falls flat
  expect(isStable([{ ...at('flat-x', 0, 2.5, 0), tilt: 20 }])).toBe(false);
});

test('margin: a roof resting on 0.5 unit falls with ±4 mm, on 3 units it holds', () => {
  // two log-wall posts, 6 high, so a falling plank drops far
  const posts = (gap: number) => [...logWall(0, 0, 0, 6), ...logWall(15 + gap, 0, 0, 6)];
  // bridge plank over a gap: 14 gap → 0.5 support each side; 9 gap → 3 each side
  expect(hasMargin([...posts(14), at('flat-x', 14.5, 6, 6)])).toBe(false);
  expect(hasMargin([...posts(9), at('flat-x', 12, 6, 6)])).toBe(true);
});
