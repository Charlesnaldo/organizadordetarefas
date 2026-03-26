"use client";

export type IconName =
  | "home"
  | "finance"
  | "wishlist"
  | "kanban"
  | "bookmark"
  | "study"
  | "email"
  | "lock"
  | "user"
  | "upload"
  | "trash"
  | "logout"
  | "arrow"
  | "target"
  | "calendar"
  | "lightbulb"
  | "review"
  | "link";

type AppIconProps = {
  name: IconName;
  className?: string;
};

export default function AppIcon({ name, className = "h-4 w-4" }: AppIconProps) {
  const base = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return <svg {...base}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5" /><path d="M10 21v-6h4v6" /></svg>;
    case "finance":
      return <svg {...base}><path d="M4 19h16" /><path d="M7 15V9" /><path d="M12 15V5" /><path d="M17 15v-3" /></svg>;
    case "wishlist":
      return <svg {...base}><path d="M12 20.5 4.8 13.7a4.8 4.8 0 0 1 6.8-6.8L12 7.3l.4-.4a4.8 4.8 0 1 1 6.8 6.8Z" /></svg>;
    case "kanban":
      return <svg {...base}><rect x="4" y="5" width="4" height="14" rx="1.5" /><rect x="10" y="5" width="4" height="9" rx="1.5" /><rect x="16" y="5" width="4" height="11" rx="1.5" /></svg>;
    case "bookmark":
      return <svg {...base}><path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3-6 3V5.5a1 1 0 0 1 1-1Z" /></svg>;
    case "study":
      return <svg {...base}><path d="M4 6.5 12 3l8 3.5L12 10Z" /><path d="M6 9v6.5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5V9" /></svg>;
    case "email":
      return <svg {...base}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m5 7 7 5 7-5" /></svg>;
    case "lock":
      return <svg {...base}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" /></svg>;
    case "user":
      return <svg {...base}><circle cx="12" cy="8" r="3.2" /><path d="M5 19a7 7 0 0 1 14 0" /></svg>;
    case "upload":
      return <svg {...base}><path d="M12 16V6" /><path d="m8.5 9.5 3.5-3.5 3.5 3.5" /><path d="M5 19h14" /></svg>;
    case "trash":
      return <svg {...base}><path d="M4.5 7.5h15" /><path d="M9.5 4.5h5" /><path d="M8 7.5V19a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.5" /></svg>;
    case "logout":
      return <svg {...base}><path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" /><path d="M14 16 18 12 14 8" /><path d="M18 12H9" /></svg>;
    case "arrow":
      return <svg {...base}><path d="M5 12h14" /><path d="m13 7 5 5-5 5" /></svg>;
    case "target":
      return <svg {...base}><circle cx="12" cy="12" r="6" /><path d="M12 6V3" /><path d="M12 21v-3" /><path d="M6 12H3" /><path d="M21 12h-3" /></svg>;
    case "calendar":
      return <svg {...base}><rect x="4" y="6" width="16" height="14" rx="2" /><path d="M4 10h16" /><path d="M8 3v4" /><path d="M16 3v4" /></svg>;
    case "lightbulb":
      return <svg {...base}><path d="M10 22h4" /><path d="M9 19h6" /><path d="M11.5 14.5a2.5 2.5 0 0 1 5 0" /><path d="M12 14a3 3 0 1 0 3-3" /><path d="M12 14v3" /></svg>;
    case "review":
      return <svg {...base}><path d="M5 6h14" /><path d="M5 10h10" /><path d="M5 14h14" /><path d="M5 18h8" /><path d="M8 3v3" /><path d="M16 3v3" /></svg>;
    case "link":
      return <svg {...base}><path d="M8 12h5a3 3 0 0 0 0-6h-3" /><path d="M16 12h5a3 3 0 0 1 0 6h-3" /><path d="M9.5 12.5l5-5" /><path d="M9.5 11.5l5 5" /></svg>;
    default:
      return null;
  }
}


