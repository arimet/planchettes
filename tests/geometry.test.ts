import { expect, test } from 'vitest';
import { at, overlaps, size } from '../src/geometry';

test('size per orientation', () => {
  expect(size('flat-x')).toEqual([15, 1, 3]);
  expect(size('flat-z')).toEqual([3, 1, 15]);
  expect(size('edge-x')).toEqual([15, 3, 1]);
  expect(size('edge-z')).toEqual([1, 3, 15]);
  expect(size('up-x')).toEqual([3, 15, 1]);
  expect(size('up-z')).toEqual([1, 15, 3]);
});

test('at() converts min corner to center', () => {
  expect(at('flat-x', 0, 0, 0)).toEqual({ x: 7.5, y: 0.5, z: 1.5, o: 'flat-x' });
});

test('touching planks do not overlap, crossing ones do', () => {
  const a = at('flat-x', 0, 0, 0);
  expect(overlaps(a, at('flat-x', 0, 1, 0))).toBe(false); // stacked
  expect(overlaps(a, at('flat-x', 0, 0, 3))).toBe(false); // side by side
  expect(overlaps(a, at('flat-z', 6, 0, 0))).toBe(true); // same layer, crossing
});
