import { describe, expect, it } from "vitest";
import {
  decimalsOf,
  formatTick,
  isMultipleOf,
  MINUS,
  multiplesInRange,
  roundTo,
} from "./numbers";

describe("decimalsOf", () => {
  it.each([
    [1, 0],
    [10, 0],
    [0.5, 1],
    [0.25, 2],
    [0.1 + 0.2, 1], // 0.30000000000000004 is treated as 0.3
    [1e-7, 7],
  ])("decimalsOf(%s) = %s", (n, d) => expect(decimalsOf(n)).toBe(d));
});

describe("multiplesInRange (tick generation)", () => {
  it("covers a symmetric range including both ends", () => {
    expect(multiplesInRange(-10, 10, 2)).toEqual([-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10]);
  });

  it("produces clean decimals with no float artifacts", () => {
    const ticks = multiplesInRange(0, 1, 0.1);
    expect(ticks).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
    expect(ticks.map((t) => formatTick(t, 1))).not.toContain("0.30000000000000004");
  });

  it("only returns multiples of the step for an unaligned window", () => {
    expect(multiplesInRange(-2.5, 3.7, 1)).toEqual([-2, -1, 0, 1, 2, 3]);
  });

  it("handles ranges entirely negative or entirely positive", () => {
    expect(multiplesInRange(-30, -10, 5)).toEqual([-30, -25, -20, -15, -10]);
    expect(multiplesInRange(100, 120, 10)).toEqual([100, 110, 120]);
  });

  it("never returns -0", () => {
    const zero = multiplesInRange(-1, 1, 1)[1];
    expect(Object.is(zero, -0)).toBe(false);
  });

  it("returns nothing for invalid input", () => {
    expect(multiplesInRange(0, 10, 0)).toEqual([]);
    expect(multiplesInRange(10, 0, 1)).toEqual([]);
  });
});

describe("formatTick", () => {
  it("does not strip zeros from integers", () => {
    expect(formatTick(10, 0)).toBe("10");
    expect(formatTick(100, 0)).toBe("100");
  });
  it("uses a real minus sign", () => {
    expect(formatTick(-4, 0)).toBe(`${MINUS}4`);
  });
  it("drops trailing zeros after the point", () => {
    expect(formatTick(1.5, 2)).toBe("1.5");
    expect(formatTick(2, 1)).toBe("2");
  });
  it("rounds away noise", () => {
    expect(formatTick(0.1 * 3, 1)).toBe("0.3");
    expect(formatTick(-0.0000000001, 2)).toBe("0");
  });
});

describe("isMultipleOf / roundTo", () => {
  it("tolerates floating-point noise", () => {
    expect(isMultipleOf(0.3, 0.1)).toBe(true);
    expect(isMultipleOf(2, 0.5)).toBe(true);
    expect(isMultipleOf(1.5, 1)).toBe(false);
  });
  it("roundTo normalises -0", () => {
    expect(Object.is(roundTo(-0.0001, 2), 0)).toBe(true);
  });
});
