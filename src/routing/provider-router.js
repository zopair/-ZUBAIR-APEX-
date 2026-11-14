/**
 * Select a configured model provider for a capability without exposing secrets.
 * `budget` is the maximum estimated cost for 1,000 tokens in the configured cost unit.
 */
export function selectProvider({ providers, capability, preferredProviderIds = [], budget }) {
  if (!Number.isFinite(budget) || budget < 0) {
    throw createRoutingError('INVALID_BUDGET', 'Budget must be a finite non-negative number.');
  }

  if (!Array.isArray(providers) || typeof capability !== 'string' || capability.trim() === '') {
    throw createRoutingError('INVALID_ROUTING_INPUT', 'Providers and a non-empty capability are required.');
  }

  const capableProviders = providers.filter((provider) =>
    provider?.enabled === true
    && typeof provider.id === 'string'
    && Array.isArray(provider.capabilities)
    && provider.capabilities.includes(capability)
    && Number.isFinite(provider.costPer1kTokens)
    && provider.costPer1kTokens >= 0,
  );

  if (capableProviders.length === 0) {
    throw createRoutingError('NO_ELIGIBLE_PROVIDER', `No enabled provider supports capability: ${capability}.`);
  }

  const withinBudget = capableProviders.filter((provider) => provider.costPer1kTokens <= budget);
  if (withinBudget.length === 0) {
    throw createRoutingError('BUDGET_EXCEEDED', 'All capable providers exceed the task budget.');
  }

  const preferred = preferredProviderIds
    .map((id) => withinBudget.find((provider) => provider.id === id))
    .find(Boolean);

  const selected = preferred ?? [...withinBudget].sort((a, b) =>
    a.costPer1kTokens - b.costPer1kTokens || a.id.localeCompare(b.id),
  )[0];

  return Object.freeze({
    providerId: selected.id,
    estimatedCostPer1kTokens: selected.costPer1kTokens,
    reason: preferred ? 'preferred-capability-match' : 'lowest-cost-capability-match',
  });
}

function createRoutingError(code, message) {
  return Object.assign(new Error(message), { code });
}
