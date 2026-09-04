"use client";

import { useMemo, useState } from "react";
import ChatPanel from "./ChatPanel";
import PreviewPanel from "./PreviewPanel";
import MyDocumentsModal from "./MyDocumentsModal";
import { useAuth } from "./AuthContext";
import { ChatMessage, sendChatMessage } from "@/lib/chat";
import { detectDocumentType, sendGenericMessage } from "@/lib/document-chat";
import { createDefaultNdaFormData, NdaFormData } from "@/lib/nda";
import { buildNdaDocumentBlocks } from "@/lib/nda-content";
import { Block } from "@/lib/document-blocks";
import { fetchTemplateMarkdown, buildGenericCoverPageBlocks } from "@/lib/generic-document";
import { parseDocumentTemplate } from "@/lib/document-template";
import { SavedDocument, createDocument, updateDocument } from "@/lib/documents";

function initialMessages(): ChatMessage[] {
  return [
    {
      role: "assistant",
      content:
        "Hi! I can help you draft a legal document — a Mutual NDA, a Cloud Service Agreement, a DPA, and more. What do you need today?",
    },
  ];
}

type Phase =
  | { kind: "detecting" }
  | { kind: "mutual-nda" }
  | { kind: "generic-loading"; documentType: string }
  | { kind: "generic-error"; documentType: string }
  | { kind: "generic"; documentType: string; documentName: string; variables: string[]; bodyBlocks: Block[] };

function slugifyFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function ndaTitle(fields: NdaFormData): string {
  const party1 = fields.party1.company.trim() || "Party 1";
  const party2 = fields.party2.company.trim() || "Party 2";
  return `${party1} <> ${party2} NDA`;
}

