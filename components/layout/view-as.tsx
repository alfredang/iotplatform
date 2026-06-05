"use client";

import { useRouter } from "next/navigation";
import { Eye, ShieldCheck } from "lucide-react";
import { VIEW_AS_COOKIE } from "@/lib/constants";

function setViewAs(value: "user" | "admin", router: ReturnType<typeof useRouter>) {
  document.cookie = `${VIEW_AS_COOKIE}=${value};path=/;max-age=31536000;samesite=lax`;
  router.refresh();
}

/** Compact control in the sidebar for admins to switch their view. */
export function ViewAsToggle({ viewAs }: { viewAs: "user" | "admin" }) {
  const router = useRouter();
  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1 text-xs">
        <button
          onClick={() => setViewAs("admin", router)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 font-medium transition ${
            viewAs === "admin" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Admin
        </button>
        <button
          onClick={() => setViewAs("user", router)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 font-medium transition ${
            viewAs === "user" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <Eye className="h-3.5 w-3.5" /> User
        </button>
      </div>
    </div>
  );
}

/** Banner shown across the top while an admin is previewing the user view. */
export function ViewAsBanner() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center gap-3 bg-warning/15 px-4 py-2 text-sm text-warning">
      <Eye className="h-4 w-4" />
      <span>You are viewing as a regular user.</span>
      <button
        onClick={() => setViewAs("admin", router)}
        className="font-semibold underline hover:no-underline"
      >
        Switch back to Admin
      </button>
    </div>
  );
}
