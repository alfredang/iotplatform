"use client";

import useSWR from "swr";
import { Trash2 } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
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

export function AdminUsers({ currentUserId }: { currentUserId: string }) {
  const { data, isLoading, mutate } = useSWR<{ users: AdminUser[] }>(
    "/api/admin/users",
    fetcher,
  );

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
  );
}
