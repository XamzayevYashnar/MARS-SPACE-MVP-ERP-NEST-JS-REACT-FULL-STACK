import { useTranslation } from 'react-i18next';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { EmptyState, ErrorState, Pagination, Skeleton, Table, TBody, TD, TH, THead, TR } from '@/shared/ui';

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
}

/** Reusable admin table (TanStack Table v8) handling all four states. */
export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  page,
  totalPages,
  onPageChange,
  emptyTitle,
  emptyAction,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        onRetry={onRetry}
        retryLabel={t('actions.retry')}
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle ?? t('states.emptyTitle')} action={emptyAction} />;
  }

  return (
    <div className="space-y-4">
      <Table>
        <THead>
          {table.getHeaderGroups().map((hg) => (
            <TR key={hg.id}>
              {hg.headers.map((header) => (
                <TH key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TH>
              ))}
            </TR>
          ))}
        </THead>
        <TBody>
          {table.getRowModel().rows.map((row) => (
            <TR key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TD key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>

      {page != null && totalPages != null && totalPages > 1 && onPageChange && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}
