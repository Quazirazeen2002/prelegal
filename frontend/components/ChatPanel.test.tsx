import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "./ChatPanel";
import { ChatMessage } from "@/lib/chat";

function Harness({ onSend }: { onSend: (messages: ChatMessage[]) => Promise<string> }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi there!" },
  ]);
  return <ChatPanel messages={messages} onMessagesChange={setMessages} onSend={onSend} />;
}

describe("ChatPanel", () => {
  it("renders the seeded messages", () => {
    render(<Harness onSend={vi.fn()} />);
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("sends the full message history (including the new user message) to onSend", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue("Got it!");
    render(<Harness onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Type your reply…"), "Hello there");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith([
      { role: "assistant", content: "Hi there!" },
      { role: "user", content: "Hello there" },
    ]);
    expect(await screen.findByText("Got it!")).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("shows an error and keeps the user's message when onSend rejects", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockRejectedValue(new Error("boom"));
    render(<Harness onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Type your reply…"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The assistant is unavailable right now. Please try again."
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("does not submit an empty or whitespace-only message", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Type your reply…"), "   ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).not.toHaveBeenCalled();
  });
});
