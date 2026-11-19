import { beforeAll, describe, expect, test } from 'vitest';
import { box, overlaps } from '../src/geometry';
import { count } from '../src/model';
import { MODELS } from '../src/models';
import { initPhysics, isStable, lastFailure } from '../src/physics';

beforeAll(initPhysics);

test('ids are unique', () => expect(new Set(MODELS.map((m) => m.id)).size).toBe(MODELS.length));
test('lot 1 models are there', () => expect(MODELS.map((m) => m.id)).toEqual(['cabane', 'voiture', 'girafe', 'tour']));

describe.each(MODELS)('$name', (m) => {
  test('fits the box of 200', () => expect(count(m)).toBeLessThanOrEqual(200));

  test('every step adds 3 to 8 planks', () => {
    for (const s of m.steps) {
      expect(s.planks.length).toBeGreaterThanOrEqual(3);
      expect(s.planks.length).toBeLessThanOrEqual(8);
    }
  });

  test('no plank overlaps another, nothing below ground', () => {
    const all = m.steps.flatMap((s) => s.planks);
    all.forEach((a, i) => {
      expect(box(a).min[1]).toBeGreaterThanOrEqual(0);
      all.slice(i + 1).forEach((b) => expect(overlaps(a, b), JSON.stringify([a, b])).toBe(false));
    });
  });

  test('stands at every plank', { timeout: 300_000 }, () => {
    expect(isStable(m.steps.flatMap((s) => s.planks)), JSON.stringify(lastFailure)).toBe(true);
  });
});
