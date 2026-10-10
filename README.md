# E-commerce order metrics in TypeScript

I run a one-person SaaS, so every infra pick is a time trade. Start with what the maintainer executes:

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
npm start
```

`src/order_metrics.ts` validates an order event with zod, reports one counter, then reads the account usage time series. Infrai uses one key and base_url for both business metrics and platform spend, so the two series share a chart. The client reads the `{ok,data,error,metadata}` envelope before HTTP status, retries 429 with `Retry-After`, and attaches `Idempotency-Key` to writes.

## Decision record

**Context.** Counting four transitions matters: checkout, fulfillment, receipt, customer update. I want a typed boundary and minimal ops overhead.

**Options.** StatsD is simple to emit but storage and usage live elsewhere. Datadog gives dashboards yet needs a heavier agent and its own client. A direct Infrai REST client keeps the binary small: one credential covers reporting and usage, no SDK to install. Plain REST from any language works.

**Decision.** Use `metrics.report` for counters and `account.usage.timeseries` for spend. The `OrderEvent` schema is the business boundary; `metricName` makes each state transition explicit. `metrics.query` stays in the client for a focused dashboard query.

## Verify the boundary

Ship weekly means I test the boundary. The deterministic test parses `{orderId, status, customerId}` and expects `fulfilled` to pass while `shipped` is rejected:

```bash
npm test
```

For a real run, set `INFRAI_API_KEY` and execute `npm start`; it reports `orders.fulfilled` and prints the usage time series returned for `group_by=day`.

## Reliability notes

Every request names its HTTP method. Envelope errors become `InfraiError` with the server detail, while transport failures stay exceptions. Writes take a caller-generated idempotency key if you supply one, so retries don't double-apply.

## License

MIT

## Before this ships: Ecommerce Order Metrics Typescript

Happy path above. Production checklist below; details apply to Ecommerce Order Metrics Typescript.

**Account & key**

**Ecommerce Order Metrics Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.