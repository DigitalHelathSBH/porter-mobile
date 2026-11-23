import type { CSSProperties } from "react";

type IconProps = {
  size?: number;
  color?: string;
  style?: CSSProperties;
};

function BaseIcon({
  size = 22,
  color = "currentColor",
  style,
  children,
}: IconProps & {
  children: React.ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function AmbulanceIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 7h11v10H3z" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M7 10v4M5 12h4" />
    </BaseIcon>
  );
}

export function BedIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 6v13" />
      <path d="M21 10v9" />
      <path d="M3 15h18" />
      <path d="M6 10h5a3 3 0 0 1 3 3v2H6z" />
      <path d="M3 19h18" />
    </BaseIcon>
  );
}

export function StretcherIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M17 2v5M14.5 4.5h5" />
      <rect x="3" y="7" width="5" height="3" rx="1.5" />
      <rect x="2" y="10" width="20" height="4" rx="2" />
      <path d="m7 14-2 4m12-4 2 4" />
      <circle cx="5" cy="20" r="2" />
      <circle cx="19" cy="20" r="2" />
    </BaseIcon>
  );
}

export function PorterTransportIcon({ bedType, ...props }: IconProps & { bedType: string }) {
  if (bedType.includes("เฉพาะเจ้าหน้าที่")) return <StaffIcon {...props} />;
  if (bedType.includes("นอน")) return <BedIcon {...props} />;
  return <WheelchairIcon {...props} />;
}

export function HospitalIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 21V5h14v16" />
      <path d="M9 5V3h6v2" />
      <path d="M10 9h4M12 7v4" />
      <path d="M8 14h2M14 14h2M8 17h2M14 17h2" />
      <path d="M10 21v-3h4v3" />
    </BaseIcon>
  );
}

export function IvIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v3" />
      <path d="M8 3h8" />
      <rect x="8" y="6" width="8" height="9" rx="2" />
      <path d="M10 10h4" />
      <path d="M12 15v3c0 2 2 3 3 3" />
    </BaseIcon>
  );
}

export function SyringeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m14 4 6 6" />
      <path d="m16 2 6 6" />
      <path d="m6 18 9-9" />
      <path d="m4 16 4 4" />
      <path d="m3 21 3-3" />
      <path d="m11 7 6 6" />
    </BaseIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </BaseIcon>
  );
}

export function HourglassIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 3h10M7 21h10" />
      <path d="M8 3c0 4 1.5 6.5 4 9-2.5 2.5-4 5-4 9" />
      <path d="M16 3c0 4-1.5 6.5-4 9 2.5 2.5 4 5 4 9" />
      <path d="M10 7h4M10 18h4" />
    </BaseIcon>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2h6v2" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </BaseIcon>
  );
}

export function WheelchairIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10" cy="5" r="2" />
      <path d="M10 8v6h5l3 4" />
      <path d="M10 11h5" />
      <path d="M13 18a6 6 0 1 1-6-6" />
    </BaseIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-5 4-7 8-7s7 2 8 7" />
    </BaseIcon>
  );
}

export function StaffIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="5" strokeWidth="1.7" />
      <path d="M7 7a5 5 0 0 1 10 0l-2-1-1.5 1-2-1-1.5 1-1-1-2 1Z" fill="currentColor" stroke="none" />
      <circle cx="10.2" cy="8.5" r=".65" fill="currentColor" stroke="none" />
      <circle cx="13.8" cy="8.5" r=".65" fill="currentColor" stroke="none" />
      <path d="M10.5 10.5q1.5 1.5 3 0" strokeWidth="1.1" />
      <path d="M4 21v-1a8 6 0 0 1 16 0v1H4Z" strokeWidth="1.7" />
    </BaseIcon>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 3h10l4 4v14H5z" />
      <path d="M15 3v5h4" />
      <path d="M8 12h8M8 16h6" />
    </BaseIcon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
      <path d="M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </BaseIcon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m15 18-6-6 6-6" />
    </BaseIcon>
  );
}

export function LightningIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m13 2-8 12h7l-1 8 8-12h-7z" />
    </BaseIcon>
  );
}
