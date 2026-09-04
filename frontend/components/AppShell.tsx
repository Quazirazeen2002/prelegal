"use client";

import { useState } from "react";
import UserMenu from "./UserMenu";
import ThemeToggle from "./ThemeToggle";
import DocumentCreator from "./DocumentCreator";
import UploadView from "./UploadView";
import SummaryView from "./SummaryView";
import RiskHighlightsView from "./RiskHighlightsView";
import ClauseExplanationView from "./ClauseExplanationView";
import ComparisonView from "./ComparisonView";
import ExportReportView from "./ExportReportView";
import { UploadedDocumentDetail } from "@/lib/uploads";

export type ViewKey = "draft" | "upload" | "summary" | "risks" | "clauses" | "comparison" | "export";

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

export default function AppShell({ initialView = "draft" }: { initialView?: ViewKey }) {
  const [activeView, setActiveView] = useState<ViewKey>(initialView);
  const [selectedUpload, setSelectedUpload] = useState<UploadedDocumentDetail | null>(null);

  const activeNavItem = NAV_ITEMS.find((item) => item.key === activeView)!;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-canvas-border px-4 py-6">
        <div className="mb-8 px-2">
          <span className="font-serif text-lg font-semibold italic tracking-tight text-canvas-ink">
            Prelegal
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-canvas-ink-muted">
            Draft new legal agreements, or upload one for instant AI analysis.
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveView(item.key)}
              aria-current={activeView === item.key ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeView === item.key
                  ? "bg-brand-purple/25 text-canvas-ink"
                  : "text-canvas-ink-muted hover:bg-canvas-overlay-faint hover:text-canvas-ink"
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="border-b border-canvas-border">
          <div className="flex items-center justify-between px-6 py-4 sm:px-8">
            <div>
              <h1 className="font-serif text-lg font-medium tracking-tight text-canvas-ink">{activeNavItem.title}</h1>
              <p className="text-xs text-canvas-ink-muted">{activeNavItem.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Every view stays mounted and is only hidden (not unmounted) when
            inactive, so switching tabs never loses in-progress state — a
            half-drafted document or the currently selected upload. */}
        <main className="px-6 py-8 sm:px-8">
          <div className={activeView === "draft" ? "" : "hidden"}>
            <DocumentCreator />
          </div>
          <div className={activeView === "upload" ? "" : "hidden"}>
            <UploadView selectedUpload={selectedUpload} onSelectUpload={setSelectedUpload} />
          </div>
          <div className={activeView === "summary" ? "" : "hidden"}>
            <SummaryView upload={selectedUpload} />
          </div>
          <div className={activeView === "risks" ? "" : "hidden"}>
            <RiskHighlightsView upload={selectedUpload} />
          </div>
          <div className={activeView === "clauses" ? "" : "hidden"}>
            <ClauseExplanationView upload={selectedUpload} />
          </div>
          <div className={activeView === "comparison" ? "" : "hidden"}>
            <ComparisonView upload={selectedUpload} />
          </div>
          <div className={activeView === "export" ? "" : "hidden"}>
            <ExportReportView upload={selectedUpload} />
          </div>
        </main>
      </div>
    </div>
  );
}
