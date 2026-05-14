import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names. */
export const cn = (...inputs: Array<string | undefined | null | boolean>) =>
  twMerge(clsx(inputs));
