import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from "dompurify";
import {
  getPreferredLocale,
  usePreferencesStore,
  type DateFormat,
} from "@/store/preferences";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function unixToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// Absolute date in the chosen layout. Fixed layouts are built by hand rather
// than via Intl so they stay identical regardless of the UI language.
export function formatAbsoluteDate(
  date: Date,
  format: DateFormat,
  locale: string = getPreferredLocale(),
): string {
  const d = pad2(date.getDate());
  const m = pad2(date.getMonth() + 1);
  const y = date.getFullYear();

  switch (format) {
    case "uk":
      return `${d}/${m}/${y}`;
    case "us":
      return `${m}/${d}/${y}`;
    case "iso":
      return `${y}-${m}-${d}`;
    case "eu":
      return `${d}.${m}.${y}`;
    case "long":
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    case "auto":
      return date.toLocaleDateString(locale);
  }
}

// Recent timestamps (under a week) stay relative ("3 hours ago") in every
// format; older ones render as an absolute date in the chosen layout.
export function formatDate(
  timestamp: number,
  format: DateFormat = usePreferencesStore.getState().dateFormat,
): string {
  const date = unixToDate(timestamp);
  const locale = getPreferredLocale();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return rtf.format(0, "second");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (hours < 24) return rtf.format(-hours, "hour");
  if (days < 7) return rtf.format(-days, "day");

  return formatAbsoluteDate(date, format, locale);
}

// Subscribes the calling component to the date-format preference so rendered
// dates update as soon as the setting changes.
export function useFormatDate(): (timestamp: number) => string {
  const dateFormat = usePreferencesStore((s) => s.dateFormat);
  return (timestamp: number) => formatDate(timestamp, dateFormat);
}

export function formatRelativeTime(timestamp: number): string {
  const date = unixToDate(timestamp);
  const now = new Date();
  const rtf = new Intl.RelativeTimeFormat(getPreferredLocale(), {
    numeric: "auto",
  });

  const diff = date.getTime() - now.getTime();
  const days = Math.round(diff / 86400000);

  if (Math.abs(days) < 1) {
    const hours = Math.round(diff / 3600000);
    if (Math.abs(hours) < 1) {
      const minutes = Math.round(diff / 60000);
      return rtf.format(minutes, "minute");
    }
    return rtf.format(hours, "hour");
  }

  if (Math.abs(days) < 30) {
    return rtf.format(days, "day");
  }

  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) {
    return rtf.format(months, "month");
  }

  const years = Math.round(months / 12);
  return rtf.format(years, "year");
}

export function extractSummary(html: string, maxLength = 120): string {
  // Strip all HTML tags to get plain text
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  // Normalize whitespace
  const text = clean.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  // Truncate and add ellipsis
  return text.slice(0, maxLength).trimEnd() + "…";
}
