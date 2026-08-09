import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Avatar } from "../components/Avatar";
import { CountChart } from "../components/CountChart";
import { DonutChart } from "../components/DonutChart";
import { StatTile } from "../components/StatTile";
import { IconAlertTriangle, IconCheckCircle, IconInbox, IconTrendingUp } from "../components/icons";
import { CURRENCY_FORMATTER, type TenantStats } from "../types/models";

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function EstadisticasPage() {
  const [stats, setStats] = useState<TenantStats | null>(null);

  useEffect(() => {
    api.get<TenantStats>("/stats").then(setStats);
  }, []);

  if (!stats) return <p>Cargando…</p>;

  const dayData = stats.ordersByDay.map((d) => ({ label: shortDate(d.date), count: d.count }));
  const donutData = [
    { label: "Nuevos", value: stats.statusCounts.NUEVO, color: "var(--color-primary)" },
    { label: "En proceso", value: stats.statusCounts.EN_PROCESO, color: "var(--color-warning)" },
    { label: "En camino", value: stats.statusCounts.EN_CAMINO, color: "var(--color-info)" },
    { label: "Entregados", value: stats.statusCounts.ENTREGADO, color: "var(--color-success)" },
    { label: "Cancelados", value: stats.statusCounts.CANCELADO, color: "var(--color-error)" },
  ];

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Estadísticas</h1>
          <p className="text-muted">Análisis y reportes del sistema</p>
        </div>
      </div>

      <div className="stat-tile-row">
        <StatTile icon={<IconInbox width={20} height={20} />} label="Total pedidos" value={stats.totalOrders} />
        <StatTile
          icon={<IconTrendingUp width={20} height={20} />}
          label="Ingresos totales"
          value={CURRENCY_FORMATTER.format(stats.estimatedRevenue)}
          tone="hero"
        />
        <StatTile
          icon={<IconCheckCircle width={20} height={20} />}
          label="Entregados"
          value={stats.statusCounts.ENTREGADO}
          tone="success"
        />
        <StatTile
          icon={<IconAlertTriangle width={20} height={20} />}
          label="Cancelados"
          value={stats.statusCounts.CANCELADO}
          tone="error"
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2>Pedidos por día (últimos 7 días)</h2>
          <CountChart kind="bar" data={dayData} />
        </div>
        <div className="card">
          <h2>Pedidos por estado</h2>
          <DonutChart data={donutData} />
        </div>
      </div>

      {stats.topProducts.length > 0 && (
        <div className="card">
          <h2>Productos más pedidos</h2>
          <div className="bar-list">
            {stats.topProducts.map((p) => (
              <div className="bar-row" key={p.productName}>
                <span className="bar-label">{p.productName}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(p.quantity / stats.topProducts[0].quantity) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{p.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.deliveriesByDriver.length > 0 && (
        <div className="card">
          <h2>Entregas por repartidor</h2>
          <ul className="activity-list">
            {stats.deliveriesByDriver.map((d) => (
              <li key={d.driverName} className="activity-row" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                <Avatar name={d.driverName} size={30} />
                <span>{d.driverName}</span>
                <span className="text-muted">{d.count} entregas</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
