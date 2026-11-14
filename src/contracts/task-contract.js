const MAX_ATTEMPTS = 5;

/**
 * Validate and defensively copy the portable contract for one agent task.
 * Inputs are JSON-compatible data so contracts can later cross a server boundary.
 */
export function validateTaskContract(task) {
  if (
    !isRecord(task)
    || !isNonEmptyString(task.id)
    || !isNonEmptyString(task.role)
    || !isNonEmptyString(task.capability)
    || !isRecord(task.input)
  ) {
    throw createContractError('INVALID_TASK_CONTRACT', 'A task requires id, role, capability, and an object input.');
  }

  const dependsOn = task.dependsOn ?? [];
  const maxAttempts = task.maxAttempts ?? 1;

  if (
    !Array.isArray(dependsOn)
    || dependsOn.some((dependency) => !isNonEmptyString(dependency))
    || new Set(dependsOn).size !== dependsOn.length
    || !Number.isInteger(maxAttempts)
    || maxAttempts < 1
    || maxAttempts > MAX_ATTEMPTS
  ) {
    throw createContractError(
      'INVALID_TASK_CONTRACT',
      `Dependencies must be unique non-empty strings and maxAttempts must be between 1 and ${MAX_ATTEMPTS}.`,
    );
  }

  const normalized = {
    id: task.id.trim(),
    role: task.role.trim(),
    capability: task.capability.trim(),
    input: cloneJsonValue(task.input),
    dependsOn: dependsOn.map((dependency) => dependency.trim()),
    maxAttempts,
  };

  return deepFreeze(normalized);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneJsonValue(value, seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value !== 'object' || seen.has(value)) {
    throw createContractError('INVALID_TASK_CONTRACT', 'Task input must contain only finite JSON-compatible values.');
  }

  if (!Array.isArray(value) && !isRecord(value)) {
    throw createContractError('INVALID_TASK_CONTRACT', 'Task input must contain only plain objects and arrays.');
  }

  seen.add(value);
  let clone;

  if (Array.isArray(value)) {
    clone = value.map((entry) => cloneJsonValue(entry, seen));
  } else {
    clone = {};
    for (const [key, entry] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) {
        throw createContractError('INVALID_TASK_CONTRACT', 'Task input contains a prohibited object key.');
      }
      clone[key] = cloneJsonValue(entry, seen);
    }
  }

  seen.delete(value);
  return clone;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function createContractError(code, message) {
  return Object.assign(new Error(message), { code });
}
