import test from 'node:test';
import assert from 'node:assert/strict';
import { selectProvider } from '../src/routing/provider-router.js';

const providers = [
  { id: 'openai', enabled: true, capabilities: ['reasoning', 'code'], costPer1kTokens: 0.01, secretRef: 'OPENAI_API_KEY' },
  { id: 'anthropic', enabled: true, capabilities: ['reasoning', 'code', 'review'], costPer1kTokens: 0.02, secretRef: 'ANTHROPIC_API_KEY' },
  { id: 'disabled', enabled: false, capabilities: ['code'], costPer1kTokens: 0, secretRef: 'DISABLED_KEY' },
];

test('selects the first preferred enabled provider with the requested capability', () => {
  const result = selectProvider({ providers, capability: 'review', preferredProviderIds: ['openai', 'anthropic'], budget: 1 });
  assert.equal(result.providerId, 'anthropic');
  assert.equal(result.reason, 'preferred-capability-match');
});

test('rejects providers that exceed the task budget', () => {
  assert.throws(
    () => selectProvider({ providers, capability: 'review', preferredProviderIds: ['anthropic'], budget: 0.001 }),
    { code: 'BUDGET_EXCEEDED' },
  );
});

test('skips disabled preferred providers and selects an eligible fallback', () => {
  const result = selectProvider({ providers, capability: 'code', preferredProviderIds: ['disabled'], budget: 1 });
  assert.equal(result.providerId, 'openai');
});

test('never returns secret references or credential material', () => {
  const result = selectProvider({ providers, capability: 'code', preferredProviderIds: ['openai'], budget: 1 });
  assert.deepEqual(Object.keys(result).sort(), ['estimatedCostPer1kTokens', 'providerId', 'reason']);
  assert.equal(JSON.stringify(result).includes('OPENAI_API_KEY'), false);
});

test('rejects invalid budget values', () => {
  assert.throws(
    () => selectProvider({ providers, capability: 'code', preferredProviderIds: ['openai'], budget: -1 }),
    { code: 'INVALID_BUDGET' },
  );
});
