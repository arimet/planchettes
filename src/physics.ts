// Dev-time stability check: imported by tests only, never by the app bundle.
import RAPIER from '@dimforge/rapier3d-compat';
import { overlaps, size, type Plank } from './geometry';

// Tune these after real builds.
// Real g in units/s² = slow motion (×35): far less contact penetration than g/0.0078 with the same verdicts.
export const GRAVITY = 9.81;
export const FRICTION = 0.5;
export const DT = 1 / 120;
export const DURATION = 4; // s of slow-motion time
export const MAX_MOVE = 0.3; // units
export const MAX_TURN_DEG = 3;
export const JITTER = 0.15; // units, ≈ 1 mm
const SEEDS = [1, 2, 3];

let ready: Promise<void> | undefined;
export const initPhysics = (): Promise<void> => (ready ??= RAPIER.init());

export function settle(planks: Plank[]): { maxMove: number; maxTurnDeg: number } {
  const world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
  world.timestep = DT;
  world.createCollider(RAPIER.ColliderDesc.cuboid(500, 1, 500).setTranslation(0, -1, 0).setFriction(FRICTION));
  const bodies = planks.map((p) => {
    const b = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z));
    const [sx, sy, sz] = size(p.o);
    world.createCollider(RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2).setFriction(FRICTION).setRestitution(0), b);
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
    // bodies start with identity rotation, so the turn angle is 2·acos(|w|)
    maxTurnDeg = Math.max(maxTurnDeg, (2 * Math.acos(Math.min(1, Math.abs(b.rotation().w))) * 180) / Math.PI);
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
export function jitter(planks: Plank[], seed: number): Plank[] {
  const rnd = mulberry32(seed);
  const out: Plank[] = [];
  for (const p of planks) {
    let q = p;
    for (let i = 0; i < 5; i++) {
      const c = { ...p, x: p.x + (rnd() * 2 - 1) * JITTER, z: p.z + (rnd() * 2 - 1) * JITTER };
      if (!out.some((o) => overlaps(o, c))) { q = c; break; }
    }
    out.push(q);
  }
  return out;
}

export let lastFailure: { k: number; seed: number; maxMove: number; maxTurnDeg: number } | null = null;

// ponytail: re-simulates from scratch per prefix (O(n²) steps); incremental world if Lot 3 models get too slow.
export function isStable(planks: Plank[]): boolean {
  lastFailure = null;
  for (let k = 1; k <= planks.length; k++) {
    for (const seed of SEEDS) {
      const r = settle(jitter(planks.slice(0, k), seed));
      if (r.maxMove > MAX_MOVE || r.maxTurnDeg > MAX_TURN_DEG) {
        lastFailure = { k, seed, ...r };
        return false;
      }
    }
  }
  return true;
}
