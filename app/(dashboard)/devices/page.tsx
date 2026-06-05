"use client";

import useSWR from "swr";
import Link from "next/link";
import { Cpu, PlusCircle, Trash2, ChevronRight } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, StatusDot } from "@/components/ui/badge";
import { EmptyState, PageHeader, Spinner } from "@/components/ui/misc";
import { timeAgo } from "@/lib/utils";

type Device = {
  id: string;
  name: string;
  type: string;
  deviceId: string;
  protocol: string;
  status: string;
  lastSeen: string | null;
  _count: { telemetry: number };
  alerts: { id: string }[];
};

export default function DevicesPage() {
  const { data, isLoading, mutate } = useSWR<{ devices: Device[] }>(
    "/api/devices",
    fetcher,
    { refreshInterval: 10000 },
  );

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This removes its telemetry and tokens.`)) return;
    await apiFetch(`/api/devices/${id}`, { method: "DELETE" });
    mutate();
  }

  const devices = data?.devices ?? [];

  return (
    <div>
      <PageHeader
        title="Devices"
        description="Manage your connected devices."
        action={
          <Link href="/devices/new">
            <Button>
              <PlusCircle className="h-4 w-4" /> Add device
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted">
          <Spinner />
        </div>
      ) : devices.length === 0 ? (
        <EmptyState
          icon={<Cpu className="h-8 w-8" />}
          title="No devices yet"
          description="Add your first device with the guided wizard."
          action={
            <Link href="/devices/new">
              <Button>Add device</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardBody className="p-0 sm:p-0">
            <ul className="divide-y divide-border">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center gap-4 p-4 hover:bg-surface-2">
                  <Link href={`/devices/${d.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                      <Cpu className="h-5 w-5 text-muted" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{d.name}</p>
                        <Badge tone={d.status === "ONLINE" ? "success" : "muted"}>
                          <StatusDot online={d.status === "ONLINE"} />
                          {d.status}
                        </Badge>
                        {d.alerts.length > 0 && (
                          <Badge tone="danger">{d.alerts.length} alert{d.alerts.length > 1 ? "s" : ""}</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {d.type} · {d.protocol} · {d._count.telemetry} readings · seen {timeAgo(d.lastSeen)}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => remove(d.id, d.name)}
                    aria-label="Delete device"
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link href={`/devices/${d.id}`} className="text-muted">
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
