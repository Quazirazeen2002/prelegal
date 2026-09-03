"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";
import { createDefaultNdaFormData } from "@/lib/nda";
import { buildNdaDocumentBlocks } from "@/lib/nda-content";

const NdaDownloadButton = dynamic(() => import("./NdaDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center justify-center rounded-md bg-zinc-300 px-4 py-2 text-sm font-medium text-zinc-500">
      Loading…
    </span>
  ),
});

export default function NdaCreator() {
  const [data, setData] = useState(createDefaultNdaFormData);
  const blocks = useMemo(() => buildNdaDocumentBlocks(data), [data]);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-2">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-zinc-900">
          Mutual NDA Creator
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Fill in the details below. The document on the right updates as you
          type — download it as a PDF when you&apos;re done.
        </p>
        <NdaForm data={data} onChange={setData} />
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Preview</h2>
          <NdaDownloadButton blocks={blocks} />
        </div>
        <div className="max-h-[85vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <NdaPreview blocks={blocks} />
        </div>
      </div>
    </div>
  );
}
