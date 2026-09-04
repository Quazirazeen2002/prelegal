import { apiUrl } from "@/lib/api";

export type UploadedDocumentSummary = {
  id: number;
  filename: string;
  fileType: string;
  fileSizeBytes: number;
  status: "processing" | "processed" | "error";
  createdAt: string;
  updatedAt: string;
};

export type RiskItem = {
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  relatedClause: string | null;
};

export type ClauseExplanation = {
  clauseTitle: string;
  plainEnglish: string;
};

export type ComparisonDeviation = {
  topic: string;
  standardTerm: string;
  uploadedDocumentTerm: string;
  assessment: string;
};

export type Comparison = {
  matchedCatalogKey: string;
  matchedCatalogName: string;
  deviations: ComparisonDeviation[];
};

export type UploadedDocumentDetail = UploadedDocumentSummary & {
  errorMessage: string | null;
  matchedCatalogKey: string | null;
  matchedCatalogName: string | null;
  summary: string | null;
  risks: RiskItem[] | null;
  clauses: ClauseExplanation[] | null;
  comparison: Comparison | null;
};

async function parseJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || fallbackMessage);
  }
  return response.json();
}

export async function listUploads(): Promise<UploadedDocumentSummary[]> {
  const response = await fetch(apiUrl("/api/uploads"), { credentials: "include" });
  return parseJsonOrThrow(response, "Could not load your uploaded documents.");
}

export async function getUpload(id: number): Promise<UploadedDocumentDetail> {
  const response = await fetch(apiUrl(`/api/uploads/${id}`), { credentials: "include" });
  return parseJsonOrThrow(response, "Could not load this document.");
}

export async function uploadDocument(file: File): Promise<UploadedDocumentDetail> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(apiUrl("/api/uploads"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return parseJsonOrThrow(response, "Could not upload this document.");
}

export async function deleteUpload(id: number): Promise<void> {
  const response = await fetch(apiUrl(`/api/uploads/${id}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Could not delete this document.");
  }
}
