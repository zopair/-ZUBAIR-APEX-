# ZUBAIR APEX

Provider-agnostic orchestration foundation for a governed, multi-model AI workforce.

## Current status

**Foundation v0.2.0 — routing, planning, and task-contract validation.** This repository provides deterministic provider selection, dependency-aware planning, and a validated JSON-compatible task contract. It does not yet call external model APIs, execute autonomous agents, or store credentials.

## Principles

- Provider-neutral architecture; no model vendor is mandatory.
- Secrets stay in server-side environment/secret management and are never returned by routing APIs.
- Explicit capability matching and budget gates before provider selection.
- Deterministic fallback: preferred eligible provider first, otherwise lowest-cost eligible provider.
- Tests before behavior changes; no claim of integration until a real adapter is implemented and verified.

## Requirements

- Node.js 20+

## Quick start

```bash
npm test
```

## Repository layout

```text
src/
  routing/provider-router.js
  orchestration/plan-builder.js
  contracts/task-contract.js
test/
  provider-router.test.js
  plan-builder.test.js
  task-contract.test.js
docs/
  architecture.md
```

## Provider routing contract

`selectProvider({ providers, capability, preferredProviderIds, budget })`

- `budget` is the maximum allowed estimated cost per 1,000 tokens, in the same cost unit used by provider definitions.
- Only enabled providers with the requested capability and a valid non-negative cost are eligible.
- A preferred provider is selected only if it is eligible and within budget.
- If no preferred provider qualifies, the least expensive eligible provider is selected (provider ID breaks ties deterministically).
- Throws typed errors: `INVALID_BUDGET`, `INVALID_ROUTING_INPUT`, `NO_ELIGIBLE_PROVIDER`, or `BUDGET_EXCEEDED`.
- Returns only `providerId`, `estimatedCostPer1kTokens`, and `reason`; secret references and credentials are not returned.

## Security

Never commit API keys, OAuth tokens, or provider credentials. Use the deployment platform's secret manager or server-side environment variables. A browser/client-side build must never receive provider secrets.

## Roadmap

1. Provider routing and policy tests. (implemented)
2. Dependency-aware task planning with parallel stages. (implemented)
3. Task contracts and safe input validation. (implemented)
4. Server-side provider adapters and secret resolution.
5. Orchestration state machine and bounded retries.
6. Agent roles, independent review, and evidence-based arbitration.
7. Audit events, usage metering, budget enforcement, and observability.
8. Integration tests against explicitly configured provider sandboxes.
9. UI and deployment integration with the main ZUBAIR platform.

See [docs/architecture.md](docs/architecture.md) for boundaries and implementation sequence.
