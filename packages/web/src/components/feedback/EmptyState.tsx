import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="mx-auto flex min-h-[30vh] max-w-md flex-col items-center justify-center gap-3 text-center">
      {icon && <div className="text-3xl">{icon}</div>}
      <h2 className="font-pixel text-sm text-parchment">{title}</h2>
      {message && <p className="text-sm text-stone-300">{message}</p>}
      {action}
    </div>
  );
}
