import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Product {
  id: string;
  name: string;
  price: string;
  active: boolean;
  aliases: { id: string; alias: string }[];
}

export function TenantAdminDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Product[]>("/products")
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

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
            <h2>Catálogo de productos</h2>
            {loading && <p>Cargando…</p>}
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

          <section className="card">
            <h2>Próximamente</h2>
            <p className="text-muted">
              Pedidos por WhatsApp, interpretación con IA, asignación a repartidores y
              estadísticas se suman en las próximas fases del roadmap.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
