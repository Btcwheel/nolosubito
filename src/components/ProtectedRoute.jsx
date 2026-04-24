import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute({ roles = [], redirectTo }) {
  const { isAuthenticated, isLoadingAuth, profile } = useAuth();

  if (isLoadingAuth) return null;

  if (!isAuthenticated) {
    // Determina la pagina di login corretta in base al ruolo richiesto
    const loginPage = redirectTo ?? (
      roles.includes('agente')                          ? '/partner/accedi' :
      roles.includes('cliente') && !roles.includes('admin') ? '/accedi' :
      '/login'
    );
    return <Navigate to={loginPage} replace />;
  }

  if (roles.length > 0 && !roles.includes(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
