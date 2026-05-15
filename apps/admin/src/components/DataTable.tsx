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
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
      <div className="border-b border-border bg-muted/50 px-6 py-4">
        <div className="grid grid-cols-12 gap-4">
          {columns.map((column, index) => (
            <div
              key={`${column.label}-${index}`}
              className={`${column.width ?? "col-span-3"} flex items-center gap-2`}
            >
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">
                {column.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          rows.map((row, i) => (
            <div
              key={i}
              className="transition-colors hover:bg-muted/30 animate-fade-in"
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
