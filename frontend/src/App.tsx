import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { TenantAdminDashboard } from "./pages/TenantAdminDashboard";
import { RepartidorView } from "./pages/RepartidorView";
import { SuperAdminPage } from "./pages/SuperAdminPage";

function HomeByRole() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "SUPER_ADMIN":
      return <SuperAdminPage />;
    case "TENANT_ADMIN":
      return <TenantAdminDashboard />;
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
