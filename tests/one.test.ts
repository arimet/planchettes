// Checks a single model file while it is being designed:
//   MODEL=src/models/chateau.ts npx vitest run tests/one.test.ts
import { beforeAll, describe, test } from 'vitest';
import { resolve } from 'node:path';
import type { Model } from '../src/model';
import { initPhysics } from '../src/physics';
import { checkModel } from './checks';

const file = process.env.MODEL;
if (!file) test.skip('set MODEL=src/models/<file>.ts', () => {});
else {
  const mod = await import(resolve(file));
  const m: Model = mod.default ?? Object.values(mod)[0];
  beforeAll(initPhysics);
  describe(m.name, () => checkModel(m));
}
