# ZUBAIR APEX — Architecture Notes

## Scope of the first vertical slice

The first implementation is intentionally narrow: deterministic provider selection. The repository was initialized with a README and no application runtime, so this slice establishes a testable Node.js foundation without pretending that model providers are already connected.

## Target architecture

```text
Product UI / Main ZUBAIR Platform
              |
       Orchestration API
              |
      Task & Policy Engine
       /      |       \\
  Planner  Router   Budget Guard
              |
       Provider Adapters
   /       |       |        \\
 OpenAI  Anthropic  Gemini  DeepSeek
              |
       Agent Execution
              |
 Review / Security / QA / Arbitration
              |
       Audit & Delivery
```

## Trust boundaries

- Provider credentials belong exclusively in server-side secret storage.
- Client-side code may submit task intent and receive sanitized status/results; it must never receive provider keys.
- Model output is untrusted input. Tool execution, repository writes, deployments, and external side effects require explicit policy gates.
- Provider selection is not proof of a live integration. A provider is operational only after its adapter, credential path, timeout handling, error mapping, and integration tests exist.

## Routing policy (v0.1)

1. Filter to enabled providers with the requested capability and valid non-negative cost metadata.
2. Enforce the per-task budget ceiling.
3. Select the first eligible preferred provider.
4. Otherwise select the lowest-cost eligible provider; use provider ID as a stable tie-breaker.
5. Return a minimal safe selection object, never configuration secrets.

The current cost value is a routing estimate per 1,000 tokens, not a final invoice calculation. Production metering must reconcile actual input/output token prices, cached tokens, tool calls, currency, and provider-specific billing rules.

## Next implementation increments

- Define a provider adapter interface and explicit provider capability metadata.
- Add secret resolution on the server only, with redaction tests.
- Add task state transitions, idempotency keys, bounded retries, timeouts, cancellation, and durable execution state.
- Add role-based agent task contracts and structured outputs.
- Add independent review and evidence-based arbitration; never use majority vote as the sole correctness criterion.
- Add audit logs, cost telemetry, quotas, rate limits, and operator controls.
- Add integration tests using sandbox credentials only after the user configures them.
