/**
 * buildGraphModel: GraphConfig (what the teacher chose) → GraphModel (exactly
 * what to draw, in physical units).
 *
 * This is the only place graph geometry is decided. The preview, SVG export,
 * PNG export and PDF export all draw the same model, so they cannot disagree.
 * It is a pure function (no DOM, no React), which is why it is easy to test.
 *
 * Order of work:
 *   1. Convert physical settings (inches, points) to SVG units.
 *   2. Measure the labels we might draw (deterministically).
 *   3. Reserve margins around the plot for labels, arrowheads and titles.
 *   4. Fit the plot rectangle (square cells or fill) and build the scale.
 *   5. Generate grid lines, axes, ticks, labels, arrowheads.
 *   6. Collect warnings the UI can show.
 */

import {
  decimalsOf,
  formatTick,
  isMultipleOf,
  multipleIndices,
  nearlyEqual,
  roundTo,
} from "./numbers";
import { createScale, fitPlot } from "./scale";
import { estimateTextHeight, estimateTextWidth } from "./text";
import type {
  Arrowhead,
  AxisConfig,
  GraphConfig,
  GraphModel,
  GraphWarning,
  Line,
  TextLabel,
} from "./types";
import { inToPx, ptToPx } from "./units";

const GRID_COLORS = { gray: "#8c8c8c", black: "#000000" } as const;
const AXIS_COLOR = "#000000";

/** Cap height of Helvetica as a fraction of font size (for baseline math). */
const CAP_HEIGHT = 0.72;

interface LabelCandidate {
  index: number; // k, where value = k × labelStep
  value: number;
  text: string;
  width: number;
}

function labelCandidates(axis: AxisConfig, fontSize: number): LabelCandidate[] {
  const d = decimalsOf(axis.labelStep);
  return multipleIndices(axis.min, axis.max, axis.labelStep).map((k) => {
    const value = roundTo(k * axis.labelStep, d);
    const text = formatTick(value, d);
    return { index: k, value, text, width: estimateTextWidth(text, fontSize) };
  });
}

const contains = (min: number, max: number, v: number) =>
  v >= min - 1e-12 && v <= max + 1e-12;

/**
 * Smallest stride s (1, 2, 3, …) such that showing every s-th label leaves
 * at least `needed` units between neighbours.
 */
function labelStride(spacing: number, needed: number): number {
  if (spacing <= 0) return 1;
  return Math.max(1, Math.ceil(needed / spacing - 1e-9));
}

