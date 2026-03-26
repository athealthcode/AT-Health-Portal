// Supabase REST API client (no external deps — uses Node.js built-in fetch)
const SB_URL =
  process.env.SUPABASE_URL ?? "https://hvrbhtabilxmptetseod.supabase.co";
const SB_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cmJodGFiaWx4bXB0ZXRzZW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzg3ODAsImV4cCI6MjA4OTg1NDc4MH0.gjhe5B3bTMQgsZ14zBfKk15k8JwP223usHLY8rRTrTs";

const BASE_HEADERS = () => ({
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
});

async function sbFetch<T>(path: string, opts: RequestInit & { extraHeaders?: Record<string, string> } = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${SB_URL}/rest/v1${path}`;
  const { extraHeaders, ...rest } = opts as any;
  const res = await fetch(url, {
    ...rest,
    headers: { ...BASE_HEADERS(), ...(extraHeaders ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Supabase ${res.status}: ${body}`);
  }
  const txt = await res.text();
  return (txt ? JSON.parse(txt) : null) as T;
}

/** SELECT — params are passed as-is to PostgREST (e.g. { slug: "eq.bowland" }) */
export function sbGet<T>(table: string, params: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams(params as any).toString();
  return sbFetch<T>(`/${table}${qs ? "?" + qs : ""}`);
}

/** Raw path GET (for complex queries with repeated keys) */
export function sbGetRaw<T>(path: string): Promise<T> {
  return sbFetch<T>(path);
}

/** INSERT */
export function sbInsert<T>(table: string, body: unknown, prefer = "return=representation"): Promise<T> {
  return sbFetch<T>(`/${table}`, {
    method: "POST",
    extraHeaders: { Prefer: prefer },
    body: JSON.stringify(body),
  } as any);
}

/** UPDATE */
export function sbPatch<T>(table: string, filterQs: string, body: unknown): Promise<T> {
  return sbFetch<T>(`/${table}?${filterQs}`, {
    method: "PATCH",
    extraHeaders: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  } as any);
}

/** DELETE */
export function sbDelete(table: string, filterQs: string): Promise<null> {
  return sbFetch<null>(`/${table}?${filterQs}`, { method: "DELETE" });
}

/** RPC */
export function sbRpc<T>(fn: string, params: unknown): Promise<T> {
  return sbFetch<T>(`/rpc/${fn}`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}
