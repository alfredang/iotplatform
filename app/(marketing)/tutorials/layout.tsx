import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function TutorialsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo href="/" />
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/tutorials" className="hover:text-foreground">Tutorials</Link>
            <a href="/#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">{children}</main>

      <footer className="border-t border-border bg-surface/50">
        <p className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} Tertiary Infotech Academy Pte Ltd. All rights reserved. · UEN 201200696W
        </p>
      </footer>
    </>
  );
}
