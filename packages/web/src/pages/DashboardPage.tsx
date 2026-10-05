import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { PixelButton, PixelCard, PixelPanel } from '../components/ui';

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <PixelCard className="text-center">
      <p className="font-pixel text-lg text-gold">{value}</p>
      <p className="mt-2 font-pixel text-[8px] uppercase tracking-wide text-stone-400">{label}</p>
    </PixelCard>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl text-gold">
          Hey{user ? `, ${user.username}` : ''} 👋
        </h1>
        <p className="mt-2 text-sm text-stone-300">Here's where your adventure stands.</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="XP" value={String(user?.xp ?? 0)} />
        <StatTile label="Patterns mastered" value="0" />
        <StatTile label="Day streak" value="—" />
      </div>

      <PixelPanel title="Continue your journey">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-300">
            Your path begins in the first region. Jump back into the world to keep exploring.
          </p>
          <Link to="/world" className="w-full sm:w-auto">
            <PixelButton fullWidth>To the world</PixelButton>
          </Link>
        </div>
      </PixelPanel>

      <p className="mt-6 text-center text-xs text-stone-400">
        Mastery, streaks and recommendations fill in as you play. (Progress tracking arrives in a
        later update.)
      </p>
    </div>
  );
}
