import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Optional supporting text under the title. */
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Hide the visible title (still exposed to assistive tech). */
  hideTitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  closeLabel?: string;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

/**
 * Radix Dialog wrapper: focus trap, restore-on-close, Esc + overlay dismiss,
 * accessible title/description wiring (spec §10 accessibility).
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  hideTitle,
  size = 'md',
  closeLabel = 'Close',
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col',
            'rounded-md border border-hairline bg-basalt p-6 shadow-2xl',
            // fade-in only (no transform) so it never clobbers the centering translate.
            'focus:outline-none data-[state=open]:animate-fade-in',
            sizes[size],
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className={cn('font-display text-h3', hideTitle && 'sr-only')}>
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-dust">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label={closeLabel}
              className="rounded-sm p-1 text-dust transition-colors hover:bg-basalt-raised hover:text-ice focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="-mx-1 flex-1 overflow-y-auto px-1">{children}</div>

          {footer && <div className="mt-6 flex shrink-0 justify-end gap-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { Dialog };
