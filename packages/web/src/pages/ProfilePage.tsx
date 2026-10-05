import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { PixelButton, PixelPanel } from '../components/ui';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-ink/40 py-3 last:border-0">
      <span className="font-pixel text-[9px] uppercase tracking-wide text-stone-400">{label}</span>
      <span className="min-w-0 truncate text-sm text-parchment">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const memberSince = user ? new Date(user.createdAt).toLocaleDateString() : '';

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-6">
        <h1 className="text-xl text-gold">Profile</h1>
      </header>

      <PixelPanel title="Adventurer">
        <div className="flex flex-col">
          <Row label="Username" value={user?.username ?? '—'} />
          <Row label="Email" value={user?.email ?? '—'} />
          <Row label="XP" value={String(user?.xp ?? 0)} />
          <Row label="Member since" value={memberSince || '—'} />
        </div>
      </PixelPanel>

      <div className="mt-6">
        <PixelButton variant="danger" onClick={onLogout} loading={loggingOut} fullWidth>
          Log out
        </PixelButton>
      </div>
    </div>
  );
}
