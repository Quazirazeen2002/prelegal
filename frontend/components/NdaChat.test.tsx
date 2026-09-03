import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaChat from "./NdaChat";
import { createDefaultNdaFormData } from "@/lib/nda";
import { INITIAL_ASSISTANT_MESSAGE } from "@/lib/chat";

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NdaChat", () => {
  it("shows the initial assistant greeting", () => {
    render(
      <NdaChat
        fields={createDefaultNdaFormData()}
        onFieldsChange={vi.fn()}
        onCompleteChange={vi.fn()}
      />
    );

    expect(screen.getByText(INITIAL_ASSISTANT_MESSAGE.content)).toBeInTheDocument();
  });

  it("sends the message history and current fields, then reports the assistant's reply and extracted fields", async () => {
    const user = userEvent.setup();
    const fields = createDefaultNdaFormData();
    const fetchMock = vi.fn().mockReturnValue(
      jsonResponse({
        reply: "Got it, what's the effective date?",
        fields: { ...fields, purpose: "Evaluating a joint venture." },
        isComplete: false,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const onFieldsChange = vi.fn();
    const onCompleteChange = vi.fn();
    render(
      <NdaChat fields={fields} onFieldsChange={onFieldsChange} onCompleteChange={onCompleteChange} />
    );

    await user.type(screen.getByPlaceholderText("Type your reply…"), "We're evaluating a joint venture.");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Got it, what's the effective date?")).toBeInTheDocument();
    expect(screen.getByText("We're evaluating a joint venture.")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/chat/message");
    const body = JSON.parse(init.body);
    expect(body.fields).toEqual(fields);
    expect(body.messages).toEqual([
      INITIAL_ASSISTANT_MESSAGE,
      { role: "user", content: "We're evaluating a joint venture." },
    ]);

    await waitFor(() =>
      expect(onFieldsChange).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: "Evaluating a joint venture." })
      )
    );
    expect(onCompleteChange).toHaveBeenCalledWith(false);
  });

  it("shows an error and leaves the user's message in place when the request fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(jsonResponse({}, false))
    );

    render(
      <NdaChat
        fields={createDefaultNdaFormData()}
        onFieldsChange={vi.fn()}
        onCompleteChange={vi.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText("Type your reply…"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The assistant is unavailable right now. Please try again."
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("does not submit an empty or whitespace-only message", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <NdaChat
        fields={createDefaultNdaFormData()}
        onFieldsChange={vi.fn()}
        onCompleteChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Type your reply…"), "   ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
