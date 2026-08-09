import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { DonutChart } from "../components/DonutChart";
import { CountChart } from "../components/CountChart";
import { StatusPill } from "../components/StatusPill";
import { CURRENCY_FORMATTER, type Order, type TenantStats } from "../types/models";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function DashboardPage() {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<TenantStats>("/stats"), api.get<Order[]>("/orders")]).then(([s, o]) => {
      setStats(s);
      setOrders(o);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) return <p>Cargando…</p>;

  const recentActivity = [...orders]
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    .slice(0, 6);

  const clientCounts = new Map<string, number>();
  for (const o of orders) clientCounts.set(o.customerPhone, (clientCounts.get(o.customerPhone) ?? 0) + 1);
  const topClients = [...clientCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const donutData = [
    { label: "Nuevos", value: stats.statusCounts.NUEVO, color: "var(--color-primary)" },
    { label: "En proceso", value: stats.statusCounts.EN_PROCESO, color: "var(--color-warning)" },
    { label: "En camino", value: stats.statusCounts.EN_CAMINO, color: "var(--color-info)" },
    { label: "Entregados", value: stats.statusCounts.ENTREGADO, color: "var(--color-success)" },
    { label: "Cancelados", value: stats.statusCounts.CANCELADO, color: "var(--color-error)" },
  ];

  const hourData = stats.ordersByHour
    .filter((_, i) => i % 2 === 0)
    .map((h) => ({ label: `${h.hour}h`, count: h.count }));

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Resumen general del sistema</p>
        </div>
      </div>

      <div className="stat-tile-row">
        <div className="stat-tile">
          <div className="stat-tile-label">Pedidos hoy</div>
          <div className="stat-tile-value">{stats.today.orders}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">En proceso</div>
          <div className="stat-tile-value">{stats.statusCounts.EN_PROCESO}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Entregados</div>
          <div className="stat-tile-value">{stats.statusCounts.ENTREGADO}</div>
        </div>
        <div className="stat-tile stat-tile-hero">
          <div className="stat-tile-label">Ingresos hoy</div>
          <div className="stat-tile-value">{CURRENCY_FORMATTER.format(stats.today.revenue)}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2>Pedidos por estado</h2>
          <DonutChart data={donutData} />
        </div>
        <div className="card">
          <h2>Pedidos por hora</h2>
          <CountChart kind="line" data={hourData} />
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2>Actividad reciente</h2>
          {recentActivity.length === 0 && <p className="text-muted">Todavía no hay pedidos.</p>}
          <ul className="activity-list">
            {recentActivity.map((o) => (
              <li key={o.id}>
                <Link to={`/pedidos/${o.id}`} className="activity-row">
                  <span>{o.customerPhone}</span>
                  <StatusPill status={o.status} />
                  <span className="text-muted">{relativeTime(o.receivedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2>Top clientes</h2>
          {topClients.length === 0 && <p className="text-muted">Todavía no hay pedidos.</p>}
          <ul className="product-list">
            {topClients.map(([phone, count], i) => (
              <li key={phone} className="product-row">
                <span>
                  {i + 1}. {phone}
                </span>
                <span className="text-muted">{count} pedidos</span>
                <span />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
