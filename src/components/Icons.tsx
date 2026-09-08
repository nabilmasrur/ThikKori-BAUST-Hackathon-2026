import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

// ── Service category marks ───────────────────────────────────────────
// Drawn rather than emoji so they sit consistently in the palette.

export const CategoryIcon = ({ name, ...p }: P & { name: string }) => {
  switch (name) {
    case 'appliance':
      return (
        <Base {...p}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18M6.5 14h4M17 14.5v.01" />
        </Base>
      );
    case 'plumbing':
      return (
        <Base {...p}>
          <path d="M7 3v5a4 4 0 0 0 4 4h2" />
          <path d="M13 12h4a0 0 0 0 1 0 0v4a4 4 0 0 1-4 4h-1" />
          <path d="M5 8h4M15 21h-4" />
        </Base>
      );
    case 'electrical':
      return (
        <Base {...p}>
          <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" />
        </Base>
      );
    case 'cleaning':
      return (
        <Base {...p}>
          <path d="M12 3v8M8.5 11h7l1 4a4 4 0 0 1-4 5h-1a4 4 0 0 1-4-5l1-4Z" />
          <path d="M10 15v3M14 15v3" />
        </Base>
      );
    case 'maintenance':
      return (
        <Base {...p}>
          <path d="M14.5 3.5a4 4 0 0 0 5 5L21 7v3l-8 8H9v-4l8-8h3l-1.5-1.5Z" />
          <path d="M4 20l3-3" />
        </Base>
      );
    case 'moving':
      return (
        <Base {...p}>
          <path d="M2 7h11v10H2zM13 10h4l4 3v4h-8z" />
          <circle cx="6" cy="18.5" r="1.6" />
          <circle cx="17" cy="18.5" r="1.6" />
        </Base>
      );
    case 'carcare':
      return (
        <Base {...p}>
          <path d="M4 15l1.6-5A2 2 0 0 1 7.5 8.6h9A2 2 0 0 1 18.4 10L20 15v4h-3v-2H7v2H4z" />
          <path d="M6.5 15h2M15.5 15h2" />
        </Base>
      );
    case 'personal':
      return (
        <Base {...p}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </Base>
      );
    default:
      return (
        <Base {...p}>
          <circle cx="12" cy="12" r="8" />
        </Base>
      );
  }
};

// ── Interface marks ──────────────────────────────────────────────────

export const IconStar = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Base {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z" />
  </Base>
);
export const IconPin = (p: P) => (
  <Base {...p}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Base>
);
export const IconClock = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Base>
);
/** A banknote reads more clearly at 18px than a drawn ৳ glyph. */
export const IconTaka = (p: P) => (
  <Base {...p}>
    <rect x="3" y="6.5" width="18" height="11" rx="2" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M6.5 12v.01M17.5 12v.01" />
  </Base>
);
export const IconWrench = (p: P) => (
  <Base {...p}>
    <path d="M15.5 3.5a4.5 4.5 0 0 0 5.6 5.8L11 19.4a2.6 2.6 0 1 1-3.7-3.7L17.4 5.6a4.6 4.6 0 0 0-1.9-2.1Z" />
  </Base>
);
export const IconTier = (p: P) => (
  <Base {...p}>
    <path d="M4 19h16M6 19V9l3 3 3-6 3 6 3-3v10" />
  </Base>
);
export const IconQr = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
    <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
    <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
    <path d="M14.5 14.5h2.5v2.5h-2.5zM20.5 14.5v3M18 20.5h2.5" />
  </Base>
);
export const IconCheck = (p: P) => (
  <Base {...p} strokeWidth="2.2">
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Base>
);
export const IconChevron = (p: P) => (
  <Base {...p}>
    <path d="m9 5 7 7-7 7" />
  </Base>
);
export const IconInbox = (p: P) => (
  <Base {...p}>
    <path d="M3.5 13.5h4l1.5 3h6l1.5-3h4" />
    <path d="M5 5h14l1.5 8.5v5h-17v-5L5 5Z" />
  </Base>
);
export const IconAlert = (p: P) => (
  <Base {...p}>
    <path d="M12 4.5 21 19.5H3L12 4.5Z" />
    <path d="M12 10v4M12 17v.01" />
  </Base>
);
export const IconUsers = (p: P) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19a6 6 0 0 1 12 0M16.5 5.5a3 3 0 0 1 0 5.6M17 19a6 6 0 0 0-2-4.4" />
  </Base>
);
export const IconChart = (p: P) => (
  <Base {...p}>
    <path d="M4 20V4M4 20h16M8 17V11M12.5 17V7M17 17v-4" />
  </Base>
);
export const IconMegaphone = (p: P) => (
  <Base {...p}>
    <path d="M4 10v4h3l7 4V6l-7 4H4ZM17.5 9.5a3.5 3.5 0 0 1 0 5" />
  </Base>
);
export const IconGrid = (p: P) => (
  <Base {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.4" />
    <rect x="13" y="4" width="7" height="7" rx="1.4" />
    <rect x="4" y="13" width="7" height="7" rx="1.4" />
    <rect x="13" y="13" width="7" height="7" rx="1.4" />
  </Base>
);
export const IconGift = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="9" width="17" height="11" rx="1.6" />
    <path d="M3.5 13h17M12 9v11M12 9C9 9 7.5 7.8 7.5 6.3S9 4 12 9Zm0 0c3 0 4.5-1.2 4.5-2.7S15 4 12 9Z" />
  </Base>
);
export const IconPhone = (p: P) => (
  <Base {...p}>
    <path d="M6 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.7 2 2 0 0 1 6 3.5Z" />
  </Base>
);
export const IconPlus = (p: P) => (
  <Base {...p} strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </Base>
);
export const IconTruck = (p: P) => (
  <Base {...p}>
    <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
    <circle cx="7" cy="17.5" r="1.5" />
    <circle cx="17.5" cy="17.5" r="1.5" />
  </Base>
);
export const IconArrowLeft = (p: P) => (
  <Base {...p}>
    <path d="m15 18-6-6 6-6" />
  </Base>
);

