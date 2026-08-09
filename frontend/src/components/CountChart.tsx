import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CountChartProps {
  data: { label: string; count: number }[];
  kind: "bar" | "line";
}

const TOOLTIP_STYLE = {
  background: "var(--color-surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--text-primary)",
};

export function CountChart({ data, kind }: CountChartProps) {
  if (data.every((d) => d.count === 0)) {
    return <p className="text-muted">Sin datos todavía.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      {kind === "bar" ? (
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
          <Tooltip cursor={{ fill: "var(--color-surface-2)" }} contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      ) : (
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
          <Tooltip cursor={{ stroke: "var(--border-strong)" }} contentStyle={TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
