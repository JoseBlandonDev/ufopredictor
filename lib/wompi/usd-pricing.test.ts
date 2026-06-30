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
    expect(parseUsdInputToCents("10")).toBe(1000);
    expect(parseUsdInputToCents("10.5")).toBe(1050);
    expect(parseUsdInputToCents("10.50")).toBe(1050);
    expect(parseUsdInputToCents("10,50")).toBe(1050);
  });

  it("rejects invalid USD inputs", () => {
    expect(parseUsdInputToCents("")).toBeNull();
    expect(parseUsdInputToCents("abc")).toBeNull();
    expect(parseUsdInputToCents("10.999")).toBeNull();
    expect(parseUsdInputToCents("0")).toBeNull();
  });

  it("converts USD cents into whole COP pesos", () => {
    expect(convertUsdCentsToCop(1000, 3500)).toBe(35000);
  });

  it("uses deterministic nearest-peso rounding with halves rounding up", () => {
    expect(convertUsdCentsToCop(1, 50)).toBe(1);
    expect(convertUsdCentsToCop(1, 49)).toBe(0);
    expect(convertUsdCentsToCop(999, 3500)).toBe(34965);
  });

  it("rejects invalid USD/COP rates", () => {
    expect(() => convertUsdCentsToCop(1000, 0)).toThrow(/USD\/COP rate/i);
    expect(() => convertUsdCentsToCop(1000, Number.NaN)).toThrow(/USD\/COP rate/i);
  });

  it("formats canonical public USD display", () => {
    expect(formatUsdCents(1000)).toBe("US$10");
    expect(formatUsdCents(1050)).toBe("US$10.50");
  });

  it("formats COP checkout display and Wompi cents", () => {
    expect(formatCopDisplay(35000)).toBe("COP 35.000");
    expect(amountCopToWompiAmountInCents(35000)).toBe(3500000);
  });

  it("formats admin input defaults from cents", () => {
    expect(formatUsdInputValue(1000)).toBe("10.00");
    expect(formatUsdInputValue(null)).toBe("");
  });
});
