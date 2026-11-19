import { beforeAll, expect, test } from 'vitest';
import { at } from '../src/geometry';
import { logWall } from '../src/model';
import { initPhysics, isStable } from '../src/physics';

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
