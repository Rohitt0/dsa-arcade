import { NavLink, Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type IconName = 'map' | 'grid' | 'user';

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    className: cn('h-5 w-5', className),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'map':
      return (
        <svg {...common}>
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
        </svg>
      );
  }
}

const navItems: { to: string; label: string; icon: IconName }[] = [
  { to: '/world', label: 'World', icon: 'map' },
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center border-2 border-ink bg-gold font-pixel text-xs text-ink">
        D
      </span>
      {!compact && (
        <span className="font-pixel text-[11px] leading-tight text-parchment">DSA Arcade</span>
      )}
    </div>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const isDedicatedGame = pathname.startsWith('/game/');
  if (isDedicatedGame) {
    return (
      <div className="h-dvh w-full overflow-hidden bg-night-900">
        <Outlet />
      </div>
    );
  }
  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop / tablet sidebar (>= md) */}
      <aside className="sticky top-0 hidden h-dvh w-20 shrink-0 flex-col border-r-2 border-ink bg-night-800 p-3 md:flex lg:w-60 lg:p-4">
        <div className="mb-8 px-1">
          <span className="lg:hidden">
            <Brand compact />
          </span>
          <span className="hidden lg:block">
            <Brand />
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[44px] items-center justify-center gap-3 border-2 px-2 font-pixel text-[10px] uppercase tracking-wide transition-colors lg:justify-start lg:px-3',
                  isActive
                    ? 'border-ink bg-gold text-ink'
                    : 'border-transparent text-stone-300 hover:bg-night-700 hover:text-parchment',
                )
              }
            >
              <Icon name={item.icon} />
              <span className="sr-only lg:not-sr-only">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar (< md) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-ink bg-night-800 px-4 md:hidden">
        <Brand />
      </header>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-24 sm:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav (< md) — fixed, one-handed reachable, 44px+ targets */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t-2 border-ink bg-night-800 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex min-h-[56px] flex-col items-center justify-center gap-1 font-pixel text-[8px] uppercase tracking-wide',
                isActive ? 'bg-night-700 text-gold' : 'text-stone-300',
              )
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Simple centered page wrapper used by auth screens (no shell/nav). */
export function CenteredLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">{children}</div>
  );
}
