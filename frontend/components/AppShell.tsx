"use client";

import { useState } from "react";
import UserMenu from "./UserMenu";
import DocumentCreator from "./DocumentCreator";
import UploadView from "./UploadView";
import SummaryView from "./SummaryView";
import RiskHighlightsView from "./RiskHighlightsView";
import ClauseExplanationView from "./ClauseExplanationView";
import ComparisonView from "./ComparisonView";
import ExportReportView from "./ExportReportView";
import { UploadedDocumentDetail } from "@/lib/uploads";

type ViewKey = "draft" | "upload" | "summary" | "risks" | "clauses" | "comparison" | "export";

const NAV_ITEMS: { key: ViewKey; label: string; icon: string; title: string; subtitle: string }[] = [
  {
    key: "draft",
    label: "Draft a Document",
    icon: "✏️",
    title: "Draft a Document",
    subtitle: "Chat with an AI assistant to create a new legal document from scratch.",
  },
  {
    key: "upload",
    label: "Document Upload",
    icon: "⬆️",
    title: "Document Upload",
    subtitle: "Upload your legal document and let AI simplify the complex.",
  },
  {
    key: "summary",
    label: "Summary",
    icon: "📄",
    title: "Summary",
    subtitle: "A plain-English summary of your uploaded document.",
  },
  {
    key: "risks",
    label: "Risk Highlights",
    icon: "🛡️",
    title: "Risk Highlights",
    subtitle: "Potential risks and one-sided terms AI identified in your document.",
  },
  {
    key: "clauses",
    label: "Clause Explanation",
    icon: "💬",
    title: "Clause Explanation",
    subtitle: "Every clause in your document, explained in plain English.",
  },
  {
    key: "comparison",
    label: "Comparison",
    icon: "⚖️",
    title: "Comparison",
    subtitle: "How your document compares to our closest standard template.",
  },
  {
    key: "export",
    label: "Export Report",
    icon: "⬇️",
    title: "Export Report",
    subtitle: "Download a PDF report combining all of the analysis above.",
  },
];

export default function AppShell() {
  const [activeView, setActiveView] = useState<ViewKey>("draft");
  const [selectedUpload, setSelectedUpload] = useState<UploadedDocumentDetail | null>(null);

  const activeNavItem = NAV_ITEMS.find((item) => item.key === activeView)!;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 px-4 py-6">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green text-sm font-black text-background">
            P
          </span>
          <span className="text-base font-bold tracking-tight text-ink">
            Prelegal <span className="block text-xs font-normal text-ink-muted">Document Assistant</span>
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveView(item.key)}
              aria-current={activeView === item.key ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeView === item.key
                  ? "bg-brand-green/10 text-brand-green"
                  : "text-ink-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4 sm:px-8">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-ink">{activeNavItem.title}</h1>
              <p className="text-xs text-ink-muted">{activeNavItem.subtitle}</p>
            </div>
            <UserMenu />
          </div>
        </header>

        <main className="px-6 py-8 sm:px-8">
          {activeView === "draft" && <DocumentCreator />}

          {activeView === "upload" && (
            <UploadView selectedUpload={selectedUpload} onSelectUpload={setSelectedUpload} />
          )}

          {activeView === "summary" && <SummaryView upload={selectedUpload} />}
          {activeView === "risks" && <RiskHighlightsView upload={selectedUpload} />}
          {activeView === "clauses" && <ClauseExplanationView upload={selectedUpload} />}
          {activeView === "comparison" && <ComparisonView upload={selectedUpload} />}
          {activeView === "export" && <ExportReportView upload={selectedUpload} />}
        </main>
      </div>
    </div>
  );
}
