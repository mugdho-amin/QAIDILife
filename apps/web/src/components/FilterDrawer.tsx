"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Filter } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

/** Filter state shape for PLP. */
export interface ProductFilters {
  /** Selected size. */
  size?: string;
  /** Selected color. */
  color?: string;
  /** Min price. */
  priceMin?: number;
  /** Max price. */
  priceMax?: number;
}

/** Props for the filter drawer. */
export interface FilterDrawerProps {
  /** Current filters. */
  value: ProductFilters;
  /** Callback when filters are applied. */
  onApply: (filters: ProductFilters) => void;
}

/** Mobile-first filter drawer with full-screen overlay. */
export function FilterDrawer({ value, onApply }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(value.size ?? "");
  const [color, setColor] = useState(value.color ?? "");
  const [priceMin, setPriceMin] = useState(String(value.priceMin ?? ""));
  const [priceMax, setPriceMax] = useState(String(value.priceMax ?? ""));

  /** Toggle drawer state. */
  const handleOpenChange = (state: boolean) => {
    setOpen(state);
  };

  /** Update size selection. */
  const handleSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSize(event.target.value);
  };

  /** Update color selection. */
  const handleColorChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setColor(event.target.value);
  };

  /** Update minimum price. */
  const handlePriceMinChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPriceMin(event.target.value);
  };

  /** Update maximum price. */
  const handlePriceMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPriceMax(event.target.value);
  };

  /** Apply filters and close drawer. */
  const applyFilters = () => {
    onApply({
      size: size || undefined,
      color: color || undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
    });
    setOpen(false);
  };

  /** Clear filters. */
  const clearFilters = () => {
    setSize("");
    setColor("");
    setPriceMin("");
    setPriceMax("");
    onApply({});
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button className="fixed bottom-20 right-5 z-40 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-xs uppercase tracking-[0.2em] text-canvas sm:hidden">
          <Filter className="h-4 w-4" /> Filter & Sort
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/40" />
        <Dialog.Content className="fixed inset-0 bg-canvas px-6 py-8">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold uppercase tracking-[0.3em]">
              Filters
            </Dialog.Title>
            <Dialog.Close className="text-xs uppercase tracking-[0.2em] text-ink/60">
              Close
            </Dialog.Close>
          </div>
          <div className="mt-10 space-y-8">
            <FilterField label="Size">
              <select
                value={size}
                onChange={handleSizeChange}
                className="h-11 w-full rounded-full border border-mist px-4"
              >
                <option value="">All</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </FilterField>
            <FilterField label="Color">
              <select
                value={color}
                onChange={handleColorChange}
                className="h-11 w-full rounded-full border border-mist px-4"
              >
                <option value="">All</option>
                <option value="Black">Black</option>
                <option value="Ivory">Ivory</option>
                <option value="Graphite">Graphite</option>
              </select>
            </FilterField>
            <FilterField label="Price Range">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Min"
                  value={priceMin}
                  onChange={handlePriceMinChange}
                  className="h-11 w-full rounded-full border border-mist px-4"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Max"
                  value={priceMax}
                  onChange={handlePriceMaxChange}
                  className="h-11 w-full rounded-full border border-mist px-4"
                />
              </div>
            </FilterField>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4">
            <button
              onClick={clearFilters}
              className="h-12 rounded-full border border-ink text-xs uppercase tracking-[0.2em]"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className={cn(
                "h-12 rounded-full bg-ink text-xs uppercase tracking-[0.2em] text-canvas",
              )}
            >
              Apply
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Render a labeled filter field. */
function FilterField({ label, children }: { label: string; children: JSX.Element }) {
  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-[0.3em] text-ink/60">
        {label}
      </div>
      {children}
    </div>
  );
}
