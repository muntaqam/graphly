# Graphly

Precise, print-ready coordinate graphs for math teachers.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest unit tests for the graph math
npm run typecheck
npm run build
```

`node scripts/build-preview.mjs out/preview.html` builds a single self-contained HTML
preview of the editor.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code is organized and why.

## Status

- Phase 1 (done): typed config, graph math core, live editor and preview, SVG download, unit tests.
- Phase 2 (next): PNG at 300 DPI, PDF, Playwright end-to-end tests.
