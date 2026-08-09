import type { SVGProps } from "react";

/** Minimal stroke-icon set (no external icon library dependency), mismo enfoque que Hielo Guala. */
function iconBase(props: SVGProps<SVGSVGElement>) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function IconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10" />
      <path d="M10 20.5v-6h4v6" />
    </svg>
  );
}

export function IconInbox(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M3.5 12h4.2l1.6 2.5h5.4l1.6-2.5h4.2" />
      <path d="M5 5.5h14L21 12v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-6l2-6.5Z" />
    </svg>
  );
}

export function IconTruck(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <rect x="2.5" y="7" width="12" height="9" rx="1" />
      <path d="M14.5 10h3.5l3 3v3h-6.5z" />
      <circle cx="7" cy="18" r="1.7" />
      <circle cx="17" cy="18" r="1.7" />
    </svg>
  );
}

export function IconBarChart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

export function IconSparkles(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.5 13.2 11l2.5 1.2-2.5 1.2L12 15.9l-1.2-2.5L8.3 12.2l2.5-1.2Z" />
    </svg>
  );
}

export function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function IconLogOut(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M9 4H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h3" />
      <path d="M16 16.5 21 12l-5-4.5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19c.6-3 2.9-5 6.2-5s5.6 2 6.2 5" />
      <circle cx="17" cy="8.5" r="2.5" />
      <path d="M15.5 19c.4-2.1 1.6-3.7 3.3-4.5" />
    </svg>
  );
}

export function IconTag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M20.5 12.5 12.8 20.2a1.5 1.5 0 0 1-2.1 0l-7-7a1.5 1.5 0 0 1 0-2.1L11.4 3.4a1.5 1.5 0 0 1 1-.4H19a1.5 1.5 0 0 1 1.5 1.5v6.6a1.5 1.5 0 0 1-.4 1Z" />
      <circle cx="16" cy="8" r="1.5" />
    </svg>
  );
}

export function IconMapPin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M19 10.5c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10.5" r="2.5" />
    </svg>
  );
}

export function IconCheckCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3L15.5 9.5" />
    </svg>
  );
}

export function IconAlertTriangle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.1" />
    </svg>
  );
}

export function IconClock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconArrowLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function IconX(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconNavigation(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconBase(props)}>
      <path d="m3 11 18-7-7 18-2.5-7.5L3 11Z" />
    </svg>
  );
}
