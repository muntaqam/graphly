import { describe, expect, it } from "vitest";
import { createScale, fitPlot } from "./scale";

const plot = { left: 100, top: 50, width: 400, height: 200 };

describe("createScale", () => {
  it("maps window corners to plot corners (y is flipped)", () => {
    const s = createScale(plot, -10, 10, -5, 5);
    expect(s.x(-10)).toBe(100);
    expect(s.x(10)).toBe(500);
    expect(s.y(5)).toBe(50); // top edge
    expect(s.y(-5)).toBe(250); // bottom edge
    expect(s.x(0)).toBe(300);
    expect(s.y(0)).toBe(150);
  });

  it("handles asymmetric windows with the origin off-center", () => {
    const s = createScale(plot, -2, 8, -1, 9);
    expect(s.x(0)).toBeCloseTo(100 + 2 * 40);
    expect(s.y(0)).toBeCloseTo(50 + 9 * 20);
  });

  it("works when the origin is outside the window", () => {
    const s = createScale(plot, 10, 20, 100, 200);
    expect(s.x(10)).toBe(100);
    expect(s.x(0)).toBeLessThan(plot.left); // origin is off to the left
    expect(s.y(0)).toBeGreaterThan(plot.top + plot.height); // and below
  });

  it("scales x and y independently", () => {
    const s = createScale(plot, 0, 10, 0, 100);
    expect(s.pxPerUnitX).toBe(40);
    expect(s.pxPerUnitY).toBe(2);
  });

  it("inverts exactly", () => {
    const s = createScale(plot, -3, 7, -4, 6);
    for (const v of [-3, 0, 2.5, 7]) expect(s.invertX(s.x(v))).toBeCloseTo(v);
    for (const v of [-4, 0, 1.25, 6]) expect(s.invertY(s.y(v))).toBeCloseTo(v);
  });
});

describe("fitPlot", () => {
  const avail = { left: 0, top: 0, width: 400, height: 200 };

  it("fill uses all available space", () => {
    expect(fitPlot(avail, "fill", 20, 20, 1, 1)).toEqual(avail);
  });

  it("square cells shrink the long side and center it", () => {
    const r = fitPlot(avail, "square", 20, 20, 1, 1);
    expect(r.width).toBe(200);
    expect(r.height).toBe(200);
    expect(r.left).toBe(100);
  });

  it("square cells stay square when grid steps differ", () => {
    // 10 cells across (step 1), 10 cells up (step 10): cells must be square.
    const r = fitPlot(avail, "square", 10, 100, 1, 10);
    const cellW = r.width / 10;
    const cellH = r.height / 10;
    expect(cellW).toBeCloseTo(cellH);
  });
});
