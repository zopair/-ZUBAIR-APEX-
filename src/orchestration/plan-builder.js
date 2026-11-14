/**
 * Build deterministic parallel execution stages from a dependency graph.
 * Tasks in the same stage have all dependencies satisfied by earlier stages.
 */
export function buildExecutionPlan(tasks) {
  if (!Array.isArray(tasks)) {
    throw createPlanError('INVALID_PLAN', 'Tasks must be an array.');
  }

  const ids = new Set();
  for (const task of tasks) {
    if (
      !task
      || typeof task.id !== 'string'
      || task.id.trim() === ''
      || typeof task.role !== 'string'
      || task.role.trim() === ''
      || !Array.isArray(task.dependsOn)
      || task.dependsOn.some((dependency) => typeof dependency !== 'string' || dependency.trim() === '')
    ) {
      throw createPlanError('INVALID_TASK', 'Each task requires a non-empty id, role, and dependency list.');
    }

    if (ids.has(task.id)) {
      throw createPlanError('DUPLICATE_TASK_ID', `Duplicate task id: ${task.id}.`);
    }
    ids.add(task.id);
  }

  for (const task of tasks) {
    for (const dependency of task.dependsOn) {
      if (!ids.has(dependency)) {
        throw createPlanError('UNKNOWN_DEPENDENCY', `Task ${task.id} depends on unknown task ${dependency}.`);
      }
    }
  }

  const completed = new Set();
  const remaining = new Set(tasks.map((task) => task.id));
  const stages = [];

  while (remaining.size > 0) {
    const ready = tasks.filter((task) =>
      remaining.has(task.id) && task.dependsOn.every((dependency) => completed.has(dependency)),
    );

    if (ready.length === 0) {
      throw createPlanError('DEPENDENCY_CYCLE', 'Task dependencies contain a cycle.');
    }

    const stage = ready.map((task) => Object.freeze({
      id: task.id,
      role: task.role,
      dependsOn: Object.freeze([...task.dependsOn]),
    }));

    stages.push(Object.freeze(stage));
    for (const task of ready) {
      completed.add(task.id);
      remaining.delete(task.id);
    }
  }

  return Object.freeze({ stages: Object.freeze(stages), taskCount: ids.size });
}

function createPlanError(code, message) {
  return Object.assign(new Error(message), { code });
}
