"use client";

import { useGraphEditor } from "@/hooks/useGraphEditor";
import { PreviewPane } from "./PreviewPane";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/**
 * Desktop/laptop first: settings on the left, preview fills the rest. Below
 * the md breakpoint the preview stacks above the settings so the tool still
 * works on a tablet or phone.
 */
export function GraphEditorApp() {
  const editor = useGraphEditor();
  return (
    <div className="flex min-h-dvh flex-col bg-desk text-ink md:h-dvh">
      <TopBar editor={editor} />
      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <aside
          aria-label="Graph settings"
          className="w-full shrink-0 border-t border-line bg-white md:w-[340px] md:overflow-y-auto md:border-t-0 md:border-r"
        >
          <Sidebar editor={editor} />
        </aside>
        <main className="flex h-[70dvh] min-w-0 flex-1 flex-col md:h-auto">
          <PreviewPane editor={editor} />
        </main>
      </div>
    </div>
  );
}
