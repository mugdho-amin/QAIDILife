import type { ReactNode } from "react";

export interface DataColumn {
  label: string;
  width?: string;
  sortable?: boolean;
}

export interface DataTableProps {
  columns: DataColumn[];
  rows: ReactNode[];
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-mist bg-panel shadow-sm">
      <div className="border-b border-mist bg-accent-soft/50 px-6 py-4">
        <div className="grid grid-cols-12 gap-4">
          {columns.map((column, index) => (
            <div
              key={`${column.label}-${index}`}
              className={`${column.width ?? "col-span-3"} flex items-center gap-2`}
            >
              <span className="text-xs uppercase tracking-[0.3em] text-text-muted font-medium">
                {column.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-mist/50">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-text-muted">
            No data available
          </div>
        ) : (
          rows.map((row, i) => (
            <div
              key={i}
              className="transition-colors hover:bg-accent-soft/30 animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {row}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
