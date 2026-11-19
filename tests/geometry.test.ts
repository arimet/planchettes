import { expect, test } from 'vitest';
import { at, box, overlaps, size, spin } from '../src/geometry';

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

test('yaw and tilt rotate the box', () => {
  const p = { ...at('flat-x', 0, 0, 0), yaw: 90 };
  const b = box(p);
  expect(b.max[0] - b.min[0]).toBeCloseTo(3);
  expect(b.max[2] - b.min[2]).toBeCloseTo(15);
  const t = box({ ...at('flat-x', 0, 0, 0), tilt: 90 });
  expect(t.max[1] - t.min[1]).toBeCloseTo(15);
});

test('rotated planks: SAT overlap', () => {
  const a = at('flat-x', 0, 0, 0); // x 0..15, z 0..3
  // same layer, rotated 45° around its own center: crosses a
  expect(overlaps(a, { ...a, yaw: 45 })).toBe(true);
  // one layer up, rotated: resting on it, no overlap
  expect(overlaps(a, { ...at('flat-x', 0, 1, 0), yaw: 30 })).toBe(false);
  // far away diagonal: AABBs touch but boxes do not
  const d = { ...at('flat-x', 0, 0, 0), x: 7.5 + 9, z: 1.5 + 9, yaw: 45 };
  expect(overlaps(a, d)).toBe(false);
});

test('spin() rotates a plank around a vertical axis', () => {
  const p = spin(at('flat-x', 0, 0, 0), 90, 0, 0); // center (7.5, .5, 1.5) around origin
  expect(p.x).toBeCloseTo(1.5);
  expect(p.z).toBeCloseTo(-7.5);
  expect(p.yaw).toBe(90);
});
