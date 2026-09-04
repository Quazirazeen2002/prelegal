import { ChatMessage } from "@/lib/chat";
import { apiUrl } from "@/lib/api";

export type DetectDocumentTypeResponse = {
  reply: string;
  documentType: string | null;
};

export async function detectDocumentType(
  messages: ChatMessage[]
): Promise<DetectDocumentTypeResponse> {
  const response = await fetch(apiUrl("/api/chat/detect-document-type"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error("The assistant is unavailable right now. Please try again.");
  }

  return response.json();
}

export type GenericChatResponse = {
  reply: string;
  fields: Record<string, string>;
  isComplete: boolean;
};

export async function sendGenericMessage(
  messages: ChatMessage[],
  documentType: string,
  variables: string[],
  fields: Record<string, string>
): Promise<GenericChatResponse> {
  const response = await fetch(apiUrl("/api/chat/generic-message"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, documentType, variables, fields }),
  });

  if (!response.ok) {
    throw new Error("The assistant is unavailable right now. Please try again.");
  }

  return response.json();
}
