import {
  LayoutDashboard,
  Cpu,
  PlusCircle,
  Activity,
  Bell,
  Map,
  KeyRound,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Cpu },
  { href: "/devices/new", label: "Add Device", icon: PlusCircle },
  { href: "/telemetry", label: "Telemetry", icon: Activity },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/maps", label: "Maps", icon: Map },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/settings", label: "Settings", icon: Settings },
];
