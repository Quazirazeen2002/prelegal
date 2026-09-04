"use client";

import { useEffect, useState } from "react";
import { SavedDocument, deleteDocument, listDocuments } from "@/lib/documents";

type Props = {
  onClose: () => void;
  onLoad: (document: SavedDocument) => void;
};

export default function MyDocumentsModal({ onClose, onLoad }: Props) {
  const [documents, setDocuments] = useState<SavedDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => setError("Could not load your saved documents."));
  }, []);

  async function handleDelete(id: number) {
    try {
      await deleteDocument(id);
      setDocuments((docs) => docs?.filter((d) => d.id !== id) ?? null);
    } catch {
      setError("Could not delete this document.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/70 p-4 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-sm border border-paper-border bg-paper p-7 shadow-[0_40px_80px_-30px_rgba(1,10,24,0.65)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-paper-ink">My Documents</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-paper-ink-muted transition-colors hover:bg-paper-overlay hover:text-paper-ink"
          >
            ✕
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-3 text-sm text-del">
            {error}
          </p>
        )}

        {documents === null && !error && <p className="text-sm text-paper-ink-muted">Loading…</p>}
        {documents !== null && documents.length === 0 && (
          <p className="text-sm text-paper-ink-muted">You haven&apos;t saved any documents yet.</p>
        )}

        <ul className="space-y-2">
          {documents?.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-md border border-paper-border p-4 transition-colors hover:border-brand-purple/30 hover:bg-brand-purple/5"
            >
              <div>
                <p className="text-sm font-semibold text-paper-ink">{doc.title}</p>
                <p className="text-xs text-paper-ink-muted">
                  Updated {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onLoad(doc)}
                  className="rounded-full bg-brand-purple px-3.5 py-1.5 text-xs font-bold text-on-brand shadow-sm transition-colors hover:bg-brand-purple-dark"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="rounded-full border border-paper-border-strong px-3.5 py-1.5 text-xs font-medium text-paper-ink-muted transition-colors hover:bg-paper-overlay"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
