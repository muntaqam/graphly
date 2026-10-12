"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { GraphSvg } from "@/components/graph/GraphSvg";
import type { GraphEditor } from "@/hooks/useGraphEditor";
import { formatNumber, pixelSizeAtDpi } from "@/lib/graph";
import { Segmented } from "./fields";

const RULER = 22; // px thickness of the rulers
const GUTTER = 28; // breathing room around the sheet

type Zoom = "fit" | "actual";

/**
 * Inch ruler. `scale` is screen px per SVG unit, so one inch on screen is
 * 96 × scale px. Major ticks every inch, minor every ⅛ (or ¼ when small).
 */
function Ruler({ inches, scale, vertical }: { inches: number; scale: number; vertical?: boolean }) {
  const pxPerIn = 96 * scale;
  const len = inches * pxPerIn;
  const sub = pxPerIn >= 80 ? 8 : pxPerIn >= 40 ? 4 : 2;
  const ticks: { pos: number; size: number; label?: string }[] = [];
  const n = Math.floor(inches * sub + 1e-9);
  for (let i = 0; i <= n; i++) {
    const pos = (i / sub) * pxPerIn;
    const isInch = i % sub === 0;
    const isHalf = !isInch && (i * 2) % sub === 0;
    ticks.push({ pos, size: isInch ? 10 : isHalf ? 7 : 4, label: isInch ? String(i / sub) : undefined });
  }
  return (
    <svg
      aria-hidden
      width={vertical ? RULER : len}
      height={vertical ? len : RULER}
      className="block overflow-visible text-muted"
    >
      {ticks.map((t, i) =>
        vertical ? (
          <g key={i}>
            <line x1={RULER} x2={RULER - t.size} y1={t.pos} y2={t.pos} stroke="currentColor" strokeWidth={1} />
            {t.label && t.label !== "0" ? (
              <text x={RULER - 12} y={t.pos + 3.5} textAnchor="end" fontSize={10} fill="currentColor">
                {t.label}
              </text>
            ) : null}
          </g>
        ) : (
          <g key={i}>
            <line x1={t.pos} x2={t.pos} y1={RULER} y2={RULER - t.size} stroke="currentColor" strokeWidth={1} />
            {t.label && t.label !== "0" ? (
              <text x={t.pos + 3} y={11} fontSize={10} fill="currentColor">
                {t.label}
              </text>
            ) : null}
          </g>
        ),
      )}
    </svg>
  );
}

export function PreviewPane({ editor }: { editor: GraphEditor }) {
  const { model, hasErrors } = editor;
  const deskRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<Zoom>("fit");
  const [box, setBox] = useState({ w: 800, h: 600 });

  useLayoutEffect(() => {
    const el = deskRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitScale = Math.min(
    (box.w - RULER - GUTTER * 2) / model.width,
    (box.h - RULER - GUTTER * 2) / model.height,
    3,
  );
  const scale = zoom === "actual" ? 1 : Math.max(0.1, fitScale);
  const png = pixelSizeAtDpi(model.widthIn, model.heightIn, 300);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-white/70 px-4 py-2.5 md:px-5">
        <p className="text-[0.9rem] text-muted" data-testid="size-readout">
          <span className="font-bold text-ink">
            {formatNumber(model.widthIn)} × {formatNumber(model.heightIn)} in
          </span>{" "}
          printed, {png.width} × {png.height} px as a 300 DPI image
        </p>
        <div className="w-48">
          <Segmented
            label="Zoom"
            value={zoom}
            onChange={setZoom}
            options={[
              { value: "fit", label: "Fit" },
              { value: "actual", label: "Actual size" },
            ]}
          />
        </div>
      </div>

      <div ref={deskRef} className="relative min-h-0 flex-1 overflow-auto bg-desk">
        <div className="flex min-h-full min-w-fit items-center justify-center" style={{ padding: GUTTER }}>
          <div
            className="grid"
            style={{ gridTemplateColumns: `${RULER}px auto`, gridTemplateRows: `${RULER}px auto` }}
          >
            <span />
            <Ruler inches={model.widthIn} scale={scale} />
            <Ruler inches={model.heightIn} scale={scale} vertical />
            <div
              data-testid="graph-preview"
              className={`relative shadow-[0_1px_2px_rgba(23,33,43,0.12),0_8px_24px_-8px_rgba(23,33,43,0.25)] transition-opacity ${
                hasErrors ? "opacity-60" : ""
              } ${model.background === "transparent" ? "checkerboard" : "bg-white"}`}
              style={{ width: model.width * scale, height: model.height * scale }}
            >
              <GraphSvg
                model={model}
                title={`Coordinate graph, x from ${editor.config.x.min} to ${editor.config.x.max}, y from ${editor.config.y.min} to ${editor.config.y.max}`}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>
          </div>
        </div>
      </div>

      {(hasErrors || model.warnings.length > 0) && (
        <div className="max-h-40 overflow-auto border-t border-line bg-white px-5 py-3" data-testid="messages">
          {hasErrors ? (
            <p className="mb-1.5 text-[0.9rem] text-danger">
              Some settings need fixing. The preview shows the last valid graph until they&rsquo;re corrected.
            </p>
          ) : null}
          <ul className="space-y-1">
            {model.warnings.map((w) => (
              <li key={w.code} className="flex gap-2 text-[0.88rem] leading-snug text-warn">
                <span aria-hidden className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
