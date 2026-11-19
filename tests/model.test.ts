import { expect, test } from 'vitest';
import { overlaps } from '../src/geometry';
import { chunk, count, logWall, placed, type Model } from '../src/model';

test('logWall: 2 planks per layer, alternating, no overlap', () => {
  const w = logWall(0, 0, 0, 4);
  expect(w).toHaveLength(8);
  expect(w[0].o).toBe('flat-x');
  expect(w[2].o).toBe('flat-z');
  expect(w[7].y).toBe(3.5);
  for (const a of w) for (const b of w) if (a !== b) expect(overlaps(a, b)).toBe(false);
});

test('placed splits old and fresh', () => {
  const m: Model = { id: 't', name: 'T', theme: 'tours', difficulty: 1, steps: chunk(logWall(0, 0, 0, 4), 3) };
  expect(m.steps.map((s) => s.planks.length)).toEqual([3, 3, 2]);
  expect(count(m)).toBe(8);
  expect(placed(m, 1)).toEqual({ old: m.steps[0].planks, fresh: m.steps[1].planks });
});
