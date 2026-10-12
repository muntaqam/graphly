import type { GraphConfig } from "./types";

/**
 * Defaults aim for a graph a teacher could print without touching anything:
 * a standard −10…10 square grid, black axes, light-gray grid lines that still
 * show on a cheap laser printer, numbers every 2 so they never crowd, sized to
 * fit two-per-column on a worksheet.
 */
export const DEFAULT_CONFIG: GraphConfig = {
  x: { min: -10, max: 10, gridStep: 1, labelStep: 2, title: "x" },
  y: { min: -10, max: 10, gridStep: 1, labelStep: 2, title: "y" },
  size: { widthIn: 4, heightIn: 4 },
  cellShape: "square",
  show: {
    grid: true,
    axes: true,
    ticks: true,
    labels: true,
    arrows: true,
    axisTitles: true,
    originLabel: false,
  },
  style: {
    axisWidthPt: 1.25,
    gridWidthPt: 0.5,
    fontSizePt: 9,
    gridTone: "gray",
    background: "white",
  },
};

export interface Preset {
  id: string;
  name: string;
  description: string;
  config: GraphConfig;
}

const withAxes = (
  x: Partial<GraphConfig["x"]>,
  y: Partial<GraphConfig["y"]>,
  extra: Partial<GraphConfig> = {},
): GraphConfig => ({
  ...DEFAULT_CONFIG,
  ...extra,
  x: { ...DEFAULT_CONFIG.x, ...x },
  y: { ...DEFAULT_CONFIG.y, ...y },
});

export const PRESETS: Preset[] = [
  {
    id: "standard",
    name: "Four quadrants",
    description: "−10 to 10, numbered by 2",
    config: DEFAULT_CONFIG,
  },
  {
    id: "quadrant-1",
    name: "First quadrant",
    description: "0 to 20, numbered by 5",
    config: withAxes(
      { min: 0, max: 20, labelStep: 5 },
      { min: 0, max: 20, labelStep: 5 },
      { show: { ...DEFAULT_CONFIG.show, originLabel: true } },
    ),
  },
  {
    id: "blank",
    name: "Blank grid",
    description: "Axes, no numbers",
    config: withAxes({}, {}, { show: { ...DEFAULT_CONFIG.show, labels: false, ticks: false } }),
  },
  {
    id: "word-problem",
    name: "Word problem",
    description: "x 0–10, y 0–100, rectangular",
    config: withAxes(
      { min: 0, max: 10, gridStep: 1, labelStep: 1 },
      { min: 0, max: 100, gridStep: 10, labelStep: 10 },
      {
        size: { widthIn: 5, heightIn: 3.5 },
        cellShape: "fill",
        show: { ...DEFAULT_CONFIG.show, originLabel: true },
      },
    ),
  },
];
