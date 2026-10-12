# Graphly architecture (phase 1)

## Folder structure

```
src/
  app/                      Next.js App Router shell (layout, page, global CSS tokens)
  lib/
    graph/                  Pure TypeScript. No React, no DOM. All the math lives here.
      types.ts              GraphConfig (teacher's choices) and GraphModel (computed drawing)
      numbers.ts            Tick generation and float-safe formatting
      scale.ts              Math → SVG coordinate transform, square-cell fitting
      layout.ts             buildGraphModel(config): the single source of geometry
      text.ts               Deterministic label width estimates, shared font stacks
      units.ts              Inches, points, CSS px, DPI
      validation.ts         Form strings ↔ GraphConfig, field-level errors
      defaults.ts           Default config and presets
      *.test.ts             Vitest unit tests
    export/
      svg.ts                SVG serialization + download (PNG/PDF land here in phase 2)
  components/
    graph/GraphSvg.tsx      Draws a GraphModel. Reusable, no math.
    editor/                 Sidebar, TopBar, PreviewPane, form primitives
  hooks/
    useGraphEditor.ts       Editor state: form → config → model
scripts/
  build-preview.mjs         Single-file static build for hosted previews
```

The dependency direction is one-way: `components → hooks → lib/graph`. Nothing in
`lib/graph` imports React, so it can run in tests, on a server (PDF generation), or
in a Web Worker without change.

## The pipeline

```
form (strings) ─parseGraphForm─▶ GraphConfig ─buildGraphModel─▶ GraphModel ─GraphSvg─▶ <svg>
                                                                       └──────────────▶ SVG / PNG / PDF export
```

- **Form state is strings.** A number-bound input cannot hold "-" or "0." mid-typing.
  Invalid text produces a field error; the preview keeps the last valid graph.
- **GraphConfig** is what the teacher chose, in math units and print units.
- **GraphModel** is every line, label and arrowhead already positioned in SVG units.
  Preview and every export draw the same model, so they cannot disagree.

## Units

SVG user units are CSS pixels: 96 per inch. The root element gets
`width="4in" height="4in" viewBox="0 0 384 384"`, so coordinates are physical lengths.
Line widths and font sizes are entered in points (1/72 in) and converted with
`pt × 96 / 72`. A 300 DPI PNG of a 4 in graph is exactly 1200 × 1200 px.

## Coordinate transform

For a plot rectangle `(left, top, width, height)` showing `[xMin, xMax] × [yMin, yMax]`:

```
pxPerUnitX = width  / (xMax − xMin)
pxPerUnitY = height / (yMax − yMin)

svgX(x) = left + (x − xMin) · pxPerUnitX
svgY(y) = top  + (yMax − y) · pxPerUnitY      ← flips y: SVG's y-axis points down
```

Nothing assumes the origin is visible or centered, so negative, positive and
asymmetric windows all use the same two formulas, and the x and y scales are
independent.

**Mathematical aspect vs. physical size.** The image size (inches) is fixed by the
teacher. Inside it, the plot either:

- **Square cells**: `cell = min(availW / cellsX, availH / cellsY)`; the grid is
  `cell·cellsX × cell·cellsY`, centered. Every square is a true square.
- **Fill**: the grid uses all available space; x and y scales may differ.

## Float safety

Ticks are never produced by repeated addition (`v += 0.1` drifts). Instead we take
integer indices `k = ceil(min/step) … floor(max/step)`, compute `k × step` once each,
and round to the number of decimals in the step. Labels use a real minus sign (−).

## Product decisions and defaults

| Question | Decision |
|---|---|
| Does width × height include labels and arrows? | Yes. It's the size of the exported image, so it drops into a worksheet predictably. |
| Grid spacing vs. number spacing | Independent. Default: grid every 1, numbers every 2. |
| "Number of squares" | Derived from range ÷ grid spacing, never stored separately. Editing it rewrites grid spacing. |
| Origin outside the window | That axis isn't drawn (drawing it on the edge would misrepresent y = 0). Its numbers move to the grid edge, and a notice explains why. |
| Arrowheads | On every axis end, except where the window stops at exactly 0 (first-quadrant graphs), following textbook convention. |
| The "0" label | Hidden by default where axes cross; optional single "0" placed below-left of the origin. |
| Overlapping numbers | Thinned to every 2nd, 3rd… label, aligned to round values, with a notice suggesting fixes. |
| Numbers vs. grid lines | Numbers sit on a white halo so grid lines never cut through them. |
| Print defaults | Black 1.25 pt axes, 0.5 pt mid-gray grid (survives cheap laser printers), 9 pt Helvetica/Arial numbers, italic serif axis titles. |
| Limits | 1–17 in per side, ≤ 200 squares per axis, 5–24 pt numbers. |
| Arrowheads as polygons | Not SVG `<marker>`s, which render inconsistently in canvas and PDF converters. |
| Text alignment | Baselines are computed, not `dominant-baseline`, for the same reason. |
