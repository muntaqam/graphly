/**
 * Number helpers that keep floating-point noise out of the graph.
 *
 * The classic bug: generating ticks by repeated addition
 *   for (let v = min; v <= max; v += 0.1)
 * yields 0.30000000000000004 and can silently drop the last tick.
 *
 * Graphly never adds steps together. It works out the integer indices
 * k = ceil(min / step) … floor(max / step) and computes each value as k × step,
 * then rounds to the number of decimals the step itself has. Each value is
 * computed independently, so errors cannot accumulate.
 */

/** Relative tolerance used when comparing floating-point values. */
const EPS = 1e-9;

/** Number of decimal places needed to write `n` exactly (0.25 → 2, 5 → 0). */
export function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0;
  // toPrecision(12) trims binary noise such as 0.1 + 0.2 → "0.300000000000".
  const s = Math.abs(n).toPrecision(12);
  if (s.includes("e")) {
    const [mantissa, exp] = s.split("e");
    const mDecimals = (mantissa.split(".")[1] ?? "").replace(/0+$/, "").length;
    return Math.max(0, mDecimals - Number(exp));
  }
  const frac = (s.split(".")[1] ?? "").replace(/0+$/, "");
  return frac.length;
}

/** Round `n` to `decimals` places and normalise -0 to 0. */
export function roundTo(n: number, decimals: number): number {
  const r = Number(n.toFixed(Math.min(Math.max(decimals, 0), 15)));
  return Object.is(r, -0) ? 0 : r;
}

/** True when `a` and `b` are equal up to floating-point noise. */
export function nearlyEqual(a: number, b: number, scale = 1): boolean {
  return Math.abs(a - b) <= EPS * Math.max(1, Math.abs(scale), Math.abs(a), Math.abs(b));
}

/** True when `value` is (within tolerance) an integer multiple of `step`. */
export function isMultipleOf(value: number, step: number): boolean {
  if (step <= 0) return false;
  const q = value / step;
  return nearlyEqual(q, Math.round(q));
}

/**
 * Integer indices k such that k × step lies within [min, max].
 * Endpoints are included even if floating-point noise puts them a hair outside.
 */
export function multipleIndices(min: number, max: number, step: number): number[] {
  if (!(step > 0) || !(max >= min)) return [];
  const first = Math.ceil(min / step - EPS);
  const last = Math.floor(max / step + EPS);
  const out: number[] = [];
  for (let k = first; k <= last; k++) out.push(k);
  return out;
}

/** Multiples of `step` within [min, max], already cleaned of float noise. */
export function multiplesInRange(min: number, max: number, step: number): number[] {
  const d = decimalsOf(step);
  return multipleIndices(min, max, step).map((k) => roundTo(k * step, d));
}

/** Typographic minus sign (U+2212). Wider and centered, as in printed math. */
export const MINUS = "−";

/**
 * Format a tick value for display: no float noise, no trailing zeros, and a
 * real minus sign. `decimals` normally comes from the label step.
 */
export function formatTick(value: number, decimals: number): string {
  const r = roundTo(value, decimals);
  let body = Math.abs(r).toFixed(Math.min(Math.max(decimals, 0), 15));
  // Only strip zeros after a decimal point (never turn "10" into "1").
  if (body.includes(".")) body = body.replace(/0+$/, "").replace(/\.$/, "");
  return r < 0 ? MINUS + body : body;
}
