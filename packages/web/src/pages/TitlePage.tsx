import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { CenteredLayout } from '../layouts/AppShell';
import { PixelButton } from '../components/ui';

export function TitlePage() {
  const { isAuthed } = useAuth();

  return (
    <CenteredLayout>
      <div className="w-full max-w-xl text-center">
        <p className="mb-4 font-pixel text-[10px] uppercase tracking-widest text-sky">
          A pixel quest through
        </p>
        <h1 className="text-2xl leading-relaxed text-gold sm:text-4xl">DSA Arcade</h1>
        <p className="mt-5 text-base text-parchment sm:text-lg">Learn DSA by Playing It.</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-stone-300">
          Explore worlds, uncover the intuition behind each algorithm by playing it, then prove your
          mastery in code.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {isAuthed ? (
            <Link to="/world" className="w-full sm:w-auto">
              <PixelButton size="lg" fullWidth>
                Enter the world
              </PixelButton>
            </Link>
          ) : (
            <>
              <Link to="/register" className="w-full sm:w-auto">
                <PixelButton size="lg" fullWidth>
                  Start playing
                </PixelButton>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <PixelButton size="lg" variant="secondary" fullWidth>
                  Log in
                </PixelButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </CenteredLayout>
  );
}
