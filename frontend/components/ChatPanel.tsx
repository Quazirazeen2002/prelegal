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
    <div className="flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-lg shadow-slate-900/5">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                message.role === "user"
                  ? "rounded-br-sm bg-brand-blue text-white"
                  : "rounded-bl-sm bg-slate-100 text-slate-800"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <p className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-brand-gray">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-gray/60 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-gray/60 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-gray/60" />
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="border-t border-red-200 bg-red-50 px-5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 bg-slate-50/60 p-3">
        <label className="sr-only" htmlFor="chat-input">
          Message
        </label>
        <input
          id="chat-input"
          className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-shadow focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply…"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}
