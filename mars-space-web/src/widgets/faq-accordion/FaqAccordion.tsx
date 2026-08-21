import { ChevronDown } from 'lucide-react';

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqAccordionProps {
  items: FaqItem[];
}

/** Native <details>-based accordion — accessible and SEO-friendly (spec §6.1). */
export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="divide-y divide-hairline rounded-md border border-hairline">
      {items.map((item, i) => (
        <details key={i} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-ice marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sol">
            <span className="font-medium">{item.q}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-dust transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-4 text-sm text-dust">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
