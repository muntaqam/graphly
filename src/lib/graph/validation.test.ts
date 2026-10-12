import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./defaults";
import { formFromConfig, parseGraphForm, parseNumber } from "./validation";

const form = () => formFromConfig(DEFAULT_CONFIG);

describe("parseNumber", () => {
  it.each([
    ["5", 5],
    ["-2.5", -2.5],
    ["−3", -3],
    [".5", 0.5],
    [" 10 ", 10],
  ])("parses %j", (s, n) => expect(parseNumber(s)).toBe(n));

  it.each(["", "-", "abc", "1..2", "0x10"])("rejects %j", (s) =>
    expect(parseNumber(s)).toBeNull(),
  );
});

describe("parseGraphForm", () => {
  it("round-trips the default config", () => {
    expect(parseGraphForm(form()).config).toEqual(DEFAULT_CONFIG);
  });

  it("flags max ≤ min", () => {
    const r = parseGraphForm({ ...form(), xMax: "-10" });
    expect(r.config).toBeNull();
    expect(r.errors.xMax).toMatch(/greater/);
  });

  it("flags zero and negative steps", () => {
    expect(parseGraphForm({ ...form(), xGridStep: "0" }).errors.xGridStep).toBeTruthy();
    expect(parseGraphForm({ ...form(), yLabelStep: "-1" }).errors.yLabelStep).toBeTruthy();
  });

  it("flags too many grid squares", () => {
    const r = parseGraphForm({ ...form(), xMin: "-1000", xMax: "1000", xGridStep: "1" });
    expect(r.errors.xGridStep).toMatch(/Too many/);
  });

  it("flags out-of-range physical sizes", () => {
    expect(parseGraphForm({ ...form(), widthIn: "0.2" }).errors.widthIn).toBeTruthy();
    expect(parseGraphForm({ ...form(), heightIn: "40" }).errors.heightIn).toBeTruthy();
  });

  it("treats partial input as an error rather than crashing", () => {
    const r = parseGraphForm({ ...form(), yMin: "-" });
    expect(r.config).toBeNull();
    expect(r.errors.yMin).toBe("Enter a number");
  });
});
