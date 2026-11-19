// A plank is 1 × 3 × 15 units (thickness × width × length); 1 unit = 7.8 mm.
export type Orientation = 'flat-x' | 'flat-z' | 'edge-x' | 'edge-z' | 'up-x' | 'up-z';
export type Vec3 = [number, number, number];
/** x, y, z = center of the plank */
export type Plank = { x: number; y: number; z: number; o: Orientation };

const SIZES: Record<Orientation, Vec3> = {
  'flat-x': [15, 1, 3],
  'flat-z': [3, 1, 15],
  'edge-x': [15, 3, 1],
  'edge-z': [1, 3, 15],
  'up-x': [3, 15, 1],
  'up-z': [1, 15, 3],
};

export const size = (o: Orientation): Vec3 => SIZES[o];

export function box(p: Plank): { min: Vec3; max: Vec3 } {
  const [sx, sy, sz] = size(p.o);
  return {
    min: [p.x - sx / 2, p.y - sy / 2, p.z - sz / 2],
    max: [p.x + sx / 2, p.y + sy / 2, p.z + sz / 2],
  };
}

const EPS = 1e-6;

/** Positive-volume intersection only: touching faces do not count. */
export function overlaps(a: Plank, b: Plank): boolean {
  const A = box(a);
  const B = box(b);
  return [0, 1, 2].every((i) => A.min[i] < B.max[i] - EPS && B.min[i] < A.max[i] - EPS);
}

/** Builds a plank from its min corner. */
export function at(o: Orientation, x: number, y: number, z: number): Plank {
  const [sx, sy, sz] = size(o);
  return { x: x + sx / 2, y: y + sy / 2, z: z + sz / 2, o };
}
