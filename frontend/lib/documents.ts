import { apiUrl } from "@/lib/api";

export type SavedDocument = {
  id: number;
  documentType: string;
  title: string;
  fields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

async function parseJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || fallbackMessage);
  }
  return response.json();
}

export async function listDocuments(): Promise<SavedDocument[]> {
  const response = await fetch(apiUrl("/api/documents"), { credentials: "include" });
  return parseJsonOrThrow(response, "Could not load your saved documents.");
}

export async function createDocument(
  documentType: string,
  title: string,
  fields: Record<string, unknown>
): Promise<SavedDocument> {
  const response = await fetch(apiUrl("/api/documents"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ documentType, title, fields }),
  });
  return parseJsonOrThrow(response, "Could not save this document.");
}

export async function updateDocument(
  id: number,
  title: string,
  fields: Record<string, unknown>
): Promise<SavedDocument> {
  const response = await fetch(apiUrl(`/api/documents/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, fields }),
  });
  return parseJsonOrThrow(response, "Could not save this document.");
}

export async function deleteDocument(id: number): Promise<void> {
  const response = await fetch(apiUrl(`/api/documents/${id}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Could not delete this document.");
  }
}
