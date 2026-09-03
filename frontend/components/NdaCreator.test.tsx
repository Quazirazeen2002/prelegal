import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaCreator from "./NdaCreator";
import { createDefaultNdaFormData } from "@/lib/nda";

// NdaDownloadButton pulls in @react-pdf/renderer's PDFDownloadLink, which relies on
// browser-only APIs (URL.createObjectURL, web workers) that jsdom doesn't implement.
// It's covered on its own merits by NdaPdfDocument.test.tsx (actual PDF bytes) and by
// the manual test plan (real click-through in a browser); here we only need to confirm
// the rest of NdaCreator wires chat responses to the preview correctly. vi.mock calls are
// hoisted above imports by Vitest, so this applies even though NdaCreator is imported
// (and lazily loads NdaDownloadButton) above.
vi.mock("./NdaDownloadButton", () => ({
  default: () => <button>Download PDF (mock)</button>,
}));

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function sendMessage(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByPlaceholderText("Type your reply…"), text);
  await user.click(screen.getByRole("button", { name: "Send" }));
}

describe("NdaCreator", () => {
  it("reflects fields extracted from the chat in the live preview", async () => {
    const user = userEvent.setup();
    const fields = { ...createDefaultNdaFormData(), purpose: "Evaluating a joint venture." };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        jsonResponse({ reply: "Got it.", fields, isComplete: false })
      )
    );

    render(<NdaCreator />);
    await sendMessage(user, "We're evaluating a joint venture.");

    expect(
      await screen.findByText("Evaluating a joint venture.", { selector: "p" })
    ).toBeInTheDocument();
  });

  it("reflects a party's company extracted from the chat in the preview's signature table", async () => {
    const user = userEvent.setup();
    const fields = {
      ...createDefaultNdaFormData(),
      party1: { ...createDefaultNdaFormData().party1, company: "Acme, Inc." },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        jsonResponse({ reply: "Got it.", fields, isComplete: false })
      )
    );

    render(<NdaCreator />);
    await sendMessage(user, "My company is Acme, Inc.");

    expect(await screen.findByText("Acme, Inc.")).toBeInTheDocument();
  });

  it("only enables the download button once the chat marks the document complete", async () => {
    const user = userEvent.setup();
    render(<NdaCreator />);

    expect(screen.getByText("Finish the chat to enable download")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Download PDF (mock)" })).not.toBeInTheDocument();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        jsonResponse({
          reply: "All set!",
          fields: createDefaultNdaFormData(),
          isComplete: true,
        })
      )
    );
    await sendMessage(user, "Looks good, please finalize.");

    expect(await screen.findByRole("button", { name: "Download PDF (mock)" })).toBeInTheDocument();
    expect(screen.queryByText("Finish the chat to enable download")).not.toBeInTheDocument();
  });
});
