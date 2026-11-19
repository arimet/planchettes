import { expect, test } from 'vitest';
import { at } from '../src/geometry';
import { planSvg } from '../src/plan2d';

const old = [at('flat-x', 0, 0, 0)];
const fresh = [at('flat-z', 0, 1, 0), at('flat-z', 12, 1, 0)];

test('front view: one rect per plank, fresh numbered in order', () => {
  const svg = planSvg(old, fresh, 'front');
  expect(svg.match(/<rect/g)).toHaveLength(3);
  expect(svg.match(/class="fresh"/g)).toHaveLength(2);
  expect([...svg.matchAll(/class="order"[^>]*>(\d+)</g)].map((m) => m[1])).toEqual(['1', '2']);
});

test('top view: lower layer is faded', () => {
  expect(planSvg(old, fresh, 'top')).toMatch(/class="old"[^>]*opacity="0.35"/);
});

test('empty old list works (first step)', () => {
  expect(planSvg([], fresh, 'top')).toContain('<svg');
});

const labels = (svg: string) => [...svg.matchAll(/class="order"[^>]*>([^<]+)</g)].map((m) => m[1]);

test('labels of side-by-side thin planks merge instead of colliding', () => {
  const neck = [at('up-z', 12, 0, 6), at('up-z', 13, 0, 6)];
  expect(labels(planSvg([], neck, 'front'))).toEqual(['1·2']);
});

test('a label hidden under a later plank is not drawn', () => {
  const neck = [at('up-z', 12, 0, 6), at('up-z', 13, 0, 6), at('flat-x', 5.5, 15, 6)];
  expect(labels(planSvg([], neck, 'top'))).toEqual(['3']);
});
