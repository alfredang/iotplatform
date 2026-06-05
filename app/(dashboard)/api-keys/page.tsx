"use client";

import { useState } from "react";
import useSWR from "swr";
import { KeyRound, Trash2 } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/input";
import { CopyButton, CodeBlock } from "@/components/ui/copy";
import { EmptyState, PageHeader, Spinner } from "@/components/ui/misc";
import { timeAgo } from "@/lib/utils";

type Key = {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
  lastUsed: string | null;
  createdAt: string;
};

export default function ApiKeysPage() {
  const { data, isLoading, mutate } = useSWR<{ keys: Key[] }>("/api/api-keys", fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Devices using it will stop sending data.")) return;
    await apiFetch(`/api/api-keys/${id}`, { method: "DELETE" });
    mutate();
  }

  const keys = data?.keys ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Account-level keys for submitting telemetry over HTTP."
        action={<Button onClick={() => setShowCreate(true)}>Create API key</Button>}
      />

      <Card>
        <CardBody className="pt-4 text-sm text-muted sm:pt-5">
          Use an API key with the{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-foreground">
            Authorization: Bearer &lt;key&gt;
          </code>{" "}
          header when posting to <code className="font-mono text-foreground">/api/telemetry</code>.
          Include the device&apos;s public <code className="font-mono text-foreground">deviceId</code> in the JSON body.
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your keys</CardTitle>
        </CardHeader>
        <CardBody className="p-0 sm:p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted"><Spinner /></div>
          ) : keys.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<KeyRound className="h-8 w-8" />}
                title="No API keys"
                description="Create a key to start sending telemetry over HTTP."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {keys.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{k.name}</p>
                      {k.revoked && <Badge tone="muted">revoked</Badge>}
                    </div>
                    <p className="text-xs text-muted">
                      <code className="font-mono">{k.prefix}…</code> · created{" "}
                      {new Date(k.createdAt).toLocaleDateString()} · last used {timeAgo(k.lastUsed)}
                    </p>
                  </div>
                  {!k.revoked && (
                    <button
                      onClick={() => revoke(k.id)}
                      aria-label="Revoke key"
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(token) => {
            setShowCreate(false);
            setCreated(token);
            mutate();
          }}
        />
      )}

      {created && (
        <Modal
          open
          onClose={() => setCreated(null)}
          title="Copy your API key"
          footer={<Button onClick={() => setCreated(null)}>Done</Button>}
        >
          <p className="mb-3 text-sm text-muted">
            This is shown only once. Store it somewhere safe.
          </p>
          <CodeBlock code={created} />
        </Modal>
      )}
    </div>
  );
}

function CreateKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (token: string) => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return setError("Enter a name");
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch<{ key: string }>("/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      onCreated(res.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create key");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Create API key"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Spinner />} Create
          </Button>
        </>
      }
    >
      <Field label="Key name" hint="A label to help you remember where it's used.">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production sensors" autoFocus />
      </Field>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Modal>
  );
}
