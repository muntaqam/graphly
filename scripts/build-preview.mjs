/**
 * Builds a single self-contained HTML file of the editor for hosting as a
 * static preview: Tailwind CSS compiled from globals.css, app bundled with
 * esbuild, both inlined. Usage: node scripts/build-preview.mjs out/preview.html
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const out = resolve(process.argv[2] ?? "out/preview.html");
const root = resolve(import.meta.dirname, "..");
mkdirSync(dirname(out), { recursive: true });

const cssFile = resolve(dirname(out), "preview.css");
execFileSync("npx", ["@tailwindcss/cli", "-i", "src/app/globals.css", "-o", cssFile, "--minify"], {
  cwd: root,
  stdio: "inherit",
});

const js = await build({
  entryPoints: [resolve(root, "scripts/preview-entry.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  alias: { "@": resolve(root, "src") },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_GRAPHLY_PREVIEW": '"1"',
  },
});

const css = readFileSync(cssFile, "utf8");
const html = `<title>Graphly</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<style>${css}
html,body{height:100%;background:#e8edf1;color:#17212b}
</style>
<div id="graphly-root"></div>
<script>${js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script>
`;
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
