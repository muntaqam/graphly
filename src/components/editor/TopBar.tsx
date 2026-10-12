"use client";

import { useEffect, useRef, useState } from "react";
import type { GraphEditor } from "@/hooks/useGraphEditor";
import { PRESETS } from "@/lib/graph";
import { downloadSvg, graphToSvgString } from "@/lib/export/svg";

/** Set in the hosted preview build, where browser downloads are blocked. */
const PREVIEW_MODE = process.env.NEXT_PUBLIC_GRAPHLY_PREVIEW === "1";

function Logo() {
  // A tiny graph: axes plus a 3×3 grid corner. Doubles as the favicon idea.
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      <rect x="1" y="1" width="24" height="24" rx="5" fill="var(--color-accent)" />
      <g stroke="#fff" strokeOpacity="0.45" strokeWidth="1">
        <path d="M7 5v16M19 5v16M5 7h16M5 19h16" />
      </g>
      <path d="M13 4v18M4 13h18" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

function DownloadMenu({ editor }: { editor: GraphEditor }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const disabled = editor.hasErrors;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item =
    "flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-accent-soft focus-visible:bg-accent-soft focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid="download-button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        title={disabled ? "Fix the highlighted settings to download" : undefined}
        onClick={() => setOpen((o) => !o)}
        className="h-9 rounded-md bg-accent px-4 text-[0.95rem] font-bold text-white transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        Download
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-20 w-64 rounded-lg border border-line bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(23,33,43,0.3)]"
        >
          <button
            role="menuitem"
            data-testid="download-svg"
            className={item}
            onClick={async () => {
              if (!PREVIEW_MODE) {
                downloadSvg(editor.model, editor.config);
                setOpen(false);
                return;
              }
              try {
                await navigator.clipboard.writeText(graphToSvgString(editor.model));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
          >
            <span className="font-bold text-ink">
              {PREVIEW_MODE ? (copied ? "SVG code copied" : "Copy SVG code") : "SVG"}
            </span>
            <span className="text-[0.82rem] text-muted">
              {PREVIEW_MODE
                ? "Downloads are off in this preview. Paste the code into a .svg file."
                : "Sharp at any size. Best for Word and Google Docs."}
            </span>
          </button>
          <button role="menuitem" className={item} disabled>
            <span className="font-bold text-ink">PNG, 300 DPI</span>
            <span className="text-[0.82rem] text-muted">Coming in the next build step</span>
          </button>
          <button role="menuitem" className={item} disabled>
            <span className="font-bold text-ink">PDF</span>
            <span className="text-[0.82rem] text-muted">Coming in the next build step</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar({ editor }: { editor: GraphEditor }) {
  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-white px-4 py-2.5 md:px-5">
      <div className="flex items-center gap-2.5">
        <Logo />
        <span className="text-[1.15rem] font-bold tracking-tight text-ink">Graphly</span>
      </div>

      <label className="order-last flex w-full items-center gap-2 text-[0.9rem] text-muted md:order-none md:ml-4 md:w-auto">
        <span className="shrink-0">Start from</span>
        <select
          data-testid="preset-select"
          className="h-9 min-w-0 flex-1 rounded-md border border-line-strong bg-white px-2 text-[0.92rem] text-ink focus-visible:outline-2 focus-visible:outline-accent"
          defaultValue=""
          onChange={(e) => {
            const p = PRESETS.find((x) => x.id === e.target.value);
            if (p) editor.load(p.config);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            Choose a layout
          </option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}: {p.description}
            </option>
          ))}
        </select>
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          data-testid="reset-button"
          onClick={editor.reset}
          className="h-9 rounded-md px-3 text-[0.95rem] text-ink hover:bg-desk focus-visible:outline-2 focus-visible:outline-accent"
        >
          Reset
        </button>
        <DownloadMenu editor={editor} />
      </div>
    </header>
  );
}
