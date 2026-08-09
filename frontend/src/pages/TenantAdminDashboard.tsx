import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Product {
  id: string;
  name: string;
  price: string;
  active: boolean;
  aliases: { id: string; alias: string }[];
}

interface Driver {
  id: string;
  name: string;
  phone: string | null;
}

interface OrderItem {
  id: string;
  rawFragment: string;
  quantity: number;
  matched: boolean;
  product: { name: string } | null;
}

interface Order {
  id: string;
  customerPhone: string;
  rawMessage: string;
  status: "PENDING" | "DELIVERED" | "CANCELLED";
  receivedAt: string;
  aiConfidence: number | null;
  items: OrderItem[];
  assignedDriver: { id: string; name: string } | null;
}

export function TenantAdminDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", password: "" });

  function refreshAll() {
    Promise.all([
      api.get<Product[]>("/products"),
      api.get<Order[]>("/orders"),
      api.get<Driver[]>("/team/drivers"),
    ]).then(([p, o, d]) => {
      setProducts(p);
      setOrders(o);
      setDrivers(d);
      setLoading(false);
    });
  }

  useEffect(refreshAll, []);

  async function handleAssign(orderId: string, driverId: string) {
    await api.patch(`/orders/${orderId}/assign`, { driverId: driverId || null });
    refreshAll();
  }

  async function handleAddDriver(e: FormEvent) {
    e.preventDefault();
    await api.post("/team/drivers", driverForm);
    setDriverForm({ name: "", phone: "", password: "" });
    refreshAll();
  }

  return (
    <div className="app-shell">
      <main className="app-content">
        <div className="app-content-inner">
          <header className="page-header">
            <div>
              <h1>{user?.tenantName}</h1>
              <p className="text-muted">Panel del distribuidor</p>
            </div>
            <button className="btn btn-secondary" onClick={logout}>
              Cerrar sesión
            </button>
          </header>

          <section className="card">
            <h2>Pedidos</h2>
            {loading && <p>Cargando…</p>}
            {!loading && orders.length === 0 && (
              <p className="text-muted">
                Todavía no llegó ningún pedido por WhatsApp.
              </p>
            )}
            <ul className="product-list">
              {orders.map((o) => (
                <li key={o.id} className="order-row">
                  <div className="order-row-header">
                    <span>{o.customerPhone}</span>
                    <span className={`order-status order-status-${o.status.toLowerCase()}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="text-muted">"{o.rawMessage}"</p>
                  <ul className="order-items">
                    {o.items.map((it) => (
                      <li key={it.id}>
                        {it.quantity}x {it.product?.name ?? `⚠️ ${it.rawFragment} (sin identificar)`}
                      </li>
                    ))}
                  </ul>
                  {o.status === "PENDING" && (
                    <select
                      className="field-input"
                      value={o.assignedDriver?.id ?? ""}
                      onChange={(e) => handleAssign(o.id, e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Repartidores</h2>
            <ul className="product-list">
              {drivers.map((d) => (
                <li key={d.id} className="product-row">
                  <span>{d.name}</span>
                  <span className="text-muted">{d.phone}</span>
                  <span />
                </li>
              ))}
            </ul>
            <form className="tenant-form" onSubmit={handleAddDriver}>
              <input
                className="field-input"
                placeholder="Nombre"
                value={driverForm.name}
                onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                required
              />
              <input
                className="field-input"
                placeholder="Celular (con código de país)"
                value={driverForm.phone}
                onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                required
              />
              <input
                className="field-input"
                type="password"
                placeholder="Contraseña inicial"
                value={driverForm.password}
                onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                required
                minLength={8}
              />
              <button className="btn btn-primary" type="submit">
                Agregar repartidor
              </button>
            </form>
          </section>

          <section className="card">
            <h2>Catálogo de productos</h2>
            {!loading && products.length === 0 && (
              <p className="text-muted">Todavía no cargaste ningún producto.</p>
            )}
            <ul className="product-list">
              {products.map((p) => (
                <li key={p.id} className="product-row">
                  <span>{p.name}</span>
                  <span className="text-muted">${p.price}</span>
                  <span className="text-muted">
                    {p.aliases.map((a) => a.alias).join(", ") || "sin alias"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
