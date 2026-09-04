"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Block } from "@/lib/nda-content";
import NdaPdfDocument from "./NdaPdfDocument";

type Props = {
  blocks: Block[];
  fileName?: string;
  documentTitle?: string;
};

export default function NdaDownloadButton({
  blocks,
  fileName = "mutual-nda.pdf",
  documentTitle,
}: Props) {
  return (
    <PDFDownloadLink
      document={<NdaPdfDocument blocks={blocks} title={documentTitle} />}
      fileName={fileName}
      className="inline-flex items-center justify-center rounded-full bg-brand-green px-4 py-2 text-sm font-bold text-background shadow-sm transition-colors hover:bg-brand-green-dark"
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
