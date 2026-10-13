import { NavLink, Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
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
  { to: '/world', label: 'Adventures', icon: 'map' },
  { to: '/dashboard', label: 'Progress', icon: 'grid' },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const isDedicatedGame = pathname.startsWith('/game/');
  if (isDedicatedGame) {
    return (
      <div className="h-dvh w-full overflow-hidden bg-night-900">
        <Outlet />
      </div>
    );
  }
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-night-900/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <NavLink to="/world" aria-label="DSA Arcade Adventures" className="rounded-sm focus-visible:ring-2 focus-visible:ring-gold">
            <Brand />
          </NavLink>
          <button type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)} className="grid h-11 w-11 place-items-center border-2 border-ink text-parchment sm:hidden">
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden="true" className="font-pixel text-xs">{menuOpen ? '×' : '☰'}</span>
          </button>
          <nav id="primary-navigation" aria-label="Primary" className={cn('absolute inset-x-0 top-full border-b-2 border-ink bg-night-900 px-4 py-3 sm:static sm:flex sm:border-0 sm:bg-transparent sm:p-0', menuOpen ? 'flex flex-col gap-2' : 'hidden sm:flex sm:items-center sm:gap-2')}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => {
                const active = isActive || (item.to === '/world' && (pathname.startsWith('/pattern/') || pathname.startsWith('/region/')));
                return cn('flex min-h-11 items-center gap-2 border-2 px-3 font-pixel text-[9px] uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold', active ? 'border-gold bg-night-700 text-gold' : 'border-transparent text-stone-300 hover:border-night-600 hover:text-parchment');
              }}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}

/** Simple centered page wrapper used by auth screens (no shell/nav). */
export function CenteredLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">{children}</div>
  );
}
