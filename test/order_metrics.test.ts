import assert from "node:assert/strict";
import { OrderEvent } from "../src/order_metrics.js";
assert.deepEqual(OrderEvent.parse({ orderId: "o1", status: "fulfilled", customerId: "c1" }).status, "fulfilled");
assert.throws(() => OrderEvent.parse({ orderId: "o1", status: "shipped", customerId: "c1" }));
console.log("order boundary test passed");
