"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Block } from "@/lib/nda-content";
import NdaPdfDocument from "./NdaPdfDocument";

export default function NdaDownloadButton({ blocks }: { blocks: Block[] }) {
  return (
    <PDFDownloadLink
      document={<NdaPdfDocument blocks={blocks} />}
      fileName="mutual-nda.pdf"
      className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700"
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
