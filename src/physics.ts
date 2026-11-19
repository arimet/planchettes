// Dev-time stability check: imported by tests only, never by the app bundle.
import RAPIER from '@dimforge/rapier3d-compat';
import { Quaternion } from 'three';
import { HALF, overlaps, rotation, type Plank } from './geometry';

// Tune these after real builds.
// Real g in units/s²: 128× weaker than true scale (g / 7.8 mm), i.e. time runs ≈ 11× slower.
// Far less contact penetration, same verdicts (see the sensitivity test); 4 s ≈ 0.35 s of real time.
export const GRAVITY = 9.81;
export const FRICTION = 0.5;
export const DT = 1 / 120;
export const DURATION = 4; // s of slow-motion time
export const MAX_MOVE = 0.5; // units (a 36-floor stack settles ≈ 0.3 under its own weight)
export const MAX_TURN_DEG = 3;
export const JITTER = 0.15; // units, ≈ 1 mm: plank-by-plank check
export const MARGIN_JITTER = 0.5; // units, ≈ 4 mm: a child's real placing error
export const MARGIN_MOVE = 2; // units: settling is fine, collapsing is not
const SEEDS = [1, 2, 3];
const MARGIN_SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let ready: Promise<void> | undefined;
export const initPhysics = (): Promise<void> => (ready ??= RAPIER.init());

export function settle(planks: Plank[]): { maxMove: number; maxTurnDeg: number } {
  const world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
  world.timestep = DT;
  world.createCollider(RAPIER.ColliderDesc.cuboid(500, 1, 500).setTranslation(0, -1, 0).setFriction(FRICTION));
  const bodies = planks.map((p) => {
    const b = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setRotation(rotation(p)));
    world.createCollider(RAPIER.ColliderDesc.cuboid(HALF.x, HALF.y, HALF.z).setFriction(FRICTION).setRestitution(0), b);
    return b;
  });
  for (let t = 0; t < DURATION; t += DT) {
    world.step();
    if (bodies.every((b) => b.isSleeping())) break;
  }
  let maxMove = 0;
  let maxTurnDeg = 0;
  bodies.forEach((b, i) => {
    const p = b.translation();
    maxMove = Math.max(maxMove, Math.hypot(p.x - planks[i].x, p.y - planks[i].y, p.z - planks[i].z));
    const r = b.rotation();
    const turn = rotation(planks[i]).angleTo(new Quaternion(r.x, r.y, r.z, r.w));
    maxTurnDeg = Math.max(maxTurnDeg, (turn * 180) / Math.PI);
  });
  world.free();
  return { maxMove, maxTurnDeg };
}

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Child-like imprecision: x/z offsets in ±JITTER that never create an overlap. */
export function jitter(planks: Plank[], seed: number, amount = JITTER): Plank[] {
  const rnd = mulberry32(seed);
  const out: Plank[] = [];
  for (const p of planks) {
    let q = p;
    for (let i = 0; i < 5; i++) {
      const c = { ...p, x: p.x + (rnd() * 2 - 1) * amount, z: p.z + (rnd() * 2 - 1) * amount };
      if (!out.some((o) => overlaps(o, c))) { q = c; break; }
    }
    out.push(q);
  }
  return out;
}

export let lastFailure: { k: number; seed: number; maxMove: number; maxTurnDeg: number } | null = null;

// Note: re-simulates from scratch per prefix (O(n²) steps); incremental world if models get too slow.
/** Stands after every plank (one seed), and once finished (all seeds). */
export function isStable(planks: Plank[]): boolean {
  lastFailure = null;
  // a prefix of the jittered list is the jittered prefix: jitter once per seed
  const runs = SEEDS.map((seed) => jitter(planks, seed));
  for (let k = 1; k <= planks.length; k++) {
    for (const [i, jittered] of runs.entries()) {
      if (i > 0 && k < planks.length) continue;
      const r = settle(jittered.slice(0, k));
      if (r.maxMove > MAX_MOVE || r.maxTurnDeg > MAX_TURN_DEG) {
        lastFailure = { k, seed: SEEDS[i], ...r };
        return false;
      }
    }
  }
  return true;
}

/** The finished model survives a child's ±4 mm placing error without collapsing. */
export function hasMargin(planks: Plank[]): boolean {
  lastFailure = null;
  for (const seed of MARGIN_SEEDS) {
    const r = settle(jitter(planks, seed, MARGIN_JITTER));
    if (r.maxMove > MARGIN_MOVE) {
      lastFailure = { k: planks.length, seed, ...r };
      return false;
    }
  }
  return true;
}
