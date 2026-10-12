# Graphly

**Precise, print-ready coordinate graphs for math teachers.**

Teachers often reuse graphs from workbooks and Regents exams because making their own, with exact axis ranges, intervals and sizes, is tedious. Graphly lets you set every detail of a coordinate grid, see it update live, and download it at a predictable printed size for worksheets, quizzes and tests.

**Live app:** https://graphly-gules.vercel.app

## Features

- **Exact windows.** Set the x and y minimum and maximum, including negative, asymmetric and first-quadrant ranges.
- **Grid and numbers set separately.** Grid lines every 1, numbers every 2, or any other combination. Edit the number of squares directly if that's easier.
- **True physical size.** Choose the width and height in inches. A 4 × 4 in graph prints at 4 × 4 in.
- **Square cells or fill.** Keep every grid square a true square, or stretch the grid to fill the size for rectangular graphs.
- **Show or hide anything.** Grid lines, axes, arrowheads, tick marks, numbers, the origin "0" and axis titles.
- **Print-friendly styling.** Adjustable axis and grid thickness in points, number size, gray or black grid, white or transparent background.
- **Clean math typography.** Real minus signs, no floating-point artifacts like `0.30000000000000004`, and numbers that never overlap. When labels would collide, Graphly thins them and tells you.
- **Helpful validation.** Invalid settings are flagged next to the field while the preview keeps showing the last valid graph.
- **Quick-start layouts.** Four quadrants, first quadrant, blank grid and a rectangular word-problem layout.
- **SVG download.** Sharp at any size, and works in Word and Google Docs.

## Getting started

You'll need [Node.js](https://nodejs.org/en/download) (LTS version).

```bash
git clone https://github.com/muntaqam/graphly.git
cd graphly
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally with live reload |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm test` | Run the unit tests |
| `npm run test:watch` | Re-run tests as files change |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint |

## Tech stack

- [Next.js](https://nextjs.org) (App Router) and React
- TypeScript
- Tailwind CSS
- SVG for graph rendering
- [Vitest](https://vitest.dev) for unit tests

## How it works

All graph math lives in `src/lib/graph/` as plain TypeScript with no React, so it's easy to test and reuse:

```
form inputs ──▶ GraphConfig ──▶ buildGraphModel() ──▶ GraphModel ──▶ <GraphSvg> ──▶ preview and downloads
```

- **GraphConfig** is what the teacher chose: ranges, intervals, inches, points.
- **GraphModel** is every line, number and arrowhead already positioned in physical units.
- **GraphSvg** only draws the model, so the preview and every download always match.

SVG units are set to 1/96 inch and the file carries real inch dimensions, so printed size is exact. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the coordinate transform, design decisions and defaults.

```
src/
  app/                 Next.js pages and global styles
  lib/graph/           Graph math, types, validation, defaults (+ tests)
  lib/export/          Download helpers
  components/graph/    The reusable SVG graph component
  components/editor/   Sidebar, top bar, preview
  hooks/               Editor state
docs/                  Architecture notes
```

## Deploying

Graphly is deployed on [Vercel](https://vercel.com). With the Vercel CLI:

```bash
npx vercel --prod
```

Or connect this repository to a Vercel project so every push to `main` deploys automatically.

## Roadmap

- [x] Live graph editor with precise ranges, intervals and physical sizing
- [x] SVG download
- [x] Unit tests for ticks, scaling, labels, axis placement and validation
- [ ] PNG download at 300 DPI
- [ ] Printable PDF download
- [ ] End-to-end tests with Playwright
- [ ] Plotting equations, points and shading
- [ ] Worksheet builder with multiple graphs per page
