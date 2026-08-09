import { useAuth } from "../context/AuthContext";

export function RepartidorView() {
  const { user, logout } = useAuth();

  return (
    <div className="repartidor-shell">
      <header className="repartidor-header">
        <span>Hola, {user?.name}</span>
        <button className="btn btn-secondary" onClick={logout}>
          Salir
        </button>
      </header>
      <div className="card">
        <p className="text-muted">
          Todavía no tenés pedidos asignados — esta vista se completa en la Fase 2 del
          roadmap (asignación de pedidos y marcado de "Entregado").
        </p>
      </div>
    </div>
  );
}
