import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AppShell } from '../layouts/AppShell';
import { LoadingState } from '../components/feedback';

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingState label="Entering the arcade…" />
      </div>
    );
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppShell />;
}
