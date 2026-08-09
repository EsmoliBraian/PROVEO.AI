import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { IconNavigation, IconTruck, IconUsers } from "../components/icons";
import type { Order } from "../types/models";

interface DriverSummary {
  deliveredToday: number;
  deliveredThisWeek: number;
}

type Tab = "entregas" | "perfil";

function openNavigation(order: Order) {
  const query = encodeURIComponent(order.deliveryAddress || order.customerPhone);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
}

export function RepartidorView() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<DriverSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("entregas");

  function refresh() {
    Promise.all([api.get<Order[]>("/orders/mine"), api.get<DriverSummary>("/orders/mine/summary")]).then(
      ([o, s]) => {
        setOrders(o);
        setSummary(s);
        setLoading(false);
      },
    );
  }

  useEffect(refresh, []);

  async function handleEnCamino(orderId: string) {
    await api.patch(`/orders/${orderId}/en-camino`);
    refresh();
  }

  async function handleDeliver(orderId: string) {
    await api.patch(`/orders/${orderId}/deliver`);
    refresh();
  }

  return (
    <div className="repartidor-shell">
      <header className="repartidor-header">
        <span>Hola, {user?.name}</span>
        <button className="btn btn-secondary" onClick={logout}>
          Salir
        </button>
      </header>

      <div className="tabs-row">
        <button
          className={`tab-btn${tab === "entregas" ? " tab-btn-active" : ""}`}
          onClick={() => setTab("entregas")}
        >
          <IconTruck width={16} height={16} /> Mis Entregas
        </button>
        <button className={`tab-btn${tab === "perfil" ? " tab-btn-active" : ""}`} onClick={() => setTab("perfil")}>
          <IconUsers width={16} height={16} /> Perfil
        </button>
      </div>

      {tab === "entregas" && (
        <>
          {loading && <p>Cargando…</p>}
          {!loading && orders.length === 0 && (
            <div className="card">
              <p className="text-muted">No tenés pedidos asignados por ahora.</p>
            </div>
          )}

          {orders.map((o) => (
            <div key={o.id} className="card">
              <p>
                <strong>{o.customerPhone}</strong>
              </p>
              {o.deliveryAddress && <p className="text-muted">{o.deliveryAddress}</p>}
              <ul className="order-items">
                {o.items.map((it) => (
                  <li key={it.id}>
                    {it.quantity}x {it.product?.name ?? it.rawFragment}
                  </li>
                ))}
              </ul>
              <div className="action-row">
                <button className="btn btn-secondary" onClick={() => openNavigation(o)}>
                  <IconNavigation width={16} height={16} /> Navegación
                </button>
                {o.status === "EN_PROCESO" && (
                  <button className="btn btn-primary" onClick={() => handleEnCamino(o.id)}>
                    Salir a entregar
                  </button>
                )}
                {o.status === "EN_CAMINO" && (
                  <button className="btn btn-primary" onClick={() => handleDeliver(o.id)}>
                    Confirmar entrega
                  </button>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "perfil" && summary && (
        <div className="card">
          <p>
            <strong>{user?.name}</strong>
          </p>
          <p className="text-muted">{user?.tenantName}</p>
          <div className="stat-tile-row" style={{ marginTop: "1rem" }}>
            <div className="stat-tile">
              <div className="stat-tile-label">Entregas hoy</div>
              <div className="stat-tile-value">{summary.deliveredToday}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Entregas esta semana</div>
              <div className="stat-tile-value">{summary.deliveredThisWeek}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
