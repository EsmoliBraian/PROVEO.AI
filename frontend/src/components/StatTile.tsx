import type { ReactNode } from "react";

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone?: "primary" | "warning" | "info" | "success" | "error" | "hero";
}

export function StatTile({ icon, label, value, tone = "primary" }: StatTileProps) {
  const toneClass = tone === "hero" ? "stat-tile-hero" : tone !== "primary" ? `stat-tile-${tone}` : "";

  return (
    <div className={`stat-tile ${toneClass}`}>
      <span className="stat-tile-icon">{icon}</span>
      <div>
        <div className="stat-tile-label">{label}</div>
        <div className="stat-tile-value">{value}</div>
      </div>
    </div>
  );
}
