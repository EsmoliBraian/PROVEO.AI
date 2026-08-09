import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconBarChart,
  IconHome,
  IconInbox,
  IconLogOut,
  IconSettings,
  IconSparkles,
  IconTruck,
} from "../components/icons";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "sidebar-link sidebar-link-active" : "sidebar-link";

export function TenantLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="tenant-shell">
      <aside className="sidebar">
        <div className="sidebar-brand" title={user?.tenantName ?? ""}>
          {user?.tenantName?.slice(0, 1) ?? "P"}
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={navLinkClass} title="Dashboard">
            <IconHome width={20} height={20} />
          </NavLink>
          <NavLink to="/pedidos" className={navLinkClass} title="Pedidos">
            <IconInbox width={20} height={20} />
          </NavLink>
          <NavLink to="/repartidores" className={navLinkClass} title="Repartidores">
            <IconTruck width={20} height={20} />
          </NavLink>
          <NavLink to="/estadisticas" className={navLinkClass} title="Estadísticas">
            <IconBarChart width={20} height={20} />
          </NavLink>
          <NavLink to="/analisis-ia" className={navLinkClass} title="Análisis IA">
            <IconSparkles width={20} height={20} />
          </NavLink>
          <NavLink to="/configuracion" className={navLinkClass} title="Configuración">
            <IconSettings width={20} height={20} />
          </NavLink>
        </nav>
        <button className="sidebar-link sidebar-logout" onClick={logout} title="Cerrar sesión">
          <IconLogOut width={20} height={20} />
        </button>
      </aside>
      <main className="tenant-main">
        <Outlet />
      </main>
    </div>
  );
}
