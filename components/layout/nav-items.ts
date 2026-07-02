import {
  LayoutDashboard,
  Cpu,
  PlusCircle,
  Activity,
  Bell,
  Map,
  KeyRound,
  Settings,
  FolderKanban,
  Users,
  Mail,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/devices", label: "Devices", icon: Cpu },
  { href: "/devices/new", label: "Add Device", icon: PlusCircle },
  { href: "/telemetry", label: "Telemetry", icon: Activity },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/automations", label: "Automations", icon: Workflow },
  { href: "/maps", label: "Maps", icon: Map },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Admin-only navigation (shown when the effective role is ADMIN). */
export const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/email", label: "Email & Alerts", icon: Mail },
];
