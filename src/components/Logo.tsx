import Link from "next/link";

export function CarIcon({ className = "", stroke = "#070F1F", size = 20 }: { className?: string; stroke?: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5" />
      <rect x="3" y="13" width="18" height="5" rx="1.5" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="16.5" cy="18" r="1.5" />
    </svg>
  );
}

export function Logo({ light = true }: { light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 no-underline ${light ? "text-white" : "text-navy"}`}>
      <span className="w-[34px] h-[34px] rounded-[9px] bg-accent led flex items-center justify-center"><CarIcon /></span>
      <span className="display text-[22px] font-bold">Caristo</span>
    </Link>
  );
}
