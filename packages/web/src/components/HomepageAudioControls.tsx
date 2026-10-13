import { useCallback, useEffect, useRef, useState } from 'react';
import { PixelButton } from './ui';

const musicSrc = `${import.meta.env.BASE_URL}audio/homepage-music.mp3`;
const muteStorageKey = 'dsa-arcade-homepage-music-muted';

/** Background music should sit under the UI, not on top of it. 0 = silent, 1 = full volume. */
const TARGET_VOLUME = 0.6;
const FADE_IN_MS = 1800;

/**
 * Browsers only allow sound after the person has interacted with the page. These are the
 * events that count as a real "user activation" in Chrome, Safari and Firefox.
 */
const GESTURE_EVENTS = ['pointerup', 'keydown', 'touchend'] as const;

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
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeFrameRef = useRef<number | null>(null);
  /** Number of play() attempts in flight (React StrictMode can start two in development). */
  const pendingRef = useRef(0);
  /** True once the person has pressed Pause themselves: we never auto-restart after that. */
  const userPausedRef = useRef(false);
  /** True when we paused because the tab was hidden, so we know to resume on return. */
  const pausedByTabRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [muted, setMuted] = useState(readMutePreference);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Keep the element's mute flag in sync with state, and remember the choice.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
    try { window.localStorage.setItem(muteStorageKey, String(muted)); }
    catch { /* Mute persistence is optional when storage is unavailable. */ }
  }, [muted]);

  const cancelFade = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
  }, []);

  const fadeIn = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelFade();
    const startedAt = performance.now();
    const step = (now: number) => {
      // rAF timestamps can land a hair before performance.now(), so clamp to [0, 1].
      const progress = Math.max(0, Math.min(1, (now - startedAt) / FADE_IN_MS));
      audio.volume = TARGET_VOLUME * progress;
      fadeFrameRef.current = progress < 1 ? requestAnimationFrame(step) : null;
    };
    fadeFrameRef.current = requestAnimationFrame(step);
  }, [cancelFade]);

  /**
   * Try to start the music. Resolves true when it is playing, false when the browser
   * blocked it (no user gesture yet) or something failed.
   */
  const startPlayback = useCallback(async (): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;
    if (!audio.paused) return true;
    pendingRef.current += 1;
    setStarting(true);
    audio.volume = 0; // fade in from silence so it never blasts at the first note
    try {
      await audio.play();
      setAudioError(null);
      fadeIn();
      return true;
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      // AbortError = this attempt was superseded by a newer one (or paused); leave the volume alone.
      if (name !== 'AbortError') {
        audio.volume = TARGET_VOLUME;
        // NotAllowedError = autoplay blocked (expected before the first click), so stay quiet.
        if (name !== 'NotAllowedError') {
          setAudioError(error instanceof Error ? error.message : 'Browser refused to play the music.');
        }
      }
      return false;
    } finally {
      pendingRef.current -= 1;
      if (pendingRef.current === 0) setStarting(false);
    }
  }, [fadeIn]);

  // Auto-start on load. If the browser blocks it, start on the first click / tap / key press.
  useEffect(() => {
    let disposed = false;

    const disarm = () => GESTURE_EVENTS.forEach((type) => window.removeEventListener(type, onGesture, true));
    function onGesture(event: Event) {
      const audio = audioRef.current;
      if (!audio || userPausedRef.current || !audio.paused) { disarm(); return; }
      // The play / mute buttons handle their own clicks; don't fight them.
      if (rootRef.current?.contains(event.target as Node)) return;
      void startPlayback().then((ok) => { if (ok) disarm(); });
    }

    void startPlayback().then((ok) => {
      if (ok || disposed || userPausedRef.current) return;
      GESTURE_EVENTS.forEach((type) => window.addEventListener(type, onGesture, true));
    });

    return () => {
      disposed = true;
      disarm();
    };
  }, [startPlayback]);

  // Be polite: stop the music while the tab is in the background, resume when it returns.
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        if (!audio.paused) { pausedByTabRef.current = true; audio.pause(); }
      } else if (pausedByTabRef.current) {
        pausedByTabRef.current = false;
        if (!userPausedRef.current) void audio.play().catch(() => { /* needs a click; the Play button is right there */ });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Leaving the page stops the music. NOTE: do not clear `src` here. React StrictMode runs this
  // cleanup once on startup in development, and the <audio> element is reused afterwards, so
  // removing the source would leave it permanently silent.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      cancelFade();
      if (audio) audio.pause();
    };
  }, [cancelFade]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      userPausedRef.current = false;
      pausedByTabRef.current = false;
      setAudioError(null);
      audio.muted = false; // pressing Play should always produce sound
      setMuted(false);
      await startPlayback();
    } else {
      userPausedRef.current = true;
      cancelFade();
      audio.pause();
    }
  };

  const toggleMuted = () => {
    const nextMuted = !muted;
    if (audioRef.current) audioRef.current.muted = nextMuted;
    setMuted(nextMuted);
  };

  return (
    <div ref={rootRef} className="absolute right-3 top-3 z-20 flex items-center gap-2 sm:right-5 sm:top-5">
      <audio
        ref={audioRef}
        id="homepage-music"
        src={musicSrc}
        loop
        preload="auto"
        onPlaying={() => { setPlaying(true); }}
        onPause={() => { setPlaying(false); }}
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
