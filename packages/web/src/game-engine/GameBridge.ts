import type { GameEvent, GameEventListener, GameEventMap } from './types';

type TypedListener<T> = (payload: T) => void;

/** Typed, per-game event channel between Phaser scenes and React. */
export class GameBridge {
  private listeners = new Map<keyof GameEventMap, Set<TypedListener<unknown>>>();
  private anyListeners = new Set<GameEventListener>();

  on<K extends keyof GameEventMap>(type: K, listener: TypedListener<GameEventMap[K]>) {
    let bucket = this.listeners.get(type);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(type, bucket);
    }
    bucket.add(listener as TypedListener<unknown>);
    return () => bucket?.delete(listener as TypedListener<unknown>);
  }

  onAny(listener: GameEventListener) {
    this.anyListeners.add(listener);
    return () => this.anyListeners.delete(listener);
  }

  emit<K extends keyof GameEventMap>(type: K, payload: GameEventMap[K]) {
    const event = { type, payload } as GameEvent;
    this.anyListeners.forEach((listener) => listener(event));
    this.listeners.get(type)?.forEach((listener) => listener(payload));
  }

  clear() {
    this.listeners.clear();
    this.anyListeners.clear();
  }
}
