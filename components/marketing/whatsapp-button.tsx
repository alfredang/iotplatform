import Link from "next/link";

/**
 * Floating WhatsApp contact button (bottom-right), dark green, linking to
 * wa.me/6588666375 — same idea as the tertiaryinfotech.edu.sg site widget.
 */
export function WhatsAppButton() {
  return (
    <Link
      href="https://wa.me/6588666375"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-black/30 transition hover:scale-105"
      style={{ backgroundColor: "#128C7E" }}
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="currentColor" aria-hidden>
        <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.73 6.4L3.2 28.8l6.56-1.72a12.74 12.74 0 0 0 6.24 1.6h.01c7.06 0 12.8-5.74 12.8-12.8s-5.75-12.68-12.81-12.68Zm0 23.06h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.56 10.56 0 0 1-1.62-5.62c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.87-4.77 10.63-10.64 10.63Zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75.32 1.34.52 1.8.66.76.24 1.44.21 1.98.13.6-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </Link>
  );
}
