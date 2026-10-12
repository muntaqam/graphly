/**
 * SVG export. The file is produced from the same GraphSvg component and the
 * same GraphModel as the preview, rendered to markup. It is not a screenshot:
 * it's the exact vector drawing, with width/height in inches.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GraphSvg } from "@/components/graph/GraphSvg";
import type { GraphConfig, GraphModel } from "@/lib/graph/types";
import { formatNumber } from "@/lib/graph/validation";

export function graphToSvgString(model: GraphModel): string {
  const markup = renderToStaticMarkup(createElement(GraphSvg, { model, idPrefix: "graphly-export" }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`;
}

/** e.g. graphly_x-10to10_y-10to10_4x4in */
export function exportFileName(c: GraphConfig): string {
  const f = (n: number) => formatNumber(n).replace(".", "p");
  return `graphly_x${f(c.x.min)}to${f(c.x.max)}_y${f(c.y.min)}to${f(c.y.max)}_${f(c.size.widthIn)}x${f(c.size.heightIn)}in`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(model: GraphModel, config: GraphConfig) {
  const blob = new Blob([graphToSvgString(model)], { type: "image/svg+xml" });
  downloadBlob(blob, `${exportFileName(config)}.svg`);
}
