import { afterEach, describe, expect, it, vi } from "vitest";
import { formatAbsoluteDate, formatDate } from "./utils";

// Month and day differ and are both < 10, so padding and field order are
// observable in every layout.
const date = new Date(2026, 2, 5, 12, 0, 0);

describe("formatAbsoluteDate", () => {
  it("renders the fixed layouts independent of locale", () => {
    for (const locale of ["en", "de", "zh"]) {
      expect(formatAbsoluteDate(date, "uk", locale)).toBe("05/03/2026");
      expect(formatAbsoluteDate(date, "us", locale)).toBe("03/05/2026");
      expect(formatAbsoluteDate(date, "iso", locale)).toBe("2026-03-05");
      expect(formatAbsoluteDate(date, "eu", locale)).toBe("05.03.2026");
    }
  });

  it("uses the locale for auto and long", () => {
    expect(formatAbsoluteDate(date, "auto", "en")).toBe(
      date.toLocaleDateString("en"),
    );
    expect(formatAbsoluteDate(date, "long", "en")).toBe("Mar 5, 2026");
  });
});

describe("formatDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps recent timestamps relative regardless of format", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 5, 15, 0, 0));
    const ts = date.getTime() / 1000;
    expect(formatDate(ts, "iso")).not.toBe("2026-03-05");
  });

  it("applies the chosen format to older timestamps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1));
    const ts = date.getTime() / 1000;
    expect(formatDate(ts, "iso")).toBe("2026-03-05");
    expect(formatDate(ts, "uk")).toBe("05/03/2026");
  });
});
