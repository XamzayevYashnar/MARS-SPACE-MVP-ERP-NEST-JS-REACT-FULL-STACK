import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}

/** Right-side sheet built on Radix Dialog (focus trap, Esc, restore focus). */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = 'Close',
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-hairline bg-basalt shadow-2xl',
            'focus:outline-none',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-hairline p-5">
            <div>
              <Dialog.Title className="font-display text-h3">{title}</Dialog.Title>
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

          <div className="flex-1 overflow-y-auto p-5">{children}</div>

          {footer && <div className="border-t border-hairline p-5">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
