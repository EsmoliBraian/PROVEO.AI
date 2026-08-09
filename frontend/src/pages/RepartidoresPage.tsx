import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { Avatar } from "../components/Avatar";
import type { Driver, Order, TenantStats } from "../types/models";

export function RepartidoresPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    Promise.all([
      api.get<Driver[]>("/team/drivers"),
      api.get<Order[]>("/orders"),
      api.get<TenantStats>("/stats"),
    ]).then(([d, o, s]) => {
      setDrivers(d);
      setOrders(o);
      setStats(s);
    });
  }

  useEffect(refresh, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/team/drivers", form);
      setForm({ name: "", phone: "", password: "" });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar repartidor");
    }
  }

  async function toggleActive(driver: Driver) {
    await api.patch(`/team/drivers/${driver.id}`, { active: !driver.active });
    refresh();
  }

  const deliveryCountByDriver = new Map(stats?.deliveriesByDriver.map((d) => [d.driverName, d.count]) ?? []);
  const activeCountByDriver = new Map<string, number>();
  for (const o of orders) {
    if (o.assignedDriver && (o.status === "EN_PROCESO" || o.status === "EN_CAMINO")) {
      activeCountByDriver.set(o.assignedDriver.id, (activeCountByDriver.get(o.assignedDriver.id) ?? 0) + 1);
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Repartidores</h1>
          <p className="text-muted">Gestión de repartidores y entregas</p>
        </div>
      </div>

      <div className="card">
        <div className="driver-grid">
          {drivers.map((d) => (
            <div key={d.id} className="driver-card">
              <div className="driver-card-header">
                <Avatar name={d.name} size={40} />
                <div>
                  <div className="driver-card-name">{d.name}</div>
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                    <span className={`driver-status-dot${d.active ? "" : " driver-status-dot-off"}`} />{" "}
                    {d.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="driver-card-stats">
                <div>
                  <div className="driver-card-stat-value">{activeCountByDriver.get(d.id) ?? 0}</div>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    en curso
                  </span>
                </div>
                <div>
                  <div className="driver-card-stat-value">{deliveryCountByDriver.get(d.name) ?? 0}</div>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                    entregas
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => toggleActive(d)}>
                {d.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Agregar repartidor</h2>
        <form className="tenant-form" onSubmit={handleAdd}>
          <input
            className="field-input"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="field-input"
            placeholder="Celular (con código de país)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <input
            className="field-input"
            type="password"
            placeholder="Contraseña inicial"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
          <button className="btn btn-primary" type="submit">
            Agregar
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
      </div>
    </section>
  );
}
