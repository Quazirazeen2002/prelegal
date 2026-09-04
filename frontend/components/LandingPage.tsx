"use client";

import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";
import ThemeToggle from "./ThemeToggle";
import type { ViewKey } from "./AppShell";

const DOCUMENT_TYPES = [
  "Mutual Non-Disclosure Agreement",
  "Cloud Service Agreement",
  "Service Level Agreement",
  "Data Processing Agreement",
  "Design Partner Agreement",
  "Professional Services Agreement",
  "Partnership Agreement",
  "Business Associate Agreement",
  "Software License Agreement",
  "Pilot Agreement",
  "AI Addendum",
];

type Stage = "idle" | "resolved" | "redlined";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-bg";

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md border border-transparent bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-purple-dark ${focusRing}`}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md border border-canvas-border-strong bg-transparent px-5 py-2.5 text-sm font-semibold text-canvas-ink transition-colors hover:border-canvas-ink-muted ${focusRing}`}
    >
      {children}
    </button>
  );
}

export default function LandingPage({ onEnter }: { onEnter: (view: ViewKey) => void }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [stage, setStage] = useState<Stage>(reducedMotion ? "redlined" : "idle");

  useEffect(() => {
    if (reducedMotion) return;

    let cancelled = false;
    const timers: number[] = [];

    function playSequence() {
      setStage("idle");
      timers.push(window.setTimeout(() => !cancelled && setStage("resolved"), 1400));
      timers.push(window.setTimeout(() => !cancelled && setStage("redlined"), 2600));
    }

    playSequence();
    const interval = window.setInterval(playSequence, 8000);

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(interval);
    };
  }, [reducedMotion]);

  const termsResolved = stage === "resolved" || stage === "redlined";
  const redlined = stage === "redlined";

  return (
    <div>
      <header className="border-b border-canvas-border">
        <div className="mx-auto flex h-[76px] max-w-[1160px] items-center justify-between gap-6 px-8">
          <span className="font-serif text-[22px] font-semibold italic tracking-tight">Prelegal</span>
          <nav className="hidden gap-8 text-[14.5px] text-canvas-ink-muted sm:flex">
            <a href="#how" className={`rounded-sm hover:text-canvas-ink ${focusRing}`}>
              How it works
            </a>
            <a href="#library" className={`rounded-sm hover:text-canvas-ink ${focusRing}`}>
              Templates
            </a>
            <a href="#analyze" className={`rounded-sm hover:text-canvas-ink ${focusRing}`}>
              Analyze a document
            </a>
          </nav>
          <div className="flex items-center gap-5">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className={`rounded-sm text-[14.5px] text-canvas-ink-muted hover:text-canvas-ink ${focusRing}`}
            >
              Sign in
            </button>
            <PrimaryButton onClick={() => onEnter("draft")}>Draft a document</PrimaryButton>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-24 sm:py-28">
          <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-14 px-8 md:grid-cols-2">
            <div>
              <h1 className="font-serif text-[34px] font-medium leading-[1.12] tracking-tight text-balance sm:text-[46px]">
                Turn a conversation into a finished contract.
              </h1>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-canvas-ink-muted">
                Tell Prelegal about the deal — the parties, the purpose, the terms that matter — and watch it draft
                the agreement clause by clause, redlined into something clearer than a blank template.
              </p>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <PrimaryButton onClick={() => onEnter("draft")}>Draft a document</PrimaryButton>
                <GhostButton onClick={() => onEnter("upload")}>Upload one to review</GhostButton>
              </div>
              <p className="mt-6 text-[13.5px] text-canvas-ink-muted/85">
                No account needed to draft. Sign in only to save what you&rsquo;re working on.
              </p>
            </div>

            <div className="rotate-[0.6deg] rounded-sm border border-paper-border bg-paper px-9 py-8 font-serif text-paper-ink shadow-[0_40px_80px_-30px_rgba(1,10,24,0.65),0_2px_0_rgba(255,255,255,0.4)_inset]">
              <div className="mb-3.5 flex justify-between font-sans text-[12.5px] text-paper-ink-muted">
                <span>Mutual Non-Disclosure Agreement</span>
                <span>
                  {termsResolved ? (
                    <>Acme, Inc. ↔ Beacon Robotics, Inc.</>
                  ) : (
                    <>[Disclosing Party]</>
                  )}
                </span>
              </div>
              <h3 className="mb-4.5 border-b border-paper-border pb-3.5 text-[19px] font-semibold">Cover Page</h3>

              <div className="text-[15.5px] leading-[1.7]">
                <span className="mr-1 text-paper-ink-muted">1.</span>
                <span>
                  Confidentiality obligations run between{" "}
                  <span
                    className={`rounded-[2px] px-0.5 font-semibold transition-colors duration-500 ${
                      termsResolved ? "bg-brand-yellow/30" : ""
                    }`}
                  >
                    {termsResolved ? "Acme, Inc." : "[Disclosing Party]"}
                  </span>{" "}
                  and{" "}
                  <span
                    className={`rounded-[2px] px-0.5 font-semibold transition-colors duration-500 ${
                      termsResolved ? "bg-brand-yellow/30" : ""
                    }`}
                  >
                    {termsResolved ? "Beacon Robotics, Inc." : "[Receiving Party]"}
                  </span>
                  , for the purpose of evaluating a possible business relationship.
                </span>
              </div>

              <div className="mt-4 text-[15.5px] leading-[1.7]">
                <span className="mr-1 text-paper-ink-muted">2.</span>
                <span className={`text-del line-through decoration-[1.5px] ${redlined ? "opacity-45" : "opacity-100"}`}>
                  Either party may disclose Confidential Information to its employees on a need-to-know basis.
                </span>
                <span
                  className={`mt-1.5 block text-ins underline decoration-dotted decoration-[1.5px] transition-all duration-500 ${
                    redlined ? "max-h-24 opacity-100" : "max-h-0 overflow-hidden opacity-0"
                  }`}
                >
                  Either party may disclose Confidential Information to employees, contractors, and advisors on a
                  need-to-know basis, each bound by obligations at least as protective as this Agreement&rsquo;s.
                </span>
              </div>

              <div className="mt-5 flex justify-between border-t border-paper-border pt-3.5 font-sans text-[12.5px] text-paper-ink-muted">
                <span>Drafted with Prelegal</span>
                <span>{redlined ? "Ready to download" : termsResolved ? "Redlining for clarity…" : "Filling in terms…"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-canvas-border py-24">
          <div className="mx-auto max-w-[1160px] px-8">
            <h2 className="max-w-[20ch] font-serif text-[30px] font-medium text-balance">
              From first message to finished document, in three steps.
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-11 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Tell us the deal",
                  body: "Chat naturally about who's involved, what you're agreeing to, and any terms that matter to you.",
                },
                {
                  n: "02",
                  title: "Watch it draft",
                  body: "Fields resolve and clauses fill in as you talk, built on standard terms for the agreement type you need.",
                },
                {
                  n: "03",
                  title: "Download the document",
                  body: "Once every required term is confirmed, download a finished PDF — ready to send for signature.",
                },
              ].map((step) => (
                <div key={step.n}>
                  <div className="mb-4 border-b border-canvas-border-strong pb-3 font-serif text-[15px] text-canvas-ink-muted">
                    {step.n}
                  </div>
                  <h3 className="text-[17.5px] font-semibold">{step.title}</h3>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-canvas-ink-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Library */}
        <section id="library" className="border-t border-canvas-border py-24">
          <div className="mx-auto max-w-[1160px] px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="max-w-[16ch] font-serif text-[30px] font-medium text-balance">
                Eleven agreements, one conversation.
              </h2>
              <p className="max-w-[40ch] text-[15px] leading-relaxed text-canvas-ink-muted">
                Prelegal recognizes what you&rsquo;re asking for and drafts from the matching standard template — no
                picking the wrong form.
              </p>
            </div>
            <div className="mt-10 columns-1 gap-14 sm:columns-2">
              {DOCUMENT_TYPES.map((name, i) => (
                <div
                  key={name}
                  className="flex items-baseline gap-3.5 break-inside-avoid border-b border-canvas-border py-3.5 text-[15px]"
                >
                  <span className="w-[1.4em] shrink-0 font-serif text-[14px] text-canvas-ink-muted">
                    {i + 1}.
                  </span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Analyze */}
        <section id="analyze" className="border-t border-canvas-border py-24">
          <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-2">
            <div>
              <h2 className="max-w-[18ch] font-serif text-[28px] font-medium text-balance">
                Already have a contract? Upload it instead.
              </h2>
              <p className="mt-4.5 max-w-[44ch] text-[15.5px] leading-relaxed text-canvas-ink-muted">
                Prelegal reads the document, summarizes it in plain English, and flags terms worth a second look —
                one-sided clauses, missing protections, anything that deviates from the standard.
              </p>
              <p className="mt-4.5 max-w-[44ch] text-[15.5px] leading-relaxed text-canvas-ink-muted">
                It compares your document against the closest standard template, explains every clause, and exports
                the full analysis as a PDF report.
              </p>
              <div className="mt-6">
                <GhostButton onClick={() => onEnter("upload")}>Upload a document</GhostButton>
              </div>
            </div>

            <div className="rounded-sm bg-paper px-7 py-7 font-serif text-[15px] leading-[1.75] text-paper-ink shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]">
              <div>Either party may terminate this Agreement for any reason on 10 days&rsquo; notice.</div>
              <div className="my-1 -mx-1 rounded-r-[3px] border-l-2 border-del bg-del/10 px-3 py-1">
                Customer&rsquo;s data must be returned or destroyed within 5 days of termination, at Customer&rsquo;s
                sole expense.
              </div>
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-del/10 px-2.5 py-1 font-sans text-[12.5px] font-semibold text-del">
                <span className="h-1.5 w-1.5 rounded-full bg-del" />
                Unusually short post-termination window
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-canvas-border py-24">
          <div className="mx-auto max-w-[1160px] px-8">
            <h2 className="max-w-[18ch] font-serif text-[34px] font-medium italic text-balance">
              Start with a conversation, not a blank page.
            </h2>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <PrimaryButton onClick={() => onEnter("draft")}>Draft a document</PrimaryButton>
              <GhostButton onClick={() => onEnter("upload")}>Upload one to review</GhostButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-canvas-border py-9">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-5 px-8">
          <p className="max-w-[52ch] text-[12.5px] leading-relaxed text-canvas-ink-muted">
            Prelegal drafts and analyzes documents based on standard templates. It isn&rsquo;t a law firm and
            doesn&rsquo;t provide legal advice — review anything important with a lawyer before you sign.
          </p>
          <div className="flex gap-5 text-[13.5px] text-canvas-ink-muted">
            <a href="#how" className={`rounded-sm hover:text-canvas-ink ${focusRing}`}>
              How it works
            </a>
            <a href="#library" className={`rounded-sm hover:text-canvas-ink ${focusRing}`}>
              Templates
            </a>
            <button type="button" onClick={() => setShowAuthModal(true)} className={`rounded-sm hover:text-canvas-ink ${focusRing}`}>
              Sign in
            </button>
          </div>
        </div>
      </footer>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
