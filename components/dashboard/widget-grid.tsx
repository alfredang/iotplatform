"use client";

import useSWR from "swr";
import { LayoutGrid } from "lucide-react";
import { apiFetch, fetcher } from "@/lib/client";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { WidgetCard, type Widget } from "./widget-card";
import { AddWidget } from "./add-widget";

export function WidgetGrid() {
  const { data, isLoading, mutate } = useSWR<{ widgets: Widget[] }>(
    "/api/dashboard/widgets",
    fetcher,
    { refreshInterval: 15000 },
  );

  async function remove(id: string) {
    await apiFetch(`/api/dashboard/widgets/${id}`, { method: "DELETE" });
    mutate();
  }

  const widgets = data?.widgets ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">My widgets</h2>
        <AddWidget onAdded={() => mutate()} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted">
          <Spinner />
        </div>
      ) : widgets.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-8 w-8" />}
          title="No widgets yet"
          description="Add a number card, chart, gauge or map to build your dashboard."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {widgets.map((w) => (
            <WidgetCard key={w.id} widget={w} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
