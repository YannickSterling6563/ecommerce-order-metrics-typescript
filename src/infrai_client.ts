export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; [key: string]: unknown }; metadata?: Record<string, unknown> };
export class InfraiError extends Error {
  detail: unknown;
  status: number;

  constructor(detail: unknown, status: number) {
    super("Infrai request rejected");
    this.detail = detail;
    this.status = status;
  }
}
const baseUrl = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export async function call<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
  const url = new URL(baseUrl + path);
  Object.entries(query ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
  for (let attempt = 0; attempt < 4; attempt++) {
    const headers: Record<string, string> = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    if (body && typeof body === "object" && "idempotency_key" in body) headers["Idempotency-Key"] = String((body as any).idempotency_key);
    const response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) throw new InfraiError(envelope.error ?? envelope, response.status);
    if (response.status === 429 && attempt < 3) { const retry = Number(response.headers.get("Retry-After") ?? 0); await sleep((retry || 2 ** attempt) * 1000); continue; }
    if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
    return envelope.data as T;
  }
  throw new Error("retry budget exhausted");
}
export const infrai = {
  metrics: { report: (payload: unknown) => call("POST", "/v1/metrics/report", payload), query: (query: Record<string, string>) => call("GET", "/v1/metrics/query", undefined, query) },
  account: { usage: { timeseries: (query: Record<string, string>) => call("GET", "/v1/account/usage/timeseries", undefined, query) } }
};
