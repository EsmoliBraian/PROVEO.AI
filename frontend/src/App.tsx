import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TenantLayout } from "./layouts/TenantLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PedidosPage } from "./pages/PedidosPage";
import { PedidoDetallePage } from "./pages/PedidoDetallePage";
import { RepartidoresPage } from "./pages/RepartidoresPage";
import { EstadisticasPage } from "./pages/EstadisticasPage";
import { AnalisisIAPage } from "./pages/AnalisisIAPage";
import { ConfiguracionPage } from "./pages/ConfiguracionPage";
import { RepartidorView } from "./pages/RepartidorView";
import { SuperAdminPage } from "./pages/SuperAdminPage";
import type { Role } from "./types/auth";

function RequireRole({ allow, children }: { allow: Role[]; children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeByRole() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "SUPER_ADMIN":
      return <SuperAdminPage />;
    case "TENANT_ADMIN":
      return <Navigate to="/dashboard" replace />;
    case "REPARTIDOR":
      return <RepartidorView />;
  }
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/" element={<HomeByRole />} />

      <Route
        element={
          <RequireRole allow={["TENANT_ADMIN"]}>
            <TenantLayout />
          </RequireRole>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pedidos" element={<PedidosPage />} />
        <Route path="/pedidos/:id" element={<PedidoDetallePage />} />
        <Route path="/repartidores" element={<RepartidoresPage />} />
        <Route path="/estadisticas" element={<EstadisticasPage />} />
        <Route path="/analisis-ia" element={<AnalisisIAPage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
