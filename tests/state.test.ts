import { expect, test } from 'vitest';
import { MODELS } from '../src/models';
import { clampStep, loadStep, parseRoute, saveStep } from '../src/state';

test('unknown id goes home', () => expect(parseRoute('#/m/nope', MODELS)).toEqual({ page: 'home' }));
test('empty hash goes home', () => expect(parseRoute('', MODELS)).toEqual({ page: 'home' }));
test('known id opens notice', () =>
  expect(parseRoute('#/m/girafe', MODELS)).toMatchObject({ page: 'notice', model: { id: 'girafe' } }));

test('clampStep', () => {
  expect(clampStep(99, 5)).toBe(4);
  expect(clampStep(-1, 5)).toBe(0);
  expect(clampStep(NaN, 5)).toBe(0);
  expect(clampStep(2.7, 5)).toBe(2);
});

test('throwing storage falls back to 0', () => {
  const bad = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } } as unknown as Storage;
  expect(loadStep('cabane', bad)).toBe(0);
  expect(() => saveStep('cabane', 3, bad)).not.toThrow();
});

test('saved step round-trips', () => {
  const m = new Map<string, string>();
  const s = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v) } as unknown as Storage;
  saveStep('cabane', 3, s);
  expect(loadStep('cabane', s)).toBe(3);
  expect(loadStep('tour', s)).toBe(0);
});
