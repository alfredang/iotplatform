"use client";

import { useState } from "react";
import useSWR from "swr";
import { FolderKanban, Trash2, Check, Cpu } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { useProject } from "@/components/project/project-context";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/input";
import { EmptyState, PageHeader, Spinner } from "@/components/ui/misc";

type Project = {
  id: string;
  name: string;
  description: string | null;
  _count: { devices: number };
};

export default function ProjectsPage() {
  const { projectId, setProject } = useProject();
  const { data, isLoading, mutate } = useSWR<{ projects: Project[] }>("/api/projects", fetcher);
  const [showCreate, setShowCreate] = useState(false);

  const projects = data?.projects ?? [];

  async function remove(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? This removes its devices, telemetry and dashboard.`)) return;
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete project");
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Each project is its own workspace with devices, a dashboard, alerts and a map."
        action={<Button onClick={() => setShowCreate(true)}>New project</Button>}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted"><Spinner /></div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="No projects yet"
          description="Create your first project to start adding devices."
          action={<Button onClick={() => setShowCreate(true)}>New project</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const active = p.id === projectId;
            return (
              <Card key={p.id} className={active ? "ring-1 ring-primary" : ""}>
                <CardBody className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FolderKanban className="h-5 w-5" />
                    </span>
                    {active ? (
                      <Badge tone="success"><Check className="h-3 w-3" /> Active</Badge>
                    ) : (
                      <button
                        onClick={() => remove(p.id, p.name)}
                        aria-label="Delete project"
                        className="text-muted hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold">{p.name}</h3>
                  {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <Cpu className="h-3.5 w-3.5" /> {p._count.devices} device{p._count.devices === 1 ? "" : "s"}
                  </p>
                  <div className="mt-4">
                    {active ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current project
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full" onClick={() => setProject(p.id)}>
                        Switch to this project
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            mutate();
            setProject(id);
          }}
        />
      )}
    </div>
  );
}

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return setError("Enter a project name");
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch<{ project: { id: string } }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });
      onCreated(res.project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New project"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Spinner />} Create project
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Project name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warehouse Monitoring" autoFocus />
        </Field>
        <Field label="Description (optional)">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this project monitor?" />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
