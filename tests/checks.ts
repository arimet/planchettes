import { expect, test } from 'vitest';
import { box, overlaps } from '../src/geometry';
import { count, placed, type Model } from '../src/model';
import { hasMargin, isStable, lastFailure } from '../src/physics';
import { planSvg } from '../src/plan2d';

/** Every rule a model must pass. Call inside a describe, after initPhysics. */
export function checkModel(m: Model) {
  test('fits the box of 200', () => expect(count(m)).toBeLessThanOrEqual(200));

  test('every step adds 1 to 8 planks', () => {
    for (const s of m.steps) {
      expect(s.planks.length).toBeGreaterThanOrEqual(1);
      expect(s.planks.length).toBeLessThanOrEqual(8);
    }
  });

  test('no plank overlaps another, nothing below ground', () => {
    const all = m.steps.flatMap((s) => s.planks);
    all.forEach((a, i) => {
      expect(box(a).min[1]).toBeGreaterThanOrEqual(-1e-6);
      all.slice(i + 1).forEach((b) => expect(overlaps(a, b), JSON.stringify([a, b])).toBe(false));
    });
  });

  test('every new plank has its number in the top or front plan', () => {
    m.steps.forEach((_, i) => {
      const { old, fresh } = placed(m, i);
      const shown = new Set(
        [planSvg(old, fresh, 'top'), planSvg(old, fresh, 'front')]
          .flatMap((svg) => [...svg.matchAll(/class="order"[^>]*>([^<]+)</g)])
          .flatMap((x) => x[1].split('·')),
      );
      fresh.forEach((_, k) => expect(shown.has(String(k + 1)), `step ${i + 1}, plank ${k + 1}`).toBe(true));
    });
  });

  test('survives a child placing planks ±4 mm off', { timeout: 120_000 }, () => {
    expect(hasMargin(m.steps.flatMap((s) => s.planks)), JSON.stringify(lastFailure)).toBe(true);
  });

  test('stands at every plank', { timeout: 300_000 }, () => {
    expect(isStable(m.steps.flatMap((s) => s.planks)), JSON.stringify(lastFailure)).toBe(true);
  });
}
