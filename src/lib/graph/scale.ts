/**
 * Coordinate transformation: math space → SVG space.
 *
 * SVG's origin is the top-left corner and its y-axis points DOWN. Math's y-axis
 * points UP. For a plot rectangle (left, top, width, height) showing
 * x ∈ [xMin, xMax] and y ∈ [yMin, yMax]:
 *
 *   pxPerUnitX = width  / (xMax − xMin)
 *   pxPerUnitY = height / (yMax − yMin)
 *
 *   svgX(x) = left + (x − xMin) · pxPerUnitX
 *   svgY(y) = top  + (yMax − y) · pxPerUnitY     ← (yMax − y) flips the axis
 *
 * Check the corners: x = xMin lands on `left`, y = yMax lands on `top`
 * (the top edge), y = yMin lands on `top + height` (the bottom edge).
 *
 * Nothing assumes the origin is visible or centered, so negative, positive and
 * asymmetric windows all go through the same two formulas. The x and y scales
 * are independent; whether they end up equal is decided by the layout step.
 */

import type { Rect } from "./types";

export interface Scale {
  x: (mathX: number) => number;
  y: (mathY: number) => number;
  /** Inverse transforms (for hit-testing or future point placement). */
  invertX: (svgX: number) => number;
  invertY: (svgY: number) => number;
  pxPerUnitX: number;
  pxPerUnitY: number;
}

export function createScale(
  plot: Rect,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): Scale {
  const pxPerUnitX = plot.width / (xMax - xMin);
  const pxPerUnitY = plot.height / (yMax - yMin);
  return {
    x: (v) => plot.left + (v - xMin) * pxPerUnitX,
    y: (v) => plot.top + (yMax - v) * pxPerUnitY,
    invertX: (px) => xMin + (px - plot.left) / pxPerUnitX,
    invertY: (py) => yMax - (py - plot.top) / pxPerUnitY,
    pxPerUnitX,
    pxPerUnitY,
  };
}

/**
 * Size of the plot rectangle inside the space available to it.
 *
 * "fill": use all of it.
 * "square": a grid cell is `gridStepX` wide and `gridStepY` tall in math units.
 *   We want every cell to be the same physical size in both directions, so the
 *   cell side is limited by whichever direction runs out of room first:
 *
 *     cellsX = (xMax − xMin) / gridStepX,  cellsY = (yMax − yMin) / gridStepY
 *     cell   = min(availW / cellsX, availH / cellsY)
 *
 *   The plot is then (cell · cellsX) × (cell · cellsY), centered in the space.
 */
export function fitPlot(
  avail: Rect,
  cellShape: "square" | "fill",
  rangeX: number,
  rangeY: number,
  gridStepX: number,
  gridStepY: number,
): Rect {
  if (cellShape === "fill") return { ...avail };
  const cellsX = rangeX / gridStepX;
  const cellsY = rangeY / gridStepY;
  const cell = Math.min(avail.width / cellsX, avail.height / cellsY);
  const width = cell * cellsX;
  const height = cell * cellsY;
  return {
    left: avail.left + (avail.width - width) / 2,
    top: avail.top + (avail.height - height) / 2,
    width,
    height,
  };
}
