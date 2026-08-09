import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { IconArrowLeft } from "../components/icons";
import { StatusPill } from "../components/StatusPill";
import type { Driver, Order } from "../types/models";

export function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    Promise.all([api.get<Order>(`/orders/${id}`), api.get<Driver[]>("/team/drivers")]).then(([o, d]) => {
      setOrder(o);
      setDrivers(d.filter((driver) => driver.active));
      setLoading(false);
    });
  }

  useEffect(refresh, [id]);

  async function runAction(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el pedido");
    }
  }

  if (loading || !order) return <p>Cargando…</p>;

  return (
    <section>
      <button className="btn btn-secondary" onClick={() => navigate("/pedidos")} style={{ marginBottom: "1rem" }}>
        <IconArrowLeft width={16} height={16} /> Volver
      </button>

      <div className="page-header">
        <div>
          <h1>Pedido #{order.id.slice(-6).toUpperCase()}</h1>
          <StatusPill status={order.status} />
        </div>
      </div>

      {error && <p className="login-error">{error}</p>}

      <div className="dashboard-grid">
        <div className="card">
          <h2>Información del cliente</h2>
          <p>{order.customerPhone}</p>
          {order.deliveryAddress && <p className="text-muted">{order.deliveryAddress}</p>}

          <h2>Productos</h2>
          <ul className="order-items">
            {order.items.map((it) => (
              <li key={it.id}>
                {it.quantity}x {it.product?.name ?? `⚠️ ${it.rawFragment} (sin identificar)`}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>WhatsApp original</h2>
          <p className="whatsapp-bubble">{order.rawMessage}</p>

          <h2>Interpretación IA</h2>
          {order.aiConfidence != null ? (
            <p>
              Confianza: <strong>{Math.round(order.aiConfidence * 100)}%</strong>
            </p>
          ) : (
            <p className="text-muted">Sin datos de confianza.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Acciones</h2>
        <div className="action-row">
          {(order.status === "NUEVO" || order.status === "EN_PROCESO") && (
            <select
              className="field-input"
              value={order.assignedDriver?.id ?? ""}
              onChange={(e) => runAction(() => api.patch(`/orders/${order.id}/assign`, { driverId: e.target.value || null }))}
            >
              <option value="">Asignar repartidor…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {order.status === "EN_PROCESO" && (
            <button className="btn btn-primary" onClick={() => runAction(() => api.patch(`/orders/${order.id}/en-camino`))}>
              Marcar en camino
            </button>
          )}

          {(order.status === "EN_PROCESO" || order.status === "EN_CAMINO") && (
            <button className="btn btn-primary" onClick={() => runAction(() => api.patch(`/orders/${order.id}/deliver`))}>
              Marcar entregado
            </button>
          )}

          {order.status !== "ENTREGADO" && order.status !== "CANCELADO" && (
            <button className="btn btn-danger" onClick={() => runAction(() => api.patch(`/orders/${order.id}/cancel`))}>
              Cancelar pedido
            </button>
          )}

          {(order.status === "ENTREGADO" || order.status === "CANCELADO") && (
            <p className="text-muted">Este pedido ya está en un estado final.</p>
          )}
        </div>
      </div>

      <Link to="/analisis-ia" className="text-muted" style={{ fontSize: "0.85rem" }}>
        ¿Un producto salió sin identificar? Revisalo en Análisis IA →
      </Link>
    </section>
  );
}
