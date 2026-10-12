/**
 * Draws a GraphModel. No math happens here: every coordinate was computed by
 * buildGraphModel. That's what lets the same component serve the live preview
 * and (via renderToStaticMarkup) the exported SVG/PNG/PDF.
 *
 * Root sizing: width/height are set in inches and the viewBox in 1/96-inch
 * units, so the file has a true physical size. The preview overrides the
 * on-screen size with CSS; the coordinates inside never change.
 *
 * Future layers (plotted equations, points, shading) can be passed as
 * `children`; they render clipped to the plot area, between grid and axes.
 */

import type { ReactNode } from "react";
import type { GraphModel, TextLabel } from "@/lib/graph/types";
import { LABEL_FONT, TITLE_FONT } from "@/lib/graph/text";

/** Round to 0.01 unit (~0.0001 in): keeps files small, far below print precision. */
const r = (n: number) => Math.round(n * 100) / 100;

interface GraphSvgProps {
  model: GraphModel;
  /** Accessible description, e.g. "Coordinate grid from −10 to 10". */
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  /** Unique id prefix (needed when several graphs share a page). */
  idPrefix?: string;
}

function Labels({ labels, size }: { labels: TextLabel[]; size?: number }) {
  return (
    <>
      {labels.map((l, i) => (
        <text
          key={`${l.text}-${i}`}
          x={r(l.x)}
          y={r(l.y)}
          textAnchor={l.anchor}
          fontSize={size === undefined ? undefined : r(size)}
        >
          {l.text}
        </text>
      ))}
    </>
  );
}

export function GraphSvg({
  model: m,
  title,
  className,
  style,
  children,
  idPrefix = "graphly",
}: GraphSvgProps) {
  const clipId = `${idPrefix}-plot`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={`${m.widthIn}in`}
      height={`${m.heightIn}in`}
      viewBox={`0 0 ${r(m.width)} ${r(m.height)}`}
      className={className}
      style={style}
      role="img"
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <clipPath id={clipId}>
          <rect x={r(m.plot.left)} y={r(m.plot.top)} width={r(m.plot.width)} height={r(m.plot.height)} />
        </clipPath>
      </defs>

      {m.background === "white" ? (
        <rect x={0} y={0} width={r(m.width)} height={r(m.height)} fill="#ffffff" />
      ) : null}

      {/* Grid: thin lines, then the frame that closes the grid. */}
      <g stroke={m.stroke.gridColor} strokeWidth={r(m.stroke.gridWidth)} fill="none" strokeLinecap="butt">
        {m.gridLines.map((l, i) => (
          <line key={i} x1={r(l.x1)} y1={r(l.y1)} x2={r(l.x2)} y2={r(l.y2)} />
        ))}
        {m.frame ? (
          <rect x={r(m.frame.left)} y={r(m.frame.top)} width={r(m.frame.width)} height={r(m.frame.height)} />
        ) : null}
      </g>

      {children ? <g clipPath={`url(#${clipId})`}>{children}</g> : null}

      {/* Axes, ticks and arrowheads share the axis stroke. Arrowheads are plain
          polygons, not SVG markers, because markers render inconsistently in
          canvas and PDF converters. */}
      <g stroke={m.stroke.axisColor} strokeWidth={r(m.stroke.axisWidth)} strokeLinecap="butt">
        {m.xAxis ? <line x1={r(m.xAxis.x1)} y1={r(m.xAxis.y1)} x2={r(m.xAxis.x2)} y2={r(m.xAxis.y2)} /> : null}
        {m.yAxis ? <line x1={r(m.yAxis.x1)} y1={r(m.yAxis.y1)} x2={r(m.yAxis.x2)} y2={r(m.yAxis.y2)} /> : null}
        <g strokeWidth={r(Math.max(m.stroke.axisWidth * 0.8, m.stroke.gridWidth))}>
          {m.ticks.map((t, i) => (
            <line key={i} x1={r(t.x1)} y1={r(t.y1)} x2={r(t.x2)} y2={r(t.y2)} />
          ))}
        </g>
      </g>
      <g fill={m.stroke.axisColor} stroke="none">
        {m.arrowheads.map((a, i) => (
          <polygon key={i} points={a.points.map(([x, y]) => `${r(x)},${r(y)}`).join(" ")} />
        ))}
      </g>

      {/* Numbers sit on a white halo so grid lines never cut through them. */}
      <g
        fontFamily={LABEL_FONT}
        fontSize={r(m.fontSize)}
        fill={m.stroke.axisColor}
        stroke={m.background === "white" ? "#ffffff" : "none"}
        strokeWidth={r(m.fontSize * 0.28)}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        <Labels labels={m.xLabels} />
        <Labels labels={m.yLabels} />
        {m.originLabel ? <Labels labels={[m.originLabel]} /> : null}
      </g>
      <g fontFamily={TITLE_FONT} fontStyle="italic" fill={m.stroke.axisColor}>
        <Labels labels={m.axisTitles} size={m.titleFontSize} />
      </g>
    </svg>
  );
}
