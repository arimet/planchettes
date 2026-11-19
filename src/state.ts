import type { Model } from './model';

export type Route = { page: 'home' } | { page: 'notice'; model: Model };

export function parseRoute(hash: string, models: Model[]): Route {
  const id = /^#\/m\/([\w-]+)$/.exec(hash)?.[1];
  const model = models.find((m) => m.id === id);
  return model ? { page: 'notice', model } : { page: 'home' };
}

export const clampStep = (n: number, stepCount: number): number =>
  Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), 0), stepCount - 1) : 0;

const key = (id: string) => `planchettes:step:${id}`;

// localStorage can be missing or throw (private mode, blocked storage): progress is a convenience.
export function loadStep(id: string, storage?: Storage): number {
  try {
    return Number((storage ?? globalThis.localStorage).getItem(key(id)) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function saveStep(id: string, step: number, storage?: Storage): void {
  try {
    (storage ?? globalThis.localStorage).setItem(key(id), String(step));
  } catch {
    // ignore
  }
}
