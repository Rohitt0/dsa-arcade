import { useEffect, useRef, useState } from 'react';
import { PixelButton } from './ui';

const musicSrc = `${import.meta.env.BASE_URL}audio/homepage-music.mp3`;
const muteStorageKey = 'dsa-arcade-homepage-music-muted';

function describeMediaError(code: number | undefined) {
  switch (code) {
    case 1: return 'Playback was interrupted. Press Play once and wait.';
    case 2: return 'Could not download homepage-music.mp3.';
    case 3: return 'Browser could not decode homepage-music.mp3.';
    case 4: return 'homepage-music.mp3 is missing or unsupported.';
    default: return 'Music could not be played. Press Play to retry.';
  }
}

function readMutePreference() {
  try { return window.localStorage.getItem(muteStorageKey) === 'true'; }
  catch { return false; }
}

function AudioGlyph({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-5 w-5" shapeRendering="crispEdges">
      <path fill="currentColor" d="M1 6h3l4-4v12l-4-4H1z" />
      {muted ? (
        <path fill="currentColor" d="M10 5l1-1 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2z" />
      ) : (
        <path fill="currentColor" d="M10 5h1v1h1v1h1v2h-1v1h-1v1h-1v-2h1V7h-1zM12 2h1v1h1v1h1v8h-1v1h-1v1h-1v-2h1v-1h1V5h-1V4h-1z" />
      )}
    </svg>
  );
}

function PlaybackGlyph({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-5 w-5" shapeRendering="crispEdges">
      {playing
        ? <path fill="currentColor" d="M3 2h4v12H3zM9 2h4v12H9z" />
        : <path fill="currentColor" d="M3 1h2v2h2v2h2v2h2v2H9v2H7v2H5v2H3z" />}
    </svg>
  );
}

export function HomepageAudioControls() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playRequestRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [muted, setMuted] = useState(readMutePreference);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 1;
    audio.muted = muted;
    try { window.localStorage.setItem(muteStorageKey, String(muted)); }
    catch { /* Mute persistence is optional when storage is unavailable. */ }
  }, [muted]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (!audio) return;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playRequestRef.current) return;
    if (audio.paused) {
      playRequestRef.current = true;
      setStarting(true);
      setAudioError(null);
      audio.volume = 1;
      audio.muted = false;
      setMuted(false);
      try {
        await audio.play();
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setAudioError(error instanceof Error ? error.message : 'Browser refused to play the music.');
        }
      } finally {
        playRequestRef.current = false;
        setStarting(false);
      }
    } else {
      audio.pause();
    }
  };

  const toggleMuted = () => {
    const nextMuted = !muted;
    if (audioRef.current) audioRef.current.muted = nextMuted;
    setMuted(nextMuted);
  };

  return (
    <div className="absolute right-3 top-3 z-20 flex items-center gap-2 sm:right-5 sm:top-5">
      <audio
        ref={audioRef}
        id="homepage-music"
        src={musicSrc}
        loop
        preload="auto"
        onPlaying={() => { playRequestRef.current = false; setStarting(false); setPlaying(true); }}
        onPause={() => { playRequestRef.current = false; setStarting(false); setPlaying(false); }}
        onError={(event) => {
          setPlaying(false);
          setAudioError(describeMediaError(event.currentTarget.error?.code));
        }}
      />
      <PixelButton
        type="button"
        size="sm"
        className="h-11 w-11 px-0 text-[#101820] focus-visible:ring-offset-[#101820]"
        aria-label={starting ? 'Starting homepage music' : playing ? 'Pause homepage music' : 'Play homepage music'}
        aria-pressed={playing}
        aria-controls="homepage-music"
        disabled={starting}
        onClick={() => void togglePlayback()}
      >
        <PlaybackGlyph playing={playing} />
      </PixelButton>
      <PixelButton
        type="button"
        size="sm"
        variant="secondary"
        className="h-11 w-11 px-0 border-[#d8c992] bg-[#162521]/95 text-[#f0dca0] hover:bg-[#253c31] focus-visible:ring-offset-[#101820]"
        aria-label={muted ? 'Unmute homepage music' : 'Mute homepage music'}
        aria-pressed={muted}
        aria-controls="homepage-music"
        onClick={toggleMuted}
      >
        <AudioGlyph muted={muted} />
      </PixelButton>
      <span className="sr-only" role="status" aria-live="polite">
        {audioError ?? (playing ? 'Homepage music playing.' : 'Homepage music paused.')}
      </span>
      {audioError && <span role="status" className="absolute right-0 top-12 w-56 border-2 border-[#d8c992] bg-[#101820]/95 px-2 py-1 font-mono text-[10px] leading-4 text-[#f0dca0]">{audioError}</span>}
    </div>
  );
}
