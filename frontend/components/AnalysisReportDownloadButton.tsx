"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { UploadedDocumentDetail } from "@/lib/uploads";
import AnalysisReportPdfDocument from "./AnalysisReportPdfDocument";

function slugifyFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function AnalysisReportDownloadButton({ upload }: { upload: UploadedDocumentDetail }) {
  return (
    <PDFDownloadLink
      document={<AnalysisReportPdfDocument upload={upload} />}
      fileName={`${slugifyFileName(upload.filename)}-analysis-report.pdf`}
      className="inline-flex items-center justify-center rounded-full bg-brand-purple px-5 py-2.5 text-sm font-bold text-on-brand shadow-sm transition-colors hover:bg-brand-purple-dark"
    >
      {({ loading }) => (loading ? "Preparing report…" : "Download Report PDF")}
    </PDFDownloadLink>
  );
}