export default function DocumentCreator() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [phase, setPhase] = useState<Phase>({ kind: "detecting" });
  const [showMyDocuments, setShowMyDocuments] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loadedDocumentId, setLoadedDocumentId] = useState<number | null>(null);

  const [ndaFields, setNdaFields] = useState<NdaFormData>(createDefaultNdaFormData);
  const [ndaIsComplete, setNdaIsComplete] = useState(false);
  const ndaBlocks = useMemo(() => buildNdaDocumentBlocks(ndaFields), [ndaFields]);

  const [genericFields, setGenericFields] = useState<Record<string, string>>({});
  const [genericIsComplete, setGenericIsComplete] = useState(false);

  async function loadGenericDocument(documentType: string, prefilledFields?: Record<string, string>) {
    setPhase({ kind: "generic-loading", documentType });
    try {
      const markdown = await fetchTemplateMarkdown(documentType);
      const { blocks, variables } = parseDocumentTemplate(markdown);
      const [titleBlock, ...bodyBlocks] = blocks;
      const documentName = titleBlock?.type === "h1" ? titleBlock.text : documentType;
      setGenericFields(prefilledFields ?? {});
      setGenericIsComplete(Boolean(prefilledFields));
      setPhase({ kind: "generic", documentType, documentName, variables, bodyBlocks });
    } catch {
      setPhase({ kind: "generic-error", documentType });
    }
  }

  async function handleSend(nextMessages: ChatMessage[]): Promise<string> {
    if (phase.kind === "detecting") {
      const result = await detectDocumentType(nextMessages);
      if (result.documentType === "mutual-nda") {
        setPhase({ kind: "mutual-nda" });
      } else if (result.documentType) {
        await loadGenericDocument(result.documentType);
      }
      return result.reply;
    }

    if (phase.kind === "mutual-nda") {
      const result = await sendChatMessage(nextMessages, ndaFields);
      setNdaFields(result.fields);
      setNdaIsComplete(result.isComplete);
      return result.reply;
    }

    if (phase.kind === "generic") {
      const result = await sendGenericMessage(
        nextMessages,
        phase.documentType,
        phase.variables,
        genericFields
      );
      setGenericFields(result.fields);
      setGenericIsComplete(result.isComplete);
      return result.reply;
    }

    throw new Error("The document is still loading — please wait a moment and try again.");
  }

  function handleNewDocument() {
    setMessages(initialMessages());
    setPhase({ kind: "detecting" });
    setNdaFields(createDefaultNdaFormData());
    setNdaIsComplete(false);
    setGenericFields({});
    setGenericIsComplete(false);
    setSaveState("idle");
    setLoadedDocumentId(null);
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const title =
        phase.kind === "mutual-nda"
          ? ndaTitle(ndaFields)
          : phase.kind === "generic"
            ? phase.documentName
            : "";
      const fields = phase.kind === "mutual-nda" ? ndaFields : genericFields;

      if (loadedDocumentId !== null) {
        await updateDocument(loadedDocumentId, title, fields);
      } else if (phase.kind === "mutual-nda") {
        const saved = await createDocument("mutual-nda", title, fields);
        setLoadedDocumentId(saved.id);
      } else if (phase.kind === "generic") {
        const saved = await createDocument(phase.documentType, title, fields);
        setLoadedDocumentId(saved.id);
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function handleLoadDocument(doc: SavedDocument) {
    setShowMyDocuments(false);
    setMessages([
      {
        role: "assistant",
        content: `Loaded "${doc.title}". Feel free to keep chatting to make changes, or download it as-is.`,
      },
    ]);
    setSaveState("idle");
    setLoadedDocumentId(doc.id);

    if (doc.documentType === "mutual-nda") {
      setNdaFields(doc.fields as unknown as NdaFormData);
      setNdaIsComplete(true);
      setPhase({ kind: "mutual-nda" });
    } else {
      await loadGenericDocument(doc.documentType, doc.fields as Record<string, string>);
    }
  }

  const isComplete = phase.kind === "mutual-nda" ? ndaIsComplete : phase.kind === "generic" && genericIsComplete;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-canvas-ink sm:text-4xl">
            Draft a legal document <span className="text-brand-purple">in minutes</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-canvas-ink-muted">
            Chat with the assistant below — a Mutual NDA, a Cloud Service Agreement, a DPA, and more.
            The document on the right updates live as you go, and you can download it as a polished
            PDF once everything&apos;s gathered.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={() => setShowMyDocuments(true)}
              className="rounded-full border border-canvas-border-strong px-3.5 py-1.5 text-sm font-semibold text-canvas-ink-muted transition-colors hover:bg-canvas-overlay hover:text-canvas-ink"
            >
              My Documents
            </button>
          )}
          <button
            type="button"
            onClick={handleNewDocument}
            className="rounded-full border border-canvas-border-strong px-3.5 py-1.5 text-sm font-semibold text-canvas-ink-muted transition-colors hover:bg-canvas-overlay hover:text-canvas-ink"
          >
            New Document
          </button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChatPanel messages={messages} onMessagesChange={setMessages} onSend={handleSend} />

          {phase.kind === "detecting" && (
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-canvas-ink-muted">Preview</h2>
              </div>
              <div className="flex h-[75vh] flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-canvas-border-strong bg-canvas-overlay-faint p-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-purple/15 text-2xl">
                  📄
                </span>
                <p className="text-sm text-canvas-ink-muted">
                  Tell the assistant what document you need, and a live preview will appear here.
                </p>
              </div>
            </div>
          )}

          {phase.kind === "generic-loading" && (
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-canvas-ink-muted">Preview</h2>
              </div>
              <div className="flex h-[75vh] items-center justify-center rounded-sm border border-dashed border-canvas-border-strong bg-canvas-overlay-faint p-8 text-sm text-canvas-ink-muted">
                Loading the document template…
              </div>
            </div>
          )}

          {phase.kind === "generic-error" && (
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-canvas-ink-muted">Preview</h2>
              </div>
              <div className="h-[75vh] rounded-sm border border-del/30 bg-del/10 p-6 text-sm text-red-300">
                Something went wrong loading this document&apos;s template. Please refresh and try again.
              </div>
            </div>
          )}

          {phase.kind === "mutual-nda" && <PreviewPanel blocks={ndaBlocks} isComplete={ndaIsComplete} />}

          {phase.kind === "generic" && (
            <PreviewPanel
              blocks={[
                ...buildGenericCoverPageBlocks(phase.documentName, phase.variables, genericFields),
                { type: "divider" },
                ...phase.bodyBlocks,
              ]}
              isComplete={genericIsComplete}
              fileName={`${slugifyFileName(phase.documentName)}.pdf`}
              documentTitle={phase.documentName}
            />
          )}
        </div>

        {user && isComplete && (
          <div className="mt-6 flex items-center justify-end gap-3">
            {saveState === "saved" && (
              <span className="text-sm font-medium text-emerald-400">Saved!</span>
            )}
            {saveState === "error" && (
              <span className="text-sm font-medium text-red-400">Could not save. Try again.</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="rounded-full bg-brand-purple px-5 py-2 text-sm font-bold text-on-brand shadow-sm transition-colors hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveState === "saving" ? "Saving…" : "Save to My Documents"}
            </button>
          </div>
        )}
      </div>

      {showMyDocuments && (
        <MyDocumentsModal onClose={() => setShowMyDocuments(false)} onLoad={handleLoadDocument} />
      )}
    </div>
  );
}
