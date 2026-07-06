import Link from "next/link";

const APP_STORE_URL = "https://apps.apple.com/us/app/iotflow/id6781005693";

/** Official-style "Download on the App Store" badge (self-contained, no assets). */
export function AppStoreBadge({ className = "" }: { className?: string }) {
  return (
    <Link
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download IoTFlow on the App Store"
      className={`inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-black px-3.5 py-2 text-white transition hover:opacity-90 ${className}`}
    >
      <svg viewBox="0 0 384 512" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C71.5 141.1 0 184.6 0 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.6 88.3c30.4-36.1 27.6-68.9 26.7-80.7-26.8 1.6-57.8 18.3-75.5 38.9-19.5 22.1-31 49.4-28.5 79.9 28.9 2.2 55.3-12.7 77.3-38.1z" />
      </svg>
      <span className="flex flex-col leading-tight">
        <span className="whitespace-nowrap text-[10px] font-medium">Download on the</span>
        <span className="-mt-0.5 whitespace-nowrap text-lg font-semibold tracking-tight">App Store</span>
      </span>
    </Link>
  );
}
