import { at, type Plank } from './geometry';

export type Theme = 'maisons' | 'vehicules' | 'animaux' | 'tours' | 'ponts' | 'originaux';
/** planks order = placing order */
export type Step = { planks: Plank[]; hint?: string };
export type Model = { id: string; name: string; theme: Theme; difficulty: 1 | 2 | 3; steps: Step[] };

export const THEMES: Record<Theme, string> = {
  maisons: 'Maisons',
  vehicules: 'Véhicules',
  animaux: 'Animaux',
  tours: 'Tours',
  ponts: 'Ponts',
  originaux: 'Originaux',
};

export const count = (m: Model): number => m.steps.reduce((n, s) => n + s.planks.length, 0);

/** step is 0-based: old = planks of earlier steps, fresh = planks of this step */
export function placed(m: Model, step: number): { old: Plank[]; fresh: Plank[] } {
  return { old: m.steps.slice(0, step).flatMap((s) => s.planks), fresh: m.steps[step]?.planks ?? [] };
}

/** Log-cabin square, 15 × 15 outer footprint, min corner (x, y, z), bottom up. */
export function logWall(x: number, z: number, y: number, layers: number): Plank[] {
  const out: Plank[] = [];
  for (let i = 0; i < layers; i++) {
    if (i % 2 === 0) out.push(at('flat-x', x, y + i, z), at('flat-x', x, y + i, z + 12));
    else out.push(at('flat-z', x, y + i, z), at('flat-z', x + 12, y + i, z));
  }
  return out;
}

export function chunk(planks: Plank[], size: number, hint?: string): Step[] {
  const out: Step[] = [];
  for (let i = 0; i < planks.length; i += size) out.push({ planks: planks.slice(i, i + size), ...(hint && { hint }) });
  return out;
}
