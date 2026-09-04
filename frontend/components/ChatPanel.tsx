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
    <div className="flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-xl shadow-black/20">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                message.role === "user"
                  ? "rounded-br-sm bg-brand-green font-medium text-background"
                  : "rounded-bl-sm bg-surface-hover text-ink"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <p className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-hover px-4 py-2.5 text-sm text-ink-muted">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-green/70 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-green/70 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-green/70" />
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="border-t border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/10 bg-black/20 p-3">
        <label className="sr-only" htmlFor="chat-input">
          Message
        </label>
        <input
          id="chat-input"
          className="flex-1 rounded-full border border-white/10 bg-surface-hover px-4 py-2.5 text-sm text-ink shadow-sm transition-shadow placeholder:text-ink-muted focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply…"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-bold text-background shadow-sm transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ink-muted"
        >
          Send
        </button>
      </form>
    </div>
  );
}
