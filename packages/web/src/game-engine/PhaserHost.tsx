import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { GameControl, GameDefinition, GameEvent, GameSceneLoader } from './types';

interface PhaserHostProps {
  game: GameDefinition;
  loadScenes: GameSceneLoader;
  renderControls?: (controls: GameControl[], sendAction: (action: string) => void) => ReactNode;
  className?: string;
  canvasClassName?: string;
  statusClassName?: string;
  onEvent?: (event: GameEvent) => void;
  progressScope?: string;
  initialStageId?: string;
  autoAdvance?: boolean;
}

function describeEvent(event: GameEvent): string | null {
  switch (event.type) {
    case 'game:ready':
      return 'Game ready. Tap the canvas or press Space to play.';
    case 'stage:started':
      return `Stage ${event.payload.stageNumber}: ${event.payload.stage.title}`;
    case 'checkpoint:reached':
      return null;
    case 'game:tutorial':
    case 'game:binary-tutorial':
      return null;
    case 'stage:completed':
      return 'Stage complete. Loading the next stage…';
    case 'stage:accepted':
    case 'game:mission-intro':
    case 'game:mission-success':
    case 'game:transition-ready':
    case 'game:departure-ready':
      return null;
    case 'game:completed':
      return 'Preview complete. You can play it again by revisiting this page.';
    case 'game:error':
      return `Game error: ${event.payload.message}`;
    case 'game:input':
      return null;
    case 'game:controls':
      return null;
    case 'game:lesson':
      return event.payload.message;
  }
}

export function PhaserHost({
  game,
  loadScenes,
  renderControls,
  className,
  canvasClassName,
  statusClassName,
  onEvent,
  progressScope,
  initialStageId,
  autoAdvance = true,
}: PhaserHostProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Loading game…');
  const [controls, setControls] = useState<GameControl[]>([]);
  const sendActionRef = useRef<(action: string) => void>(() => {});

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    setStatus('Loading game…');
    setControls([]);
    sendActionRef.current = () => {};
    let disposed = false;
    let unsubscribe = () => {};
    let destroyManager = () => {};

    void Promise.all([import('./GameBridge'), import('./GameManager'), loadScenes()])
      .then(([bridgeModule, managerModule, scenes]) => {
        if (disposed) return;

        const bridge = new bridgeModule.GameBridge();
        unsubscribe = bridge.onAny((event) => {
          onEvent?.(event);
          const message = describeEvent(event);
          if (message) setStatus(message);
          if (event.type === 'game:controls') setControls(event.payload.controls);
        });
        sendActionRef.current = (action) =>
          bridge.emit('game:input', { source: 'control', action });

        const manager = new managerModule.GameManager(parent, game, scenes, bridge, progressScope, initialStageId, autoAdvance);
        destroyManager = () => manager.destroy();
      })
      .catch((error: unknown) => {
        if (!disposed) {
          setStatus(error instanceof Error ? error.message : 'The game could not be started.');
        }
      });

    return () => {
      disposed = true;
      unsubscribe();
      destroyManager();
    };
  }, [game, loadScenes, onEvent, progressScope, initialStageId, autoAdvance]);

  return (
    <div className={className}>
      <div
        ref={parentRef}
        role="img"
        tabIndex={0}
        aria-label={`${game.title} game canvas. Tap the canvas or press Space to advance.`}
        className={
          canvasClassName ??
          'h-[55dvh] min-h-64 max-h-[36rem] w-full touch-manipulation overflow-hidden border-2 border-ink bg-night-800'
        }
      />
      {renderControls?.(controls, (action) => sendActionRef.current(action))}
      <p role="status" aria-live="polite" className={statusClassName ?? 'mt-3 min-h-11 text-sm text-stone-300'}>
        {status}
      </p>
    </div>
  );
}
