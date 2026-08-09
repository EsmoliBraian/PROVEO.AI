import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface OrderItem {
  id: string;
  quantity: number;
  rawFragment: string;
  product: { name: string } | null;
}

interface Order {
  id: string;
  customerPhone: string;
  deliveryAddress: string | null;
  items: OrderItem[];
}

export function RepartidorView() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    api
      .get<Order[]>("/orders/mine")
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

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
          <button className="btn btn-primary" onClick={() => handleDeliver(o.id)}>
            Marcar entregado
          </button>
        </div>
      ))}
    </div>
  );
}
