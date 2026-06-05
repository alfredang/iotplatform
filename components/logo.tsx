import Link from "next/link";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className = "",
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string | null;
  size?: "sm" | "md";
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Activity className="h-5 w-5" />
      </span>
      <span className={size === "sm" ? "text-base" : "text-lg"}>
        IoT<span className="text-primary">Flow</span>
      </span>
    </span>
  );
  if (href === null) return content;
  return <Link href={href}>{content}</Link>;
}
