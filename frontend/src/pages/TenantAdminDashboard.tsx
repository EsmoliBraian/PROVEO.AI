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

interface Stats {
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  estimatedRevenue: number;
  topProducts: { productName: string; quantity: number; revenue: number }[];
  deliveriesByDriver: { driverName: string; count: number }[];
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function TenantAdminDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", password: "" });

  function refreshAll() {
    Promise.all([
      api.get<Product[]>("/products"),
      api.get<Order[]>("/orders"),
      api.get<Driver[]>("/team/drivers"),
      api.get<Stats>("/stats"),
    ]).then(([p, o, d, s]) => {
      setProducts(p);
      setOrders(o);
      setDrivers(d);
      setStats(s);
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

          {stats && (
            <section className="card">
              <h2>Estadísticas</h2>
              <div className="stat-tile-row">
                <div className="stat-tile stat-tile-hero">
                  <div className="stat-tile-label">Facturación estimada</div>
                  <div className="stat-tile-value">{CURRENCY_FORMATTER.format(stats.estimatedRevenue)}</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-label">Pedidos totales</div>
                  <div className="stat-tile-value">{stats.totalOrders}</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-label">Entregados</div>
                  <div className="stat-tile-value">{stats.deliveredOrders}</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-label">Pendientes</div>
                  <div className="stat-tile-value">{stats.pendingOrders}</div>
                </div>
              </div>

              {stats.topProducts.length > 0 && (
                <>
                  <h3>Productos más pedidos</h3>
                  <div className="bar-list">
                    {stats.topProducts.map((p) => (
                      <div className="bar-row" key={p.productName}>
                        <span className="bar-label">{p.productName}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${(p.quantity / stats.topProducts[0].quantity) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="bar-value">{p.quantity}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {stats.deliveriesByDriver.length > 0 && (
                <>
                  <h3>Entregas por repartidor</h3>
                  <ul className="product-list">
                    {stats.deliveriesByDriver.map((d) => (
                      <li key={d.driverName} className="product-row">
                        <span>{d.driverName}</span>
                        <span className="text-muted">{d.count} entregas</span>
                        <span />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

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
