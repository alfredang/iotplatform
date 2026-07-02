"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, ADMIN_ITEMS } from "./nav-items";
import { ProjectSwitcher } from "./project-switcher";
import { ViewAsToggle, ViewAsBanner } from "./view-as";

type SessionUser = { name?: string | null; email?: string | null };

function isActive(pathname: string, href: string) {
  if (href === "/devices") {
    return pathname === "/devices" || /^\/devices\/(?!new$)[^/]+/.test(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  isAdminView,
  onNavigate,
}: {
  isAdminView: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const render = (item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
          active ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground",
        )}
      >
        <item.icon className="h-4.5 w-4.5" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {NAV_ITEMS.map(render)}
      {isAdminView && (
        <>
          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">
            Admin
          </p>
          {ADMIN_ITEMS.map(render)}
        </>
      )}
    </nav>
  );
}

function UserFooter({
  user,
  realRole,
  viewAs,
}: {
  user: SessionUser;
  realRole: string;
  viewAs: "user" | "admin";
}) {
  return (
    <div className="border-t border-border">
      {realRole === "ADMIN" && <ViewAsToggle viewAs={viewAs} />}
      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name || user.email}</p>
          <Badge tone="muted" className="mt-1">{realRole}</Badge>
        </div>
        <button
          type="button"
          aria-label="Sign out"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  realRole,
  effectiveRole,
  viewAs,
  children,
}: {
  user: SessionUser;
  realRole: string;
  effectiveRole: string;
  viewAs: "user" | "admin";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isAdminView = effectiveRole === "ADMIN";

  const sidebarBody = (onNavigate?: () => void) => (
    <>
      <ProjectSwitcher onNavigate={onNavigate} />
      <NavLinks isAdminView={isAdminView} onNavigate={onNavigate} />
      <UserFooter user={user} realRole={realRole} viewAs={viewAs} />
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo href="/dashboard" size="sm" />
        </div>
        {sidebarBody()}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo href="/dashboard" size="sm" />
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarBody(() => setOpen(false))}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {realRole === "ADMIN" && viewAs === "user" && <ViewAsBanner />}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <div className="lg:hidden">
            <Logo href="/dashboard" size="sm" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {(user.name || user.email || "?").trim().charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[160px] truncate text-sm font-medium sm:block">
                {user.name || user.email}
              </span>
              <button
                type="button"
                aria-label="Sign out"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-muted transition hover:text-danger"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
