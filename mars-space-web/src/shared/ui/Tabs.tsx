import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/shared/lib/cn';

export const Tabs = RadixTabs.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn('inline-flex items-center gap-1 border-b border-hairline', className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        '-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-dust transition-colors',
        'hover:text-ice focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol focus-visible:ring-offset-2 focus-visible:ring-offset-void',
        'data-[state=active]:border-oxide data-[state=active]:text-ice',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      className={cn('mt-4 focus-visible:outline-none', className)}
      {...props}
    />
  );
}