export function buildGraphModel(config: GraphConfig): GraphModel {
  const { x, y, show, style, size } = config;
  const warnings: GraphWarning[] = [];

  /* 1. Physical → SVG units ------------------------------------------------ */
  const width = inToPx(size.widthIn);
  const height = inToPx(size.heightIn);
  const fontSize = ptToPx(style.fontSizePt);
  const titleFontSize = fontSize * 1.25;
  const axisWidth = ptToPx(style.axisWidthPt);
  const gridWidth = ptToPx(style.gridWidthPt);

  const capH = fontSize * CAP_HEIGHT;
  const textH = estimateTextHeight(fontSize);
  const tickLen = show.ticks ? Math.max(fontSize * 0.45, axisWidth * 3) : 0;
  const labelGap = fontSize * 0.3;

  // Arrowheads scale with the axis stroke so they look balanced at any weight.
  const arrowLen = Math.max(ptToPx(5), axisWidth * 4.5);
  const arrowHalf = arrowLen * 0.38;
  const arrowExt = arrowLen * 1.35; // how far past the grid the arrow tip sits

  /* 2. Which axes exist, and where do labels sit? -------------------------- */
  // The x-axis is the line y = 0, so it exists only if 0 is in the y-range.
  const xAxisInRange = contains(y.min, y.max, 0);
  const yAxisInRange = contains(x.min, x.max, 0);
  const drawXAxis = show.axes && xAxisInRange;
  const drawYAxis = show.axes && yAxisInRange;
  const originVisible = xAxisInRange && yAxisInRange;

  const xCands = show.labels ? labelCandidates(x, fontSize) : [];
  const yCands = show.labels ? labelCandidates(y, fontSize) : [];
  const maxXLabelW = Math.max(0, ...xCands.map((c) => c.width));
  const maxYLabelW = Math.max(0, ...yCands.map((c) => c.width));

  const xTitle = show.axisTitles && drawXAxis ? x.title.trim() : "";
  const yTitle = show.axisTitles && drawYAxis ? y.title.trim() : "";
  const xTitleW = xTitle ? estimateTextWidth(xTitle, titleFontSize) : 0;

  /* 3. Margins --------------------------------------------------------------
   * Space is reserved conservatively and independently of the final scale, so
   * nothing is ever clipped and the result does not depend on a second pass.
   */
  const pad = inToPx(0.05);

  /*
   * Arrowheads, per end. An axis gets an arrow at an end unless the window
   * stops at exactly 0 there: then the axis begins at the origin (e.g. a
   * first-quadrant graph), and the textbook convention is no arrow, which also
   * keeps the origin corner clear for the "0" label.
   */
  const isZero = (v: number) => Math.abs(v) < 1e-12;
  const arrow = {
    left: drawXAxis && show.arrows && !isZero(x.min) ? arrowExt : 0,
    right: drawXAxis && show.arrows && !isZero(x.max) ? arrowExt : 0,
    bottom: drawYAxis && show.arrows && !isZero(y.min) ? arrowExt : 0,
    top: drawYAxis && show.arrows && !isZero(y.max) ? arrowExt : 0,
  };

  const xLabelBlock = xCands.length ? tickLen / 2 + labelGap + textH : 0;
  const yLabelBlock = yCands.length ? tickLen / 2 + labelGap + maxYLabelW : 0;
  const xOverhang = maxXLabelW / 2; // first/last x label is centered on the edge
  const yOverhang = yCands.length ? textH / 2 : 0;
  const titleGap = fontSize * 0.35;

  /*
   * When an axis is off-screen its numbers move to the grid edge. The other
   * axis' arrowhead also pokes out past that edge, so edge numbers are pushed
   * outside the arrow tip rather than colliding with it.
   */
  const yLabelsAtEdge = !yAxisInRange;
  const xLabelsAtEdge = !xAxisInRange;
  const yLabelOffset = yLabelsAtEdge ? arrow.left : 0;
  const xLabelOffset = xLabelsAtEdge ? arrow.bottom : 0;

  const margin = {
    left: pad + Math.max(arrow.left, yLabelOffset + yLabelBlock, xOverhang),
    right: pad + Math.max(arrow.right, xOverhang) + (xTitle ? titleGap + xTitleW : 0),
    top: pad + Math.max(arrow.top, yOverhang) + (yTitle ? titleGap + titleFontSize * 0.75 : 0),
    bottom: pad + Math.max(arrow.bottom, xLabelOffset + xLabelBlock, yOverhang),
  };

  const avail = {
    left: margin.left,
    top: margin.top,
    width: Math.max(1, width - margin.left - margin.right),
    height: Math.max(1, height - margin.top - margin.bottom),
  };
  if (avail.width < inToPx(0.5) || avail.height < inToPx(0.5)) {
    warnings.push({
      code: "plot-too-small",
      message:
        "The grid has very little room. Make the image larger or the numbers smaller.",
    });
  }

  /* 4. Plot rectangle and scale -------------------------------------------- */
  const plot = fitPlot(
    avail,
    config.cellShape,
    x.max - x.min,
    y.max - y.min,
    x.gridStep,
    y.gridStep,
  );
  const s = createScale(plot, x.min, x.max, y.min, y.max);
  const right = plot.left + plot.width;
  const bottom = plot.top + plot.height;

  /* 5a. Grid ---------------------------------------------------------------- */
  const gridLines: Line[] = [];
  if (show.grid) {
    for (const k of multipleIndices(x.min, x.max, x.gridStep)) {
      const px = s.x(k * x.gridStep);
      // Edge lines are drawn by the frame; skip duplicates.
      if (nearlyEqual(px, plot.left) || nearlyEqual(px, right)) continue;
      gridLines.push({ x1: px, y1: plot.top, x2: px, y2: bottom });
    }
    for (const k of multipleIndices(y.min, y.max, y.gridStep)) {
      const py = s.y(k * y.gridStep);
      if (nearlyEqual(py, plot.top) || nearlyEqual(py, bottom)) continue;
      gridLines.push({ x1: plot.left, y1: py, x2: right, y2: py });
    }
  }

  /* 5b. Axes and arrowheads ------------------------------------------------- */
  // The stroke stops partway into the arrowhead so a thick line never pokes
  // through the sharp tip.
  const ext = (a: number) => (a > 0 ? arrowExt - arrowLen * 0.6 : 0);
  const arrowheads: Arrowhead[] = [];
  let xAxis: Line | null = null;
  let yAxis: Line | null = null;

  if (drawXAxis) {
    const y0 = s.y(0);
    xAxis = { x1: plot.left - ext(arrow.left), y1: y0, x2: right + ext(arrow.right), y2: y0 };
    if (arrow.right) {
      const t = right + arrowExt;
      arrowheads.push({ points: [[t, y0], [t - arrowLen, y0 - arrowHalf], [t - arrowLen, y0 + arrowHalf]] });
    }
    if (arrow.left) {
      const t = plot.left - arrowExt;
      arrowheads.push({ points: [[t, y0], [t + arrowLen, y0 - arrowHalf], [t + arrowLen, y0 + arrowHalf]] });
    }
  }
  if (drawYAxis) {
    const x0 = s.x(0);
    yAxis = { x1: x0, y1: bottom + ext(arrow.bottom), x2: x0, y2: plot.top - ext(arrow.top) };
    if (arrow.top) {
      const t = plot.top - arrowExt;
      arrowheads.push({ points: [[x0, t], [x0 - arrowHalf, t + arrowLen], [x0 + arrowHalf, t + arrowLen]] });
    }
    if (arrow.bottom) {
      const t = bottom + arrowExt;
      arrowheads.push({ points: [[x0, t], [x0 - arrowHalf, t - arrowLen], [x0 + arrowHalf, t - arrowLen]] });
    }
  }

  /* 5c. Labels and ticks -----------------------------------------------------
   * x labels hang below the line y = 0 when it is visible, otherwise below the
   * bottom edge of the grid. y labels sit left of x = 0, otherwise left of the
   * left edge. Labels at 0 are skipped where the axes cross (that is the
   * optional origin label's job).
   */
  const xLabelLine = xAxisInRange ? s.y(0) : bottom + xLabelOffset;
  const yLabelLine = yAxisInRange ? s.x(0) : plot.left - yLabelOffset;

  const strideX = labelStride(x.labelStep * s.pxPerUnitX, maxXLabelW + fontSize * 0.6);
  const strideY = labelStride(y.labelStep * s.pxPerUnitY, textH + fontSize * 0.55);

  const xLabels: TextLabel[] = [];
  const yLabels: TextLabel[] = [];
  const ticks: Line[] = [];

  for (const c of xCands) {
    if (c.index % strideX !== 0) continue;
    if (c.value === 0 && originVisible) continue;
    const px = s.x(c.value);
    xLabels.push({
      x: px,
      y: xLabelLine + tickLen / 2 + labelGap + capH,
      text: c.text,
      anchor: "middle",
      value: c.value,
    });
    if (drawXAxis && tickLen > 0) {
      ticks.push({ x1: px, y1: xLabelLine - tickLen / 2, x2: px, y2: xLabelLine + tickLen / 2 });
    }
  }
  for (const c of yCands) {
    if (c.index % strideY !== 0) continue;
    if (c.value === 0 && originVisible) continue;
    const py = s.y(c.value);
    yLabels.push({
      x: yLabelLine - tickLen / 2 - labelGap,
      y: py + capH / 2,
      text: c.text,
      anchor: "end",
      value: c.value,
    });
    if (drawYAxis && tickLen > 0) {
      ticks.push({ x1: yLabelLine - tickLen / 2, y1: py, x2: yLabelLine + tickLen / 2, y2: py });
    }
  }

  const originLabel: TextLabel | null =
    show.labels && show.originLabel && originVisible
      ? {
          x: yLabelLine - tickLen / 2 - labelGap,
          y: xLabelLine + tickLen / 2 + labelGap + capH,
          text: "0",
          anchor: "end",
          value: 0,
        }
      : null;

  /* 5d. Axis titles (at the positive ends) ---------------------------------- */
  const axisTitles: TextLabel[] = [];
  if (xTitle && xAxis) {
    axisTitles.push({
      x: right + arrow.right + titleGap,
      y: xAxis.y1 + titleFontSize * 0.25,
      text: xTitle,
      anchor: "start",
      value: x.max,
    });
  }
  if (yTitle && yAxis) {
    axisTitles.push({
      x: yAxis.x1,
      y: plot.top - arrow.top - titleGap,
      text: yTitle,
      anchor: "middle",
      value: y.max,
    });
  }

  /* 6. Warnings ------------------------------------------------------------- */
  if (show.axes && !xAxisInRange) {
    warnings.push({
      code: "x-axis-offscreen",
      message:
        "The x-axis (y = 0) is outside the y-range, so it isn't drawn. x-numbers are placed along the bottom edge.",
    });
  }
  if (show.axes && !yAxisInRange) {
    warnings.push({
      code: "y-axis-offscreen",
      message:
        "The y-axis (x = 0) is outside the x-range, so it isn't drawn. y-numbers are placed along the left edge.",
    });
  }
  const thinned = (axis: "x" | "y", stride: number, step: number) =>
    warnings.push({
      code: `${axis}-labels-thinned`,
      message: `${axis}-axis numbers would overlap, so only every ${formatTick(
        stride * step,
        decimalsOf(step),
      )} is shown. Increase the size, use smaller numbers, or raise the number interval.`,
    });
  if (xCands.length > 1 && strideX > 1) thinned("x", strideX, x.labelStep);
  if (yCands.length > 1 && strideY > 1) thinned("y", strideY, y.labelStep);

  for (const [name, axis] of [["x", x], ["y", y]] as const) {
    if (show.labels && show.grid && !isMultipleOf(axis.labelStep, axis.gridStep)) {
      warnings.push({
        code: `${name}-label-step-not-multiple`,
        message: `The ${name} number interval isn't a multiple of the ${name} grid spacing, so some numbers fall between grid lines.`,
      });
    }
    if (!isMultipleOf(axis.min, axis.gridStep) || !isMultipleOf(axis.max, axis.gridStep)) {
      warnings.push({
        code: `${name}-window-not-aligned`,
        message: `The ${name} range doesn't start and end on a grid line, so the edge squares are partial.`,
      });
    }
  }

  return {
    width,
    height,
    widthIn: size.widthIn,
    heightIn: size.heightIn,
    plot,
    pxPerUnitX: s.pxPerUnitX,
    pxPerUnitY: s.pxPerUnitY,
    gridLines,
    frame: show.grid ? plot : null,
    xAxis,
    yAxis,
    ticks,
    xLabels,
    yLabels,
    originLabel,
    arrowheads,
    axisTitles,
    stroke: {
      axisWidth,
      gridWidth,
      axisColor: AXIS_COLOR,
      gridColor: GRID_COLORS[style.gridTone],
    },
    fontSize,
    titleFontSize,
    background: style.background,
    warnings,
  };
}
