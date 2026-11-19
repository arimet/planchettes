import { Matrix4, Quaternion, Vector3 } from 'three';

// A plank is 1 × 3 × 15 units (thickness × width × length); 1 unit = 7.8 mm.
export type Orientation = 'flat-x' | 'flat-z' | 'edge-x' | 'edge-z' | 'up-x' | 'up-z';
export type Vec3 = [number, number, number];
/**
 * x, y, z = center. yaw = degrees around the vertical axis (counterclockwise seen from above).
 * tilt = degrees in the vertical plane of the plank's length, applied before yaw.
 */
export type Plank = { x: number; y: number; z: number; o: Orientation; yaw?: number; tilt?: number };

export const HALF = new Vector3(7.5, 0.5, 1.5); // the plank lying along x

const SIZES: Record<Orientation, Vec3> = {
  'flat-x': [15, 1, 3],
  'flat-z': [3, 1, 15],
  'edge-x': [15, 3, 1],
  'edge-z': [1, 3, 15],
  'up-x': [3, 15, 1],
  'up-z': [1, 15, 3],
};

/** Axis-aligned extents before yaw and tilt. */
export const size = (o: Orientation): Vec3 => SIZES[o];

const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
const q = (axis: Vector3, deg: number) => new Quaternion().setFromAxisAngle(axis, (deg * Math.PI) / 180);

// rotations taking the (15, 1, 3) plank to each orientation's extents
const BASE: Record<Orientation, Quaternion> = {
  'flat-x': new Quaternion(),
  'flat-z': q(Y, 90),
  'edge-x': q(X, 90),
  'edge-z': q(Y, 90).multiply(q(X, 90)),
  'up-z': q(Z, 90),
  'up-x': q(Y, 90).multiply(q(Z, 90)),
};

export function rotation(p: Plank): Quaternion {
  const tiltAxis = p.o.endsWith('-x') ? Z : X;
  return q(Y, p.yaw ?? 0).multiply(q(tiltAxis, p.tilt ?? 0)).multiply(BASE[p.o]);
}

/** The plank's 3 unit axes (rows of its rotation) and center. */
function frame(p: Plank): { c: Vector3; axes: Vector3[] } {
  const m = new Matrix4().makeRotationFromQuaternion(rotation(p));
  const axes = [new Vector3(), new Vector3(), new Vector3()];
  m.extractBasis(axes[0], axes[1], axes[2]);
  return { c: new Vector3(p.x, p.y, p.z), axes };
}

const h = [HALF.x, HALF.y, HALF.z];

export function corners(p: Plank): Vector3[] {
  const { c, axes } = frame(p);
  const out: Vector3[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
    out.push(c.clone().addScaledVector(axes[0], sx * h[0]).addScaledVector(axes[1], sy * h[1]).addScaledVector(axes[2], sz * h[2]));
  return out;
}

export function box(p: Plank): { min: Vec3; max: Vec3 } {
  const pts = corners(p);
  const min = [0, 1, 2].map((i) => Math.min(...pts.map((v) => v.getComponent(i)))) as Vec3;
  const max = [0, 1, 2].map((i) => Math.max(...pts.map((v) => v.getComponent(i)))) as Vec3;
  return { min, max };
}

const TOUCH = 0.01; // penetration below this counts as touching

/** Separating axis test on the two oriented boxes: touching faces do not count. */
export function overlaps(a: Plank, b: Plank): boolean {
  const A = frame(a);
  const B = frame(b);
  const d = B.c.clone().sub(A.c);
  const axes = [...A.axes, ...B.axes];
  for (const u of A.axes) for (const v of B.axes) {
    const c = u.clone().cross(v);
    if (c.lengthSq() > 1e-9) axes.push(c.normalize());
  }
  for (const n of axes) {
    const ra = A.axes.reduce((s, u, i) => s + Math.abs(u.dot(n)) * h[i], 0);
    const rb = B.axes.reduce((s, v, i) => s + Math.abs(v.dot(n)) * h[i], 0);
    if (Math.abs(d.dot(n)) > ra + rb - TOUCH) return false;
  }
  return true;
}

/** Builds an axis-aligned plank from its min corner. */
export function at(o: Orientation, x: number, y: number, z: number): Plank {
  const [sx, sy, sz] = size(o);
  return { x: x + sx / 2, y: y + sy / 2, z: z + sz / 2, o };
}

/** Rotates a plank by deg around the vertical axis through (cx, cz). */
export function spin(p: Plank, deg: number, cx: number, cz: number): Plank {
  const r = (deg * Math.PI) / 180;
  const dx = p.x - cx;
  const dz = p.z - cz;
  return { ...p, x: cx + dx * Math.cos(r) + dz * Math.sin(r), z: cz - dx * Math.sin(r) + dz * Math.cos(r), yaw: (p.yaw ?? 0) + deg };
}
