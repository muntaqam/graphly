/**
 * Graph configuration types.
 *
 * Two different "spaces" appear throughout Graphly, and keeping them apart is
 * the single most important idea in the codebase:
 *
 *   - MATH space:     the coordinate plane the teacher thinks in (x from -10 to 10).
 *   - PHYSICAL space: the printed image, measured in inches / points.
 *
 * `GraphConfig` is what the teacher chooses. `GraphModel` (see layout.ts) is the
 * fully computed result: every line, label and arrow already positioned in
 * physical units. The SVG component only draws a GraphModel; it never does math.
 */

/** One axis' mathematical window and numbering. All values are in math units. */
export interface AxisConfig {
  /** Smallest visible value, e.g. -10. */
  min: number;
  /** Largest visible value, e.g. 10. Must be greater than `min`. */
  max: number;
  /** Distance between grid lines, e.g. 1. Controls how many squares there are. */
  gridStep: number;
  /** Distance between numeric labels, e.g. 2. Independent of `gridStep`. */
  labelStep: number;
  /** Axis title drawn at the positive end of the axis, e.g. "x". Empty = none. */
  title: string;
}

/**
 * How the plot fills the chosen image size.
 *
 * - "square": every grid cell is a physical square. The plot is shrunk along one
 *   direction (and centered) so cells stay square. This is what textbooks and
 *   Regents exams use, and what "1 unit = 1 unit" means on graph paper when the
 *   x and y grid steps are equal.
 * - "fill": the plot stretches to fill the image. Cells may be rectangles, so the
 *   x and y scales differ (useful for e.g. time vs. distance graphs).
 */
export type CellShape = "square" | "fill";

export type Background = "white" | "transparent";

export type GridTone = "gray" | "black";

/** What to draw. Each flag is independent. */
export interface Visibility {
  grid: boolean;
  axes: boolean;
  /** Short tick marks on the axes at each labeled value. */
  ticks: boolean;
  labels: boolean;
  arrows: boolean;
  axisTitles: boolean;
  /** Show a single "0" at the origin. Off by default to keep the crossing clean. */
  originLabel: boolean;
}

/** Visual styling, in print units (points: 1pt = 1/72 inch). */
export interface StyleConfig {
  axisWidthPt: number;
  gridWidthPt: number;
  fontSizePt: number;
  gridTone: GridTone;
  background: Background;
}

/** Physical size of the whole exported image, labels and arrows included. */
export interface PhysicalSize {
  widthIn: number;
  heightIn: number;
}

export interface GraphConfig {
  x: AxisConfig;
  y: AxisConfig;
  size: PhysicalSize;
  cellShape: CellShape;
  show: Visibility;
  style: StyleConfig;
}

/* ------------------------------------------------------------------------- */
/* Computed model (output of buildGraphModel). Units are SVG user units,      */
/* where 1 unit = 1/96 inch (the CSS pixel), so 96 units = 1 printed inch.     */
/* ------------------------------------------------------------------------- */

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TextLabel {
  /**
   * Position of the text's ALPHABETIC baseline. We compute vertical alignment
   * ourselves instead of relying on SVG `dominant-baseline`, which canvas
   * rasterizers and PDF converters handle inconsistently. That keeps the
   * preview and every export format identical.
   */
  x: number;
  y: number;
  text: string;
  anchor: "start" | "middle" | "end";
  /** The math value this label represents (handy for tests and debugging). */
  value: number;
}

export interface Arrowhead {
  /** Closed polygon points, in SVG units. */
  points: [number, number][];
}

export type WarningCode =
  | "x-axis-offscreen"
  | "y-axis-offscreen"
  | "x-labels-thinned"
  | "y-labels-thinned"
  | "x-label-step-not-multiple"
  | "y-label-step-not-multiple"
  | "x-window-not-aligned"
  | "y-window-not-aligned"
  | "plot-too-small";

export interface GraphWarning {
  code: WarningCode;
  message: string;
}

export interface GraphModel {
  /** Full image size in SVG units (= inches × 96). */
  width: number;
  height: number;
  widthIn: number;
  heightIn: number;
  /** The rectangle covered by the grid. */
  plot: Rect;
  /** Physical size of one math unit along each axis, in SVG units. */
  pxPerUnitX: number;
  pxPerUnitY: number;
  gridLines: Line[];
  /** Outline of the plot area (drawn in the grid style so the grid is closed). */
  frame: Rect | null;
  /** Present only when 0 lies inside the corresponding range. */
  xAxis: Line | null;
  yAxis: Line | null;
  ticks: Line[];
  xLabels: TextLabel[];
  yLabels: TextLabel[];
  originLabel: TextLabel | null;
  arrowheads: Arrowhead[];
  axisTitles: TextLabel[];
  /** Style values already converted to SVG units / colors. */
  stroke: {
    axisWidth: number;
    gridWidth: number;
    axisColor: string;
    gridColor: string;
  };
  fontSize: number;
  titleFontSize: number;
  background: Background;
  warnings: GraphWarning[];
}
