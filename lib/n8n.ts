/**
 * n8n low-code integration.
 *
 * This platform uses n8n as its automation engine: platform events (telemetry,
 * alerts, device online/offline, commands) are forwarded to n8n workflows via
 * their Webhook nodes, and n8n flows call back into the platform API to control
 * devices, send notifications, log to sheets, run AI, etc. — all no-code.
 *
 * Two channels:
 *  1. Public REST API (`/api/v1/*`, header `X-N8N-API-KEY`) — list/inspect
 *     workflows so the UI can show status and deep-link into the editor.
 *  2. Webhook delivery — POST an event envelope to a workflow's webhook URL.
 */

export const N8N_BASE_URL = (process.env.N8N_BASE_URL || "").replace(/\/$/, "");
const N8N_API_KEY = process.env.N8N_API_KEY || "";

export function n8nConfigured(): boolean {
  return Boolean(N8N_BASE_URL && N8N_API_KEY);
}

export type N8nWorkflow = {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  tags?: { id: string; name: string }[];
};

/** Deep-link to a workflow in the n8n editor. */
export function n8nEditorUrl(workflowId: string): string {
  return `${N8N_BASE_URL}/workflow/${workflowId}`;
}

async function n8nApi<T>(path: string, init?: RequestInit): Promise<T> {
  if (!n8nConfigured()) throw new Error("n8n is not configured");
  const res = await fetch(`${N8N_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      "X-N8N-API-KEY": N8N_API_KEY,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    // n8n API responses should never be cached.
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`n8n API ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/** List workflows (id, name, active, tags). */
export async function listWorkflows(limit = 50): Promise<N8nWorkflow[]> {
  const data = await n8nApi<{ data: N8nWorkflow[] }>(
    `/workflows?limit=${limit}&excludePinnedData=true`,
  );
  return (data.data || []).map((w) => ({
    id: w.id,
    name: w.name,
    active: w.active,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    tags: w.tags,
  }));
}

/** Fetch a single workflow (used to confirm a linked flow still exists). */
export async function getWorkflow(id: string): Promise<N8nWorkflow | null> {
  try {
    return await n8nApi<N8nWorkflow>(`/workflows/${id}`);
  } catch {
    return null;
  }
}

/**
 * Deliver an event envelope to an n8n webhook URL.
 * Best-effort: returns a status string, never throws, so ingestion is never
 * blocked by a slow or misconfigured flow.
 */
export async function deliverToWebhook(
  url: string,
  envelope: unknown,
): Promise<{ ok: boolean; status: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, status: `error: HTTP ${res.status}` };
    return { ok: true, status: "ok" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { ok: false, status: `error: ${msg}`.slice(0, 180) };
  }
}
