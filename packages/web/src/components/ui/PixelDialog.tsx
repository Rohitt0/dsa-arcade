import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface PixelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Responsive dialog: a bottom sheet on phones (fits viewport, scrolls internally,
 * respects the safe-area inset) and a centered modal from `sm:` up.
 */
export function PixelDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: PixelDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px]" />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex max-h-[88vh] flex-col overflow-hidden border-2 border-ink bg-night-800 shadow-pixel-lg',
            // mobile: bottom sheet, full width
            'inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)]',
            // >= sm: centered modal
            'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b-2 border-ink bg-night-700 px-4 py-3">
            <div>
              <Dialog.Title className="font-pixel text-xs uppercase text-gold sm:text-sm">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-xs text-stone-300">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="min-h-[44px] min-w-[44px] border-2 border-ink bg-night-600 font-pixel text-parchment"
            >
              ✕
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-4 py-4">{children}</div>
          {footer && <div className="border-t-2 border-ink bg-night-700 px-4 py-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
