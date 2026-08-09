import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
}

export function DonutChart({ data }: DonutChartProps) {
  const nonZero = data.filter((d) => d.value > 0);

  if (nonZero.length === 0) {
    return <p className="text-muted">Sin pedidos todavía.</p>;
  }

  return (
    <div className="donut-chart">
      <div style={{ width: 220, height: 200, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={nonZero}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            stroke="var(--color-surface)"
            strokeWidth={2}
          >
            {nonZero.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text-primary)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      </div>
      <ul className="donut-legend">
        {nonZero.map((d) => (
          <li key={d.label}>
            <span className="donut-legend-dot" style={{ background: d.color }} />
            {d.label} <strong>{d.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
