import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Tenant {
  id: string;
  name: string;
  subscriptionStatus: "ACTIVE" | "OVERDUE" | "SUSPENDED";
  _count: { users: number; orders: number };
}

export function SuperAdminPage() {
  const { logout } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState({ name: "", adminName: "", adminEmail: "", adminPassword: "" });
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.get<Tenant[]>("/tenants").then(setTenants);
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/tenants", form);
      setForm({ name: "", adminName: "", adminEmail: "", adminPassword: "" });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el tenant");
    }
  }

  async function handleStatusChange(id: string, status: Tenant["subscriptionStatus"]) {
    await api.patch(`/tenants/${id}/subscription`, { status });
    refresh();
  }

  return (
    <div className="app-shell">
      <main className="app-content">
        <div className="app-content-inner">
          <header className="page-header">
            <h1>PROVEO.AI — Super admin</h1>
            <button className="btn btn-secondary" onClick={logout}>
              Cerrar sesión
            </button>
          </header>

          <section className="card">
            <h2>Nuevo distribuidor</h2>
            <form className="tenant-form" onSubmit={handleCreate}>
              <input
                className="field-input"
                placeholder="Nombre del negocio"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="field-input"
                placeholder="Nombre del dueño"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                required
              />
              <input
                className="field-input"
                type="email"
                placeholder="Email del dueño"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
              />
              <input
                className="field-input"
                type="password"
                placeholder="Contraseña inicial"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                required
                minLength={8}
              />
              <button className="btn btn-primary" type="submit">
                Dar de alta
              </button>
            </form>
            {error && <p className="login-error">{error}</p>}
          </section>

          <section className="card">
            <h2>Distribuidores</h2>
            <ul className="product-list">
              {tenants.map((t) => (
                <li key={t.id} className="product-row">
                  <span>{t.name}</span>
                  <span className="text-muted">{t._count.users} usuarios</span>
                  <select
                    className="field-input"
                    value={t.subscriptionStatus}
                    onChange={(e) =>
                      handleStatusChange(t.id, e.target.value as Tenant["subscriptionStatus"])
                    }
                  >
                    <option value="ACTIVE">Al día</option>
                    <option value="OVERDUE">Vencida</option>
                    <option value="SUSPENDED">Suspendido</option>
                  </select>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
