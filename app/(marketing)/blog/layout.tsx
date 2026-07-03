import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">{children}</main>

      <footer className="border-t border-border bg-surface/50">
        <p className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} Tertiary Infotech Academy Pte Ltd. All rights reserved. · UEN 201200696W
          {" · "}Powered by{" "}
          <a href="https://www.tertiaryinfotech.com/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            Tertiary Infotech Academy Pte Ltd
          </a>
        </p>
      </footer>
    </>
  );
}
