import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { StatusPill } from "../components/StatusPill";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "../types/models";

const TABS: { key: OrderStatus | "TODOS"; label: string }[] = [
  { key: "TODOS", label: "Todos" },
  { key: "NUEVO", label: "Nuevos" },
  { key: "EN_PROCESO", label: "En Proceso" },
  { key: "EN_CAMINO", label: "En Camino" },
  { key: "ENTREGADO", label: "Entregados" },
  { key: "CANCELADO", label: "Cancelados" },
];

export function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrderStatus | "TODOS">("TODOS");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<Order[]>("/orders").then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { TODOS: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = orders.filter((o) => {
    if (tab !== "TODOS" && o.status !== tab) return false;
    if (search && !o.customerPhone.includes(search) && !o.rawMessage.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Pedidos</h1>
          <p className="text-muted">Gestión y seguimiento de pedidos</p>
        </div>
      </div>

      <div className="tabs-row">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-btn${tab === t.key ? " tab-btn-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className="tab-count">{counts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <input
        className="field-input"
        style={{ marginBottom: "1rem" }}
        placeholder="Buscar por celular o mensaje…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Cargando…</p>}
      {!loading && filtered.length === 0 && <p className="text-muted">No hay pedidos en esta vista.</p>}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>Repartidor</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/pedidos/${o.id}`}>{o.customerPhone}</Link>
                  </td>
                  <td className="text-muted">{o.items.length} producto{o.items.length === 1 ? "" : "s"}</td>
                  <td>
                    <StatusPill status={o.status} />
                  </td>
                  <td className="text-muted">{o.assignedDriver?.name ?? "-"}</td>
                  <td className="text-muted">{new Date(o.receivedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
