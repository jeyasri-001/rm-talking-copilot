import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips any inline citations the LLM might leak ([1], [2], [source:filename.md]).
 * We show sources in the sidebar/chips only — no inline clutter.
 */
export function polishCitations(md: string): string {
  return md
    .replace(/\[source:[^\]]+\]/gi, "") // strip [source:filename.md]
    .replace(/\[(\d{1,2})\]/g, ""); // strip [1], [2], etc.
}
