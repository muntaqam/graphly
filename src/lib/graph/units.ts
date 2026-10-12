/**
 * Physical units.
 *
 * SVG user units in Graphly are CSS pixels: 96 per inch. The root <svg> is given
 * width="5in" height="5in" and viewBox="0 0 480 480", so every coordinate maps
 * to an exact physical length. Line widths and font sizes are chosen by the
 * teacher in points (1/72 inch), the unit print software uses.
 */

export const PX_PER_IN = 96;
export const PT_PER_IN = 72;

export const inToPx = (inches: number): number => inches * PX_PER_IN;
export const ptToPx = (points: number): number => (points * PX_PER_IN) / PT_PER_IN;

/** Pixel dimensions of an export at a given DPI (used by PNG export). */
export function pixelSizeAtDpi(widthIn: number, heightIn: number, dpi: number) {
  return {
    width: Math.round(widthIn * dpi),
    height: Math.round(heightIn * dpi),
  };
}
