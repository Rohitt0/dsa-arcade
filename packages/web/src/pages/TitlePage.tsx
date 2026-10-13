import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { PixelButton } from '../components/ui';
import { MeadowWallpaper } from '../components/MeadowWallpaper';
import { HomepageAudioControls } from '../components/HomepageAudioControls';

export function TitlePage() {
  const { isAuthed } = useAuth();

  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0a1d18] px-4 py-10">
      <MeadowWallpaper />
      <HomepageAudioControls />
      <div className="relative z-10 w-full max-w-xl text-center">
        <p className="mb-4 font-pixel text-[10px] uppercase tracking-widest text-sky">
          A pixel quest through
        </p>
        <h1 className="text-2xl leading-relaxed text-gold drop-shadow-[3px_3px_0_#15162b] sm:text-4xl">
          DSA Arcade
        </h1>
        <p className="mt-5 text-base text-white sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Learn DSA by Playing It.</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          Choose an adventure, learn its algorithm by playing, then prove your mastery in code.
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
    </main>
  );
}
