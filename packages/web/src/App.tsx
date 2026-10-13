import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { bootstrapAuth } from './features/auth/useAuth';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { TitlePage } from './pages/TitlePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorldMapPage } from './pages/WorldMapPage';
import { PatternPage } from './pages/PatternPage';
import { ChallengePage } from './pages/ChallengePage';
import { GreenhouseGamePage } from './pages/GreenhouseGamePage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BinarySearchPreviewPage } from './pages/BinarySearchPreviewPage';
import { BinarySearchGamePage } from './pages/BinarySearchGamePage';

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
            <Route path="/region/:slug" element={<Navigate to="/pattern/sliding-window" replace />} />
            <Route path="/pattern/sliding-window" element={<PatternPage />} />
            <Route path="/pattern/binary-search" element={<BinarySearchPreviewPage />} />
            <Route path="/pattern/:slug" element={<Navigate to="/pattern/sliding-window" replace />} />
            <Route path="/challenge/:slug" element={<ChallengePage />} />
            <Route path="/game/greenhouse" element={<GreenhouseGamePage />} />
            <Route path="/game/observatory" element={<BinarySearchGamePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
