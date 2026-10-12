/**
 * Deterministic text measurement.
 *
 * Overlap prevention needs label widths. Measuring with the DOM would make the
 * layout depend on the browser and impossible to unit test, so we estimate with
 * Helvetica/Arial advance widths (fractions of the font size). Tick labels only
 * use digits, ".", and "−", so the estimate is very close.
 */

const ADVANCE: Record<string, number> = {
  "0": 0.556, "1": 0.556, "2": 0.556, "3": 0.556, "4": 0.556,
  "5": 0.556, "6": 0.556, "7": 0.556, "8": 0.556, "9": 0.556,
  ".": 0.278,
  "-": 0.333,
  "−": 0.584, // minus sign
  "/": 0.278,
  " ": 0.278,
};

/** Default for any other character (letters in axis titles). */
const FALLBACK = 0.6;

export function estimateTextWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) em += ADVANCE[ch] ?? FALLBACK;
  return em * fontSize;
}

/** Height a single line of label text occupies (cap height plus breathing room). */
export function estimateTextHeight(fontSize: number): number {
  return fontSize * 0.75;
}

/** Fonts used in the SVG. Kept here so the preview and exports always match. */
export const LABEL_FONT = "Helvetica, Arial, 'Liberation Sans', sans-serif";
export const TITLE_FONT = "'Times New Roman', Times, 'Liberation Serif', serif";
