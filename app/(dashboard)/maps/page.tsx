"use client";

import useSWR from "swr";
import { MapPin } from "lucide-react";
import { fetcher } from "@/lib/client";
import { useProject, withProject } from "@/components/project/project-context";
import { DeviceMap, type MapDevice } from "@/components/maps/device-map";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, PageHeader, Spinner } from "@/components/ui/misc";
import { StatusDot } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

type Device = {
  id: string;
  name: string;
  deviceId: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  lastSeen: string | null;
};

export default function MapsPage() {
  const { projectId } = useProject();
  const { data, isLoading } = useSWR<{ devices: Device[] }>(
    withProject("/api/devices", projectId),
    fetcher,
    { refreshInterval: 10000 },
  );

  const located: MapDevice[] = (data?.devices ?? [])
    .filter((d) => d.latitude != null && d.longitude != null)
    .map((d) => ({
      id: d.id,
      name: d.name,
      deviceId: d.deviceId,
      status: d.status,
      latitude: d.latitude as number,
      longitude: d.longitude as number,
      lastSeen: d.lastSeen,
    }));

  return (
    <div>
      <PageHeader
        title="Maps"
        description="Devices reporting GPS coordinates, shown on OpenStreetMap."
      />
      {isLoading ? (
        <div className="flex h-[480px] items-center justify-center text-muted">
          <Spinner />
        </div>
      ) : located.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-8 w-8" />}
          title="No located devices"
          description="Devices that send latitude/longitude telemetry will appear here."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardBody className="pt-4 sm:pt-5">
              <DeviceMap devices={located} />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="pt-4 sm:pt-5">
              <p className="mb-3 text-sm font-semibold">Located devices</p>
              <ul className="space-y-3">
                {located.map((d) => (
                  <li key={d.id} className="flex items-start gap-2">
                    <StatusDot online={d.status === "ONLINE"} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted">
                        {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)} · {timeAgo(d.lastSeen)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
