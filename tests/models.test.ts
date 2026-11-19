import { beforeAll, describe, expect, test } from 'vitest';
import { MODELS } from '../src/models';
import { initPhysics } from '../src/physics';
import { checkModel } from './checks';

beforeAll(initPhysics);

test('ids are unique', () => expect(new Set(MODELS.map((m) => m.id)).size).toBe(MODELS.length));

describe.each(MODELS)('$name', (m) => checkModel(m));
