import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute({ roles = [] }) {
  const { isAuthenticated, isLoadingAuth, profile } = useAuth();

  if (isLoadingAuth) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
