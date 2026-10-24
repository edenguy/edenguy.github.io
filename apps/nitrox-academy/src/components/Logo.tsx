export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--n2)" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#logo-g)" />
      <circle cx="26" cy="30" r="9" fill="var(--o2)" />
      <circle cx="40" cy="36" r="7" fill="#ffffff" opacity="0.9" />
      <path d="M14 48c6-5 12-5 18 0s12 5 18 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}
