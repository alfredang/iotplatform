import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

/**
 * Shared marketing top nav — used on the landing page and every marketing
 * sub-page (blog, tutorials) so the header is identical everywhere. Section
 * links use `/#anchor` so they work from any page (jump home + scroll).
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/#features" className="hover:text-foreground">Features</Link>
          <Link href="/#how" className="hover:text-foreground">How it works</Link>
          <Link href="/tutorials" className="hover:text-foreground">Tutorials</Link>
          <Link href="/blog" className="hover:text-foreground">Blog</Link>
          <Link href="/#industries" className="hover:text-foreground">Industries</Link>
          <Link href="/#contact" className="hover:text-foreground">Contact</Link>
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
  );
}
