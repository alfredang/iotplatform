import { Activity, Cpu, TriangleAlert, Wifi } from "lucide-react";

/** A static, decorative mock of the in-app dashboard for the landing page. */
export function DashboardPreview() {
  const stats = [
    { label: "Devices", value: "24", icon: Cpu, tone: "text-accent" },
    { label: "Online", value: "21", icon: Wifi, tone: "text-success" },
    { label: "Offline", value: "3", icon: Activity, tone: "text-muted" },
    { label: "Alerts", value: "2", icon: TriangleAlert, tone: "text-warning" },
  ];

  // Smooth sparkline path.
  const points = Array.from({ length: 24 }, (_, i) => {
    const x = (i / 23) * 300;
    const y = 70 - (Math.sin(i / 2.2) * 22 + 28 + (i % 3) * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-2xl shadow-black/20">
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-danger/70" />
        <span className="h-3 w-3 rounded-full bg-warning/70" />
        <span className="h-3 w-3 rounded-full bg-success/70" />
        <span className="ml-3 text-xs text-muted">app · Dashboard</span>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-surface-2 p-3">
              <s.icon className={`h-4 w-4 ${s.tone}`} />
              <p className="mt-2 text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Warehouse Temperature</p>
            <span className="text-xs text-muted">last 24h</span>
          </div>
          <svg viewBox="0 0 300 80" className="h-24 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
            <polygon points={`0,80 ${points} 300,80`} fill="url(#g)" />
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3">
            <div>
              <p className="text-xs text-muted">Humidity</p>
              <p className="text-lg font-semibold">62%</p>
            </div>
            <div className="relative h-12 w-12">
              <svg viewBox="0 0 36 36" className="h-12 w-12">
                <path className="stroke-border" strokeWidth="3" fill="none" d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" />
                <path stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="62 100" d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" />
              </svg>
            </div>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
            <p className="text-xs font-medium text-warning">Active alert</p>
            <p className="mt-1 text-sm">Cold Room temp &gt; 8°C</p>
          </div>
        </div>
      </div>
    </div>
  );
}
