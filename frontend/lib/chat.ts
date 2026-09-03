import { NdaFormData } from "@/lib/nda";
import { apiUrl } from "@/lib/api";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatMessageResponse = {
  reply: string;
  fields: NdaFormData;
  isComplete: boolean;
};

export const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you put together a Mutual NDA. Let's start with the basics: what's the purpose of this agreement, and who's the other company involved?",
};

export async function sendChatMessage(
  messages: ChatMessage[],
  fields: NdaFormData
): Promise<ChatMessageResponse> {
  const response = await fetch(apiUrl("/api/chat/message"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, fields }),
  });

  if (!response.ok) {
    throw new Error("The assistant is unavailable right now. Please try again.");
  }

  return response.json();
}
