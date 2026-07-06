"use client";

import { useState } from "react";
import useSWR from "swr";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/misc";
import { timeAgo } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  disabled: boolean;
  createdAt: string;
  _count: { devices: number; projects: number };
};

type AccountForm = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER";
};

const emptyForm: AccountForm = { name: "", email: "", password: "", role: "USER" };

function AccountModal({
  title,
  submitLabel,
  form,
  setForm,
  passwordHint,
  error,
  saving,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  form: AccountForm;
  setForm: (f: AccountForm) => void;
  passwordHint?: string;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4" /> : submitLabel}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Doe"
            autoFocus
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@example.com"
          />
        </Field>
        <Field label="Password" hint={passwordHint}>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Role">
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "USER" })}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        {/* Hidden submit so Enter works inside the form. */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

export function AdminUsers({ currentUserId }: { currentUserId: string }) {
  const { data, isLoading, mutate } = useSWR<{ users: AdminUser[] }>(
    "/api/admin/users",
    fetcher,
  );

  const [modal, setModal] = useState<"create" | AdminUser | null>(null);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setModal("create");
  }
  function openEdit(u: AdminUser) {
    setForm({ name: u.name ?? "", email: u.email, password: "", role: u.role });
    setError(null);
    setModal(u);
  }
  function closeModal() {
    if (!saving) setModal(null);
  }

  async function submitModal() {
    if (!modal) return;
    setSaving(true);
    setError(null);
    try {
      if (modal === "create") {
        await apiFetch("/api/admin/users", {
          method: "POST",
          body: JSON.stringify(form),
        });
      } else {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
        };
        if (form.password) body.password = form.password;
        // Role changes on your own account are blocked server-side; don't send it.
        if (modal.id === currentUserId) delete body.role;
        await apiFetch(`/api/admin/users/${modal.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      setModal(null);
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    }
  }
  async function remove(id: string, email: string) {
    if (!confirm(`Delete ${email}? This removes their projects, devices and data.`)) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const users = data?.users ?? [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-16 text-muted"><Spinner /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4" /> Create account
        </Button>
      </div>
      <Card>
        <CardBody className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Projects / Devices</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const self = u.id === currentUserId;
                  return (
                    <tr key={u.id} className={u.disabled ? "opacity-60" : ""}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.name || "—"} {self && <span className="text-xs text-muted">(you)</span>}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={u.role}
                          disabled={self}
                          onChange={(e) => patch(u.id, { role: e.target.value })}
                          className="h-8 w-28"
                        >
                          <option value="USER">User</option>
                          <option value="ADMIN">Admin</option>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.disabled ? "muted" : "success"}>
                          {u.disabled ? "Deactivated" : "Active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {u._count.projects} / {u._count.devices}
                      </td>
                      <td className="px-4 py-3 text-muted">{timeAgo(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={self}
                            onClick={() => patch(u.id, { disabled: !u.disabled })}
                            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2 disabled:opacity-40"
                          >
                            {u.disabled ? "Activate" : "Deactivate"}
                          </button>
                          <button
                            onClick={() => openEdit(u)}
                            aria-label="Edit user"
                            className="text-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            disabled={self}
                            onClick={() => remove(u.id, u.email)}
                            aria-label="Delete user"
                            className="text-muted hover:text-danger disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {modal === "create" && (
        <AccountModal
          title="Create account"
          submitLabel="Create"
          form={form}
          setForm={setForm}
          passwordHint="At least 8 characters."
          error={error}
          saving={saving}
          onClose={closeModal}
          onSubmit={submitModal}
        />
      )}
      {modal && modal !== "create" && (
        <AccountModal
          title={`Edit ${modal.email}`}
          submitLabel="Save changes"
          form={form}
          setForm={setForm}
          passwordHint="Leave blank to keep the current password."
          error={error}
          saving={saving}
          onClose={closeModal}
          onSubmit={submitModal}
        />
      )}
    </div>
  );
}
