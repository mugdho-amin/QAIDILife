import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ClassValue } from "clsx";

/** Merge class names with Tailwind conflict resolution. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
