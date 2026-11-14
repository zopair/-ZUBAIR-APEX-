import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTaskContract } from '../src/contracts/task-contract.js';

const validContract = {
  id: 'research-brief',
  role: 'researcher',
  capability: 'research',
  input: { topic: 'model orchestration' },
  dependsOn: [],
  maxAttempts: 2,
};

test('normalizes a valid task contract and applies safe defaults', () => {
  const contract = validateTaskContract({
    id: 'draft',
    role: 'writer',
    capability: 'writing',
    input: { brief: 'Write a summary' },
  });

  assert.equal(contract.id, 'draft');
  assert.deepEqual(contract.dependsOn, []);
  assert.equal(contract.maxAttempts, 1);
  assert.equal(Object.isFrozen(contract), true);
  assert.equal(Object.isFrozen(contract.input), true);
});

test('preserves explicitly declared dependencies and bounded attempts', () => {
  const contract = validateTaskContract(validContract);
  assert.deepEqual(contract.dependsOn, []);
  assert.equal(contract.maxAttempts, 2);
});

test('rejects missing identity, role, or capability', () => {
  for (const patch of [
    { id: '' },
    { role: '' },
    { capability: '' },
  ]) {
    assert.throws(
      () => validateTaskContract({ ...validContract, ...patch }),
      { code: 'INVALID_TASK_CONTRACT' },
    );
  }
});

test('rejects non-object input and dependency lists', () => {
  assert.throws(
    () => validateTaskContract({ ...validContract, input: null }),
    { code: 'INVALID_TASK_CONTRACT' },
  );
  assert.throws(
    () => validateTaskContract({ ...validContract, dependsOn: 'research' }),
    { code: 'INVALID_TASK_CONTRACT' },
  );
});

test('rejects attempts outside the supported range', () => {
  for (const maxAttempts of [0, 6, 1.5, '3']) {
    assert.throws(
      () => validateTaskContract({ ...validContract, maxAttempts }),
      { code: 'INVALID_TASK_CONTRACT' },
    );
  }
});

test('does not mutate caller-owned input', () => {
  const input = { nested: { value: 1 } };
  const source = { ...validContract, input };
  validateTaskContract(source);
  assert.equal(Object.isFrozen(input), false);
  assert.equal(Object.isFrozen(input.nested), false);
});
