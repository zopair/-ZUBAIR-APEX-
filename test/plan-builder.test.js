import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExecutionPlan } from '../src/orchestration/plan-builder.js';

test('groups independent agent tasks into parallel stages', () => {
  const plan = buildExecutionPlan([
    { id: 'research', role: 'researcher', dependsOn: [] },
    { id: 'architect', role: 'architect', dependsOn: [] },
    { id: 'implement', role: 'engineer', dependsOn: ['architect'] },
    { id: 'audit', role: 'auditor', dependsOn: ['research', 'implement'] },
  ]);
  assert.deepEqual(plan.stages.map((stage) => stage.map((task) => task.id)), [
    ['research', 'architect'], ['implement'], ['audit'],
  ]);
});

test('rejects duplicate task identifiers', () => {
  assert.throws(() => buildExecutionPlan([
    { id: 'same', role: 'researcher', dependsOn: [] },
    { id: 'same', role: 'auditor', dependsOn: [] },
  ]), { code: 'DUPLICATE_TASK_ID' });
});

test('rejects dependencies that do not exist', () => {
  assert.throws(() => buildExecutionPlan([
    { id: 'build', role: 'engineer', dependsOn: ['missing'] },
  ]), { code: 'UNKNOWN_DEPENDENCY' });
});

test('rejects cyclic task dependencies', () => {
  assert.throws(() => buildExecutionPlan([
    { id: 'a', role: 'planner', dependsOn: ['b'] },
    { id: 'b', role: 'engineer', dependsOn: ['a'] },
  ]), { code: 'DEPENDENCY_CYCLE' });
});

test('rejects malformed task definitions', () => {
  assert.throws(() => buildExecutionPlan([
    { id: '', role: 'engineer', dependsOn: [] },
  ]), { code: 'INVALID_TASK' });
});
