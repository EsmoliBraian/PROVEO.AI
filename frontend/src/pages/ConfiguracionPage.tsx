import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Product } from "../types/models";

const emptyForm = { name: "", price: "", aliases: "" };

export function ConfiguracionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.get<Product[]>("/products").then(setProducts);
  }

  useEffect(refresh, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/products", {
        name: form.name,
        price: Number(form.price),
        aliases: form.aliases
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      });
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el producto");
    }
  }

  async function toggleActive(p: Product) {
    await api.patch(`/products/${p.id}`, { active: !p.active });
    refresh();
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p className="text-muted">Ajustes del sistema</p>
        </div>
      </div>

      <div className="card">
        <h2>Productos y Precios</h2>
        <ul className="product-list">
          {products.map((p) => (
            <li key={p.id} className="product-row">
              <span style={{ opacity: p.active ? 1 : 0.5 }}>{p.name}</span>
              <span className="text-muted">${p.price}</span>
              <button className="btn btn-secondary" onClick={() => toggleActive(p)}>
                {p.active ? "Desactivar" : "Activar"}
              </button>
            </li>
          ))}
        </ul>
        <form className="tenant-form" onSubmit={handleCreate}>
          <input
            className="field-input"
            placeholder="Nombre del producto"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="field-input"
            type="number"
            step="0.01"
            placeholder="Precio"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <input
            className="field-input"
            placeholder="Alias (separados por coma)"
            value={form.aliases}
            onChange={(e) => setForm({ ...form, aliases: e.target.value })}
          />
          <button className="btn btn-primary" type="submit">
            Agregar producto
          </button>
        </form>
        {error && <p className="login-error">{error}</p>}
      </div>

      <div className="card">
        <h2>Usuarios y Permisos</h2>
        <p className="text-muted">
          Alta, baja y estado de los repartidores se maneja desde{" "}
          <Link to="/repartidores">la sección Repartidores</Link>.
        </p>
      </div>

      <div className="config-soon-grid">
        <div className="card config-soon">
          <h2>Notificaciones</h2>
          <p className="text-muted">Configurar alertas y notificaciones</p>
          <span className="badge-soon">Próximamente</span>
        </div>
        <div className="card config-soon">
          <h2>Integración WhatsApp</h2>
          <p className="text-muted">La conexión del número la maneja el operador de PROVEO.AI</p>
          <span className="badge-soon">Próximamente</span>
        </div>
        <div className="card config-soon">
          <h2>Respaldo y Datos</h2>
          <p className="text-muted">Backup y exportación de datos</p>
          <span className="badge-soon">Próximamente</span>
        </div>
      </div>
    </section>
  );
}
