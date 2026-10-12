/**
 * Form state ↔ GraphConfig.
 *
 * Inputs are kept as STRINGS while the teacher types. A number input bound
 * directly to a number can't represent "-" or "0." mid-keystroke, which makes
 * typing a negative or decimal value fight the UI. So:
 *
 *   form (strings) ──parseGraphForm──▶ { config | null, errors }
 *
 * When there are errors, the preview keeps showing the last valid graph and
 * the offending fields are highlighted. Nothing invalid ever reaches the
 * renderer, so the math code can assume its inputs are sane.
 */

import { formatTick, decimalsOf } from "./numbers";
import type { Background, CellShape, GraphConfig, GridTone, Visibility } from "./types";

export const NUMERIC_FIELDS = [
  "xMin", "xMax", "xGridStep", "xLabelStep",
  "yMin", "yMax", "yGridStep", "yLabelStep",
  "widthIn", "heightIn",
  "axisWidthPt", "gridWidthPt", "fontSizePt",
] as const;

export type NumericField = (typeof NUMERIC_FIELDS)[number];

export interface GraphForm extends Record<NumericField, string> {
  xTitle: string;
  yTitle: string;
  cellShape: CellShape;
  gridTone: GridTone;
  background: Background;
  show: Visibility;
}

export type FieldErrors = Partial<Record<NumericField, string>>;

export interface ParseResult {
  config: GraphConfig | null;
  errors: FieldErrors;
}

/** Limits that keep the graph printable and the browser responsive. */
export const LIMITS = {
  maxCellsPerAxis: 200,
  maxLabelsPerAxis: 400,
  maxAbsValue: 1e6,
  widthIn: [1, 17] as const,
  heightIn: [1, 17] as const,
  axisWidthPt: [0.25, 6] as const,
  gridWidthPt: [0.1, 4] as const,
  fontSizePt: [5, 24] as const,
};

/** Parse user text into a number, accepting the typographic minus "−". */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/−/g, "-");
  if (s === "" || !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Format a number back into form text without float noise. */
export function formatNumber(n: number): string {
  return formatTick(n, Math.min(decimalsOf(n), 10)).replace("−", "-");
}

export function formFromConfig(c: GraphConfig): GraphForm {
  return {
    xMin: formatNumber(c.x.min),
    xMax: formatNumber(c.x.max),
    xGridStep: formatNumber(c.x.gridStep),
    xLabelStep: formatNumber(c.x.labelStep),
    xTitle: c.x.title,
    yMin: formatNumber(c.y.min),
    yMax: formatNumber(c.y.max),
    yGridStep: formatNumber(c.y.gridStep),
    yLabelStep: formatNumber(c.y.labelStep),
    yTitle: c.y.title,
    widthIn: formatNumber(c.size.widthIn),
    heightIn: formatNumber(c.size.heightIn),
    axisWidthPt: formatNumber(c.style.axisWidthPt),
    gridWidthPt: formatNumber(c.style.gridWidthPt),
    fontSizePt: formatNumber(c.style.fontSizePt),
    cellShape: c.cellShape,
    gridTone: c.style.gridTone,
    background: c.style.background,
    show: { ...c.show },
  };
}

export function parseGraphForm(form: GraphForm): ParseResult {
  const errors: FieldErrors = {};
  const n = {} as Record<NumericField, number>;

  // Pass 1: every numeric field must be a number.
  for (const f of NUMERIC_FIELDS) {
    const v = parseNumber(form[f]);
    if (v === null) errors[f] = form[f].trim() === "" ? "Required" : "Enter a number";
    else if (Math.abs(v) > LIMITS.maxAbsValue) errors[f] = "Too large";
    else n[f] = v;
  }

  const ok = (...fs: NumericField[]) => fs.every((f) => !errors[f]);
  const range = (f: NumericField, [lo, hi]: readonly [number, number], unit: string) => {
    if (ok(f) && (n[f] < lo || n[f] > hi)) errors[f] = `Use ${lo}–${hi} ${unit}`;
  };

  // Pass 2: relationships between fields.
  for (const a of ["x", "y"] as const) {
    const min = `${a}Min` as const;
    const max = `${a}Max` as const;
    const grid = `${a}GridStep` as const;
    const label = `${a}LabelStep` as const;

    if (ok(min, max) && n[max] <= n[min]) errors[max] = `Must be greater than ${a} min`;
    if (ok(grid) && n[grid] <= 0) errors[grid] = "Must be positive";
    if (ok(label) && n[label] <= 0) errors[label] = "Must be positive";

    if (ok(min, max, grid)) {
      const cells = (n[max] - n[min]) / n[grid];
      if (cells > LIMITS.maxCellsPerAxis + 1e-9)
        errors[grid] = `Too many squares (${Math.round(cells)}); max ${LIMITS.maxCellsPerAxis}`;
      else if (cells < 1 - 1e-9) errors[grid] = "Larger than the whole range";
    }
    if (ok(min, max, label)) {
      const count = (n[max] - n[min]) / n[label];
      if (count > LIMITS.maxLabelsPerAxis) errors[label] = "Too many numbers; raise the interval";
    }
  }

  range("widthIn", LIMITS.widthIn, "in");
  range("heightIn", LIMITS.heightIn, "in");
  range("axisWidthPt", LIMITS.axisWidthPt, "pt");
  range("gridWidthPt", LIMITS.gridWidthPt, "pt");
  range("fontSizePt", LIMITS.fontSizePt, "pt");

  if (Object.keys(errors).length > 0) return { config: null, errors };

  return {
    errors,
    config: {
      x: { min: n.xMin, max: n.xMax, gridStep: n.xGridStep, labelStep: n.xLabelStep, title: form.xTitle },
      y: { min: n.yMin, max: n.yMax, gridStep: n.yGridStep, labelStep: n.yLabelStep, title: form.yTitle },
      size: { widthIn: n.widthIn, heightIn: n.heightIn },
      cellShape: form.cellShape,
      show: { ...form.show },
      style: {
        axisWidthPt: n.axisWidthPt,
        gridWidthPt: n.gridWidthPt,
        fontSizePt: n.fontSizePt,
        gridTone: form.gridTone,
        background: form.background,
      },
    },
  };
}
