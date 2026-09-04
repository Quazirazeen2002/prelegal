"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  UploadedDocumentDetail,
  UploadedDocumentSummary,
  deleteUpload,
  getUpload,
  listUploads,
  uploadDocument,
} from "@/lib/uploads";

type Props = {
  selectedUpload: UploadedDocumentDetail | null;
  onSelectUpload: (upload: UploadedDocumentDetail | null) => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_STYLES: Record<string, string> = {
  processed: "bg-brand-green/15 text-brand-green",
  processing: "bg-brand-yellow/15 text-brand-yellow",
  error: "bg-red-500/15 text-red-300",
};

const FEATURES = [
  {
    icon: "📄",
    title: "Plain-English Summary",
    description: "Get a clear, concise summary of your document in simple language.",
  },
  {
    icon: "🛡️",
    title: "Risk Detection",
    description: "AI identifies potential risks and red flags so you can make informed decisions.",
  },
  {
    icon: "💬",
    title: "Clause Review",
    description: "Understand key clauses and how they may impact you.",
  },
  {
    icon: "⚖️",
    title: "Standard-Terms Comparison",
    description: "See how your document compares to our closest standard template.",
  },
];

export default function UploadView({ selectedUpload, onSelectUpload }: Props) {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadedDocumentSummary[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    listUploads()
      .then(setUploads)
      .catch(() => setError("Could not load your recent uploads."));
  }, [user]);

  async function handleFile(file: File) {
    setError(null);
    setIsUploading(true);
    try {
      const detail = await uploadDocument(file);
      onSelectUpload(detail);
      setUploads((prev) => [
        {
          id: detail.id,
          filename: detail.filename,
          fileType: detail.fileType,
          fileSizeBytes: detail.fileSizeBytes,
          status: detail.status,
          createdAt: detail.createdAt,
          updatedAt: detail.updatedAt,
        },
        ...(prev ?? []),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload this document.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSelectExisting(id: number) {
    setError(null);
    try {
      onSelectUpload(await getUpload(id));
    } catch {
      setError("Could not load this document.");
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await deleteUpload(id);
      setUploads((prev) => prev?.filter((u) => u.id !== id) ?? null);
      if (selectedUpload?.id === id) onSelectUpload(null);
    } catch {
      setError("Could not delete this document.");
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[24rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-surface/60 p-8 text-center">
        <p className="text-sm text-ink-muted">Sign in (top right) to upload and analyze documents.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-14 text-center transition-colors ${
            isDragging ? "border-brand-green bg-brand-green/5" : "border-white/15 bg-surface/60"
          }`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/10 text-3xl">
            ⬆️
          </span>
          <p className="text-lg font-semibold text-ink">
            {isUploading ? "Uploading…" : "Drop legal document here"}
          </p>
          <p className="text-sm text-ink-muted">or</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-full bg-brand-green px-5 py-2 text-sm font-bold text-background shadow-sm transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Browse files"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-ink-muted">Accepted file types: PDF, DOCX, TXT</p>
          <p className="text-xs text-ink-muted">Max file size: 100MB</p>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Recent uploads
          </h2>
          {uploads === null && <p className="text-sm text-ink-muted">Loading…</p>}
          {uploads !== null && uploads.length === 0 && (
            <p className="text-sm text-ink-muted">No documents uploaded yet.</p>
          )}
          <ul className="space-y-2">
            {uploads?.map((u) => (
              <li
                key={u.id}
                onClick={() => handleSelectExisting(u.id)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:border-brand-green/30 hover:bg-brand-green/5 ${
                  selectedUpload?.id === u.id ? "border-brand-green/40 bg-brand-green/5" : "border-white/10"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-ink">{u.filename}</p>
                  <p className="text-xs text-ink-muted">
                    {u.fileType.toUpperCase()} • {formatFileSize(u.fileSizeBytes)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[u.status]}`}
                  >
                    {u.status}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(u.id, e)}
                    aria-label={`Delete ${u.filename}`}
                    className="text-ink-muted transition-colors hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink">✨ What you&apos;ll get</h3>
          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <span aria-hidden="true">{feature.icon}</span>
                <div>
                  <p className="text-sm font-medium text-ink">{feature.title}</p>
                  <p className="text-xs text-ink-muted">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-brand-blue/10 p-3 text-xs text-ink-muted">
            Our AI is trained on legal principles, not legal advice. Always consult a qualified
            professional for important legal decisions.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink">Your privacy matters</h3>
          <ul className="space-y-2 text-xs text-ink-muted">
            <li>Only you can see documents you upload — they&apos;re tied to your account.</li>
            <li>We never sell your data or share it with third parties.</li>
            <li>Delete an uploaded document at any time from the list above.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
