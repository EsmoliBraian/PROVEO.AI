import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { STOCK_STATUS_LABELS, type Product, type ProductStockStatus } from "../types/models";

const emptyForm = { name: "", price: "", aliases: "" };

interface BusinessSettings {
  businessHours: string | null;
  deliveryZone: string | null;
  deliveryCost: string | null;
  paymentMethodsInfo: string | null;
}

const emptySettingsForm = { businessHours: "", deliveryZone: "", deliveryCost: "", paymentMethodsInfo: "" };

export function ConfiguracionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const [settingsForm, setSettingsForm] = useState(emptySettingsForm);
  const [settingsSaved, setSettingsSaved] = useState(false);

  function refresh() {
    api.get<Product[]>("/products").then(setProducts);
  }

  useEffect(refresh, []);

  useEffect(() => {
    api.get<BusinessSettings>("/settings").then((s) => {
      setSettingsForm({
        businessHours: s.businessHours ?? "",
        deliveryZone: s.deliveryZone ?? "",
        deliveryCost: s.deliveryCost ?? "",
        paymentMethodsInfo: s.paymentMethodsInfo ?? "",
      });
    });
  }, []);

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

  async function changeStockStatus(p: Product, stockStatus: ProductStockStatus) {
    await api.patch(`/products/${p.id}`, { stockStatus });
    refresh();
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    setSettingsSaved(false);
    await api.patch("/settings", {
      businessHours: settingsForm.businessHours || null,
      deliveryZone: settingsForm.deliveryZone || null,
      deliveryCost: settingsForm.deliveryCost ? Number(settingsForm.deliveryCost) : null,
      paymentMethodsInfo: settingsForm.paymentMethodsInfo || null,
    });
    setSettingsSaved(true);
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
        <h2>Datos del negocio</h2>
        <p className="text-muted">
          La IA usa esta información para responder consultas de clientes (horarios, zona de entrega, envío,
          pagos) sin inventar nada — si un dato no está cargado acá, el asistente le va a decir al cliente que
          todavía no está configurado.
        </p>
        <form className="tenant-form" onSubmit={handleSaveSettings}>
          <input
            className="field-input"
            placeholder="Horario de atención (ej. Lun a Sáb de 9 a 20hs)"
            value={settingsForm.businessHours}
            onChange={(e) => setSettingsForm({ ...settingsForm, businessHours: e.target.value })}
          />
          <input
            className="field-input"
            placeholder="Zona de entrega (ej. Sierra de la Ventana y alrededores)"
            value={settingsForm.deliveryZone}
            onChange={(e) => setSettingsForm({ ...settingsForm, deliveryZone: e.target.value })}
          />
          <input
            className="field-input"
            type="number"
            step="0.01"
            placeholder="Costo de envío"
            value={settingsForm.deliveryCost}
            onChange={(e) => setSettingsForm({ ...settingsForm, deliveryCost: e.target.value })}
          />
          <input
            className="field-input"
            placeholder="Métodos de pago (ej. Efectivo y transferencia)"
            value={settingsForm.paymentMethodsInfo}
            onChange={(e) => setSettingsForm({ ...settingsForm, paymentMethodsInfo: e.target.value })}
          />
          <button className="btn btn-primary" type="submit">
            Guardar
          </button>
        </form>
        {settingsSaved && <p className="text-muted">Guardado ✓</p>}
      </div>

      <div className="card">
        <h2>Productos y Precios</h2>
        <ul className="product-list">
          {products.map((p) => (
            <li key={p.id} className="product-row">
              <span style={{ opacity: p.stockStatus === "DISPONIBLE" ? 1 : 0.5 }}>{p.name}</span>
              <span className="text-muted">${p.price}</span>
              <select
                className="field-input"
                value={p.stockStatus}
                onChange={(e) => changeStockStatus(p, e.target.value as ProductStockStatus)}
              >
                {Object.entries(STOCK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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
