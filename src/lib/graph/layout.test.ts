import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./defaults";
import { buildGraphModel } from "./layout";
import { MINUS } from "./numbers";
import type { GraphConfig } from "./types";

const cfg = (patch: (c: GraphConfig) => void): GraphConfig => {
  const c = structuredClone(DEFAULT_CONFIG);
  patch(c);
  return c;
};

describe("buildGraphModel: physical size", () => {
  it("image size is exactly inches × 96", () => {
    const m = buildGraphModel(cfg((c) => (c.size = { widthIn: 5, heightIn: 3 })));
    expect(m.width).toBe(480);
    expect(m.height).toBe(288);
  });

  it("everything drawn stays inside the image", () => {
    const m = buildGraphModel(DEFAULT_CONFIG);
    const pts = [
      ...m.arrowheads.flatMap((a) => a.points),
      ...[...m.xLabels, ...m.yLabels, ...m.axisTitles].map((l) => [l.x, l.y] as [number, number]),
    ];
    for (const [x, y] of pts) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(m.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(m.height);
    }
  });
});

describe("buildGraphModel: axes", () => {
  it("places axes through the origin for a symmetric window", () => {
    const m = buildGraphModel(DEFAULT_CONFIG);
    const cx = m.plot.left + m.plot.width / 2;
    const cy = m.plot.top + m.plot.height / 2;
    expect(m.yAxis!.x1).toBeCloseTo(cx);
    expect(m.xAxis!.y1).toBeCloseTo(cy);
  });

  it("places the y-axis off-center for an asymmetric window", () => {
    const m = buildGraphModel(cfg((c) => Object.assign(c.x, { min: -2, max: 8 })));
    expect(m.yAxis!.x1).toBeCloseTo(m.plot.left + 2 * m.pxPerUnitX);
  });

  it("omits an axis whose zero is outside the window and warns", () => {
    const m = buildGraphModel(cfg((c) => Object.assign(c.y, { min: 5, max: 25 })));
    expect(m.xAxis).toBeNull();
    expect(m.yAxis).not.toBeNull();
    expect(m.warnings.map((w) => w.code)).toContain("x-axis-offscreen");
    // x labels move to the bottom edge of the grid
    const bottom = m.plot.top + m.plot.height;
    for (const l of m.xLabels) expect(l.y).toBeGreaterThan(bottom);
  });

  it("draws an axis on the edge when zero is exactly the minimum", () => {
    const m = buildGraphModel(cfg((c) => Object.assign(c.y, { min: 0, max: 10 })));
    expect(m.xAxis!.y1).toBeCloseTo(m.plot.top + m.plot.height);
  });

  it("omits arrows on ends where the window stops at 0 (first quadrant)", () => {
    const m = buildGraphModel(
      cfg((c) => {
        Object.assign(c.x, { min: 0, max: 20 });
        Object.assign(c.y, { min: 0, max: 20 });
      }),
    );
    expect(m.arrowheads).toHaveLength(2);
    // Both remaining tips point away from the origin (right and up).
    const tips = m.arrowheads.map((a) => a.points[0]);
    expect(tips.some(([x]) => x > m.plot.left + m.plot.width)).toBe(true);
    expect(tips.some(([, y]) => y < m.plot.top)).toBe(true);
  });

  it("keeps edge numbers clear of the other axis' arrowhead", () => {
    // y-axis off-screen → y numbers on the left edge, where the x-axis arrow is.
    const m = buildGraphModel(cfg((c) => Object.assign(c.x, { min: 5, max: 25 })));
    const leftTipX = Math.min(...m.arrowheads.flatMap((a) => a.points.map(([x]) => x)));
    for (const l of m.yLabels) expect(l.x).toBeLessThan(leftTipX);
    expect(leftTipX).toBeGreaterThan(0);
  });

  it("adds four arrowheads only when arrows are on", () => {
    expect(buildGraphModel(DEFAULT_CONFIG).arrowheads).toHaveLength(4);
    expect(buildGraphModel(cfg((c) => (c.show.arrows = false))).arrowheads).toHaveLength(0);
  });
});

