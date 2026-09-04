"use client";

import { useRef, useState } from "react";
import { ChatMessage } from "@/lib/chat";

type Props = {
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onSend: (messages: ChatMessage[]) => Promise<string>;
};

/** Controlled chat UI: the message list is owned by the parent (so it can
 * persist across a document-type transition — see DocumentCreator), while
 * this component only handles input/loading/error state and rendering. */
export default function ChatPanel({ messages, onMessagesChange, onSend }: Props) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    onMessagesChange(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const reply = await onSend(nextMessages);
      onMessagesChange([...nextMessages, { role: "assistant", content: reply }]);
    } catch {
      setError("The assistant is unavailable right now. Please try again.");
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView?.({ behavior: "smooth" }));
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-canvas-ink-muted">Assistant</h2>
        <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-canvas-overlay px-4 py-2 text-sm font-medium text-canvas-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-ins" aria-hidden="true" />
          Live
        </span>
      </div>
      <div className="flex h-[75vh] flex-col overflow-hidden rounded-sm border border-paper-border bg-paper shadow-[0_30px_60px_-28px_rgba(1,10,24,0.55)]">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  message.role === "user"
                    ? "rounded-br-sm bg-brand-purple font-medium text-on-brand"
                    : "rounded-bl-sm bg-paper-overlay text-paper-ink"
                }`}
              >
                {message.content}
              </p>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <p className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-paper-overlay px-4 py-2.5 text-sm text-paper-ink-muted">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-purple/70 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-purple/70 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-purple/70" />
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p role="alert" className="border-t border-del/20 bg-del/10 px-5 py-2.5 text-sm text-del">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-paper-border bg-paper-overlay-faint p-3">
          <label className="sr-only" htmlFor="chat-input">
            Message
          </label>
          <input
            id="chat-input"
            className="flex-1 rounded-full border border-paper-border bg-white px-4 py-2.5 text-sm text-paper-ink shadow-sm transition-shadow placeholder:text-paper-ink-muted focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your reply…"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-full bg-brand-purple px-5 py-2.5 text-sm font-bold text-on-brand shadow-sm transition-colors hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:bg-paper-overlay disabled:text-paper-ink-muted"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
