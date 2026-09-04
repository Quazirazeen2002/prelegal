"use client";

import dynamic from "next/dynamic";
import { Block } from "@/lib/document-blocks";
import NdaPreview from "./NdaPreview";

const NdaDownloadButton = dynamic(() => import("./NdaDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-brand-gray">
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-gray">Preview</h2>
        {isComplete ? (
          <NdaDownloadButton blocks={blocks} fileName={fileName} documentTitle={documentTitle} />
        ) : (
          <span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-brand-gray">
            Finish the chat to enable download
          </span>
        )}
      </div>
      <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-7 shadow-lg shadow-slate-900/5">
        <NdaPreview blocks={blocks} />
      </div>
    </div>
  );
}