describe("buildGraphModel: labels", () => {
  it("labels every labelStep and skips 0 where the axes cross", () => {
    const m = buildGraphModel(DEFAULT_CONFIG);
    expect(m.xLabels.map((l) => l.value)).toEqual([-10, -8, -6, -4, -2, 2, 4, 6, 8, 10]);
    expect(m.originLabel).toBeNull();
  });

  it("shows a single origin label when enabled", () => {
    const m = buildGraphModel(cfg((c) => (c.show.originLabel = true)));
    expect(m.originLabel?.text).toBe("0");
  });

  it("keeps a 0 label when the other axis is off-screen", () => {
    const m = buildGraphModel(cfg((c) => Object.assign(c.y, { min: 5, max: 25 })));
    expect(m.xLabels.map((l) => l.value)).toContain(0);
  });

  it("uses a real minus sign and clean decimals", () => {
    const m = buildGraphModel(
      cfg((c) => Object.assign(c.x, { min: -1, max: 1, gridStep: 0.1, labelStep: 0.5 })),
    );
    expect(m.xLabels.map((l) => l.text)).toEqual([`${MINUS}1`, `${MINUS}0.5`, "0.5", "1"]);
  });

  it("thins labels that would overlap and warns", () => {
    const m = buildGraphModel(
      cfg((c) => {
        Object.assign(c.x, { min: -100, max: 100, gridStep: 5, labelStep: 1 });
        c.size = { widthIn: 3, heightIn: 3 };
      }),
    );
    expect(m.warnings.map((w) => w.code)).toContain("x-labels-thinned");
    const xs = m.xLabels.map((l) => l.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(m.fontSize);
  });

  it("thinning keeps labels aligned to round values", () => {
    const m = buildGraphModel(
      cfg((c) => {
        Object.assign(c.x, { min: -100, max: 100, gridStep: 10, labelStep: 1 });
        c.size = { widthIn: 3, heightIn: 3 };
      }),
    );
    const step = m.xLabels[1].value - m.xLabels[0].value;
    for (const l of m.xLabels) expect(l.value % step).toBeCloseTo(0);
  });

  it("no labels when labels are off", () => {
    const m = buildGraphModel(cfg((c) => (c.show.labels = false)));
    expect(m.xLabels).toHaveLength(0);
    expect(m.yLabels).toHaveLength(0);
  });
});

describe("buildGraphModel: grid and scaling", () => {
  it("square mode gives square cells even in a wide image", () => {
    const m = buildGraphModel(cfg((c) => (c.size = { widthIn: 6, heightIn: 3 })));
    expect(m.pxPerUnitX).toBeCloseTo(m.pxPerUnitY);
    expect(m.plot.width).toBeCloseTo(m.plot.height);
  });

  it("fill mode lets x and y scales differ", () => {
    const m = buildGraphModel(
      cfg((c) => {
        c.cellShape = "fill";
        c.size = { widthIn: 6, heightIn: 3 };
      }),
    );
    expect(m.pxPerUnitX).toBeGreaterThan(m.pxPerUnitY);
  });

  it("grid spacing is independent of label spacing", () => {
    const m = buildGraphModel(DEFAULT_CONFIG);
    // 20 cells per axis → 19 interior lines each (edges come from the frame)
    expect(m.gridLines).toHaveLength(38);
    expect(m.xLabels).toHaveLength(10);
  });

  it("warns about partial edge squares and labels between grid lines", () => {
    const m = buildGraphModel(
      cfg((c) => Object.assign(c.x, { min: -2.5, max: 2.5, gridStep: 1, labelStep: 1.5 })),
    );
    const codes = m.warnings.map((w) => w.code);
    expect(codes).toContain("x-window-not-aligned");
    expect(codes).toContain("x-label-step-not-multiple");
  });
});
