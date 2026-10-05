import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { bootstrapAuth } from './features/auth/useAuth';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { TitlePage } from './pages/TitlePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorldMapPage } from './pages/WorldMapPage';
import { RegionPage } from './pages/RegionPage';
import { PatternPage } from './pages/PatternPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false },
  },
});

export function App() {
  // Restore any existing session once on load (refresh cookie -> access token -> /me).
  useEffect(() => {
    void bootstrapAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<TitlePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected (renders inside the responsive AppShell) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/world" element={<WorldMapPage />} />
            <Route path="/region/:slug" element={<RegionPage />} />
            <Route path="/pattern/:slug" element={<PatternPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
