"use client";

import dynamic from "next/dynamic";
import { Block } from "@/lib/document-blocks";
import NdaPreview from "./NdaPreview";

const NdaDownloadButton = dynamic(() => import("./NdaDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center justify-center rounded-full bg-canvas-overlay px-4 py-2 text-sm font-medium text-canvas-ink-muted">
      Loading…
    </span>
  ),
});

type Props = {
  blocks: Block[];
  isComplete: boolean;
  fileName?: string;
  documentTitle?: string;
};

/** Document-type-agnostic preview + gated PDF download — reused for the
 * Mutual NDA's hand-crafted blocks and every generic document's
 * template-derived blocks alike, since both are just Block[]. */
export default function PreviewPanel({ blocks, isComplete, fileName, documentTitle }: Props) {
  return (
    <div className="lg:sticky lg:top-8 lg:self-start">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-canvas-ink-muted">Preview</h2>
        {isComplete ? (
          <NdaDownloadButton blocks={blocks} fileName={fileName} documentTitle={documentTitle} />
        ) : (
          <span className="inline-flex items-center justify-center rounded-full bg-canvas-overlay px-4 py-2 text-sm font-medium text-canvas-ink-muted">
            Finish the chat to enable download
          </span>
        )}
      </div>
      <div className="max-h-[75vh] overflow-y-auto rounded-sm border border-paper-border bg-paper p-7 shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]">
        <NdaPreview blocks={blocks} />
      </div>
    </div>
  );
}
