"use client";

import { useRef, useState } from "react";
import { NdaFormData } from "@/lib/nda";
import { ChatMessage, INITIAL_ASSISTANT_MESSAGE, sendChatMessage } from "@/lib/chat";

type Props = {
  fields: NdaFormData;
  onFieldsChange: (fields: NdaFormData) => void;
  onCompleteChange: (isComplete: boolean) => void;
};

export default function NdaChat({ fields, onFieldsChange, onCompleteChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const result = await sendChatMessage(nextMessages, fields);
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
      onFieldsChange(result.fields);
      onCompleteChange(result.isComplete);
    } catch {
      setError("The assistant is unavailable right now. Please try again.");
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  return (
    <div className="flex h-[80vh] flex-col rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-800"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
              Thinking…
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-200 p-3">
        <label className="sr-only" htmlFor="chat-input">
          Message
        </label>
        <input
          id="chat-input"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply…"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}
