import { z } from "zod";
import { infrai } from "./infrai_client.js";
export const OrderEvent = z.object({ orderId: z.string().min(1), status: z.enum(["checkout", "fulfilled", "receipt_sent", "customer_updated"]), customerId: z.string().min(1) });
export type OrderEvent = z.infer<typeof OrderEvent>;
const metricName: Record<OrderEvent["status"], string> = { checkout: "orders.checkout", fulfilled: "orders.fulfilled", receipt_sent: "orders.receipt_sent", customer_updated: "orders.customer_updated" };
export async function reportOrder(event: unknown) {
  const order = OrderEvent.parse(event);
  return infrai.metrics.report({ type: "counter", name: metricName[order.status], value: 1, tags: { customer_id: order.customerId } });
}
export async function businessAndSpend() {
  return infrai.account.usage.timeseries({ group_by: "day" });
}
if (process.argv[1]?.endsWith("order_metrics.ts")) {
  const sample: OrderEvent = { orderId: "ord-1001", status: "fulfilled", customerId: "cus-7" };
  await reportOrder(sample);
  const spend = await businessAndSpend();
  console.log(JSON.stringify({ reported: metricName[sample.status], spend }, null, 2));
}
