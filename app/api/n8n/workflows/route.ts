import { requireApiUser } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api";
import { listWorkflows, n8nConfigured, N8N_BASE_URL, n8nEditorUrl } from "@/lib/n8n";

export const dynamic = "force-dynamic";

/**
 * GET /api/n8n/workflows — list workflows from the linked n8n instance so the
 * Automations UI can show connection status and let users pick a flow to link.
 */
export async function GET() {
  try {
    await requireApiUser();
    if (!n8nConfigured()) {
      return Response.json({ configured: false, baseUrl: null, workflows: [] });
    }
    const workflows = await listWorkflows(100);
    return Response.json({
      configured: true,
      baseUrl: N8N_BASE_URL,
      workflows: workflows.map((w) => ({ ...w, editorUrl: n8nEditorUrl(w.id) })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
