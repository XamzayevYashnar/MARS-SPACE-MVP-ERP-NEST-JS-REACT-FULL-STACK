import { forwardRef, type ReactNode } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    { value, defaultValue, onValueChange, options, placeholder, invalid, disabled, id, className, ...aria },
    ref,
  ) => {
    return (
      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          ref={ref}
          id={id}
          aria-label={aria['aria-label']}
          aria-invalid={invalid || undefined}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-sm border bg-basalt-raised px-3 text-sm text-ice',
            'transition-colors duration-120',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol focus-visible:ring-offset-2 focus-visible:ring-offset-void',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[placeholder]:text-dust/70',
            invalid ? 'border-alert' : 'border-hairline hover:border-dust/40',
            className,
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-dust" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className={cn(
              'z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-hairline bg-basalt shadow-xl',
              'data-[state=open]:animate-fade-in',
            )}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </SelectItem>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    );
  },
);
Select.displayName = 'Select';

function SelectItem({
  value,
  disabled,
  children,
}: {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <RadixSelect.Item
      value={value}
      disabled={disabled}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm text-ice outline-none',
        'data-[highlighted]:bg-basalt-raised data-[highlighted]:text-ice',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      )}
    >
      <RadixSelect.ItemIndicator className="absolute left-2 inline-flex items-center">
        <Check className="h-4 w-4 text-oxide" />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}
