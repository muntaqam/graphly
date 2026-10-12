// Entry for the single-file hosted preview (scripts/build-preview.mjs).
// Renders the exact same editor as the Next.js page.
import { createRoot } from "react-dom/client";
import { GraphEditorApp } from "@/components/editor/GraphEditorApp";

createRoot(document.getElementById("graphly-root")!).render(<GraphEditorApp />);
