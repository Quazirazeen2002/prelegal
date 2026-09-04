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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/60 p-4 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl shadow-brand-navy/20">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-brand-navy">My Documents</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-brand-gray transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {documents === null && !error && <p className="text-sm text-brand-gray">Loading…</p>}
        {documents !== null && documents.length === 0 && (
          <p className="text-sm text-brand-gray">You haven&apos;t saved any documents yet.</p>
        )}

        <ul className="space-y-2">
          {documents?.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-blue/30 hover:bg-brand-blue/5"
            >
              <div>
                <p className="text-sm font-semibold text-brand-navy">{doc.title}</p>
                <p className="text-xs text-brand-gray">
                  Updated {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onLoad(doc)}
                  className="rounded-full bg-brand-purple px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-purple-dark"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="rounded-full border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
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
