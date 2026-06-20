import { describe, expect, it } from "vitest";
import {
  amountCopToWompiAmountInCents,
  convertUsdCentsToCop,
  formatCopDisplay,
  formatUsdCents,
  formatUsdInputValue,
  parseUsdInputToCents,
} from "./usd-pricing";

describe("Wompi canonical USD pricing helpers", () => {
  it("parses USD inputs into integer cents", () => {
    expect(parseUsdInputToCents("20")).toBe(2000);
    expect(parseUsdInputToCents("20.5")).toBe(2050);
    expect(parseUsdInputToCents("20.50")).toBe(2050);
    expect(parseUsdInputToCents("20,50")).toBe(2050);
  });

  it("rejects invalid USD inputs", () => {
    expect(parseUsdInputToCents("")).toBeNull();
    expect(parseUsdInputToCents("abc")).toBeNull();
    expect(parseUsdInputToCents("20.999")).toBeNull();
    expect(parseUsdInputToCents("0")).toBeNull();
  });

  it("converts USD cents into whole COP pesos", () => {
    expect(convertUsdCentsToCop(2000, 3435)).toBe(68700);
  });

  it("uses deterministic nearest-peso rounding with halves rounding up", () => {
    expect(convertUsdCentsToCop(1, 50)).toBe(1);
    expect(convertUsdCentsToCop(1, 49)).toBe(0);
    expect(convertUsdCentsToCop(1999, 3435)).toBe(68666);
  });

  it("rejects invalid USD/COP rates", () => {
    expect(() => convertUsdCentsToCop(2000, 0)).toThrow(/USD\/COP rate/i);
    expect(() => convertUsdCentsToCop(2000, Number.NaN)).toThrow(/USD\/COP rate/i);
  });

  it("formats canonical public USD display", () => {
    expect(formatUsdCents(2000)).toBe("US$20");
    expect(formatUsdCents(2050)).toBe("US$20.50");
  });

  it("formats COP checkout display and Wompi cents", () => {
    expect(formatCopDisplay(68700)).toBe("COP 68.700");
    expect(amountCopToWompiAmountInCents(68700)).toBe(6870000);
  });

  it("formats admin input defaults from cents", () => {
    expect(formatUsdInputValue(2000)).toBe("20.00");
    expect(formatUsdInputValue(null)).toBe("");
  });
});
