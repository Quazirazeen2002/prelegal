import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentCreator from "./DocumentCreator";
import { AuthProvider } from "./AuthContext";

// See NdaCreator.test.tsx's historical note (removed with NdaCreator itself):
// NdaDownloadButton pulls in @react-pdf/renderer browser-only APIs jsdom
// doesn't implement; it's covered on its own merits elsewhere.
vi.mock("./NdaDownloadButton", () => ({
  default: () => <button>Download PDF (mock)</button>,
}));

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

function textResponse(body: string, ok = true) {
  return Promise.resolve({ ok, text: () => Promise.resolve(body) } as Response);
}

// Every test drafts anonymously, so /api/auth/me always resolves as signed-out.
function withAnonymousAuth(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  return (url: string, init?: RequestInit) => {
    if (url.includes("/api/auth/me")) {
      return jsonResponse({ detail: "Not authenticated" }, false);
    }
    return handler(url, init);
  };
}

const SIGNED_IN_USER = { id: 1, email: "alice@example.com", created_at: "" };

function withSignedInAuth(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  return (url: string, init?: RequestInit) => {
    if (url.includes("/api/auth/me")) {
      return jsonResponse(SIGNED_IN_USER);
    }
    return handler(url, init);
  };
}

function renderDocumentCreator() {
  return render(
    <AuthProvider>
      <DocumentCreator />
    </AuthProvider>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function sendMessage(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByPlaceholderText("Type your reply…"), text);
  await user.click(screen.getByRole("button", { name: "Send" }));
}

describe("DocumentCreator", () => {
  it("routes to the Mutual NDA flow and reflects extracted fields in the live preview", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(
      withAnonymousAuth((url: string) => {
        if (url.includes("/api/chat/detect-document-type")) {
          return jsonResponse({ reply: "Great, let's set up a Mutual NDA.", documentType: "mutual-nda" });
        }
        throw new Error(`unexpected fetch: ${url}`);
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderDocumentCreator();
    await sendMessage(user, "I need an NDA");

    expect(await screen.findByText("Great, let's set up a Mutual NDA.")).toBeInTheDocument();
    expect(screen.getByText("Finish the chat to enable download")).toBeInTheDocument();

    // Second turn now goes to the NDA-specific endpoint.
    fetchMock.mockImplementation(
      withAnonymousAuth((url: string) => {
        if (url.includes("/api/chat/message")) {
          const fields = {
            purpose: "Evaluating a joint venture.",
            effectiveDate: "2026-09-03",
            mndaTermType: "expires",
            mndaTermYears: 1,
            confidentialityTermType: "term",
            confidentialityTermYears: 1,
            governingLaw: "",
            jurisdiction: "",
            modifications: "",
            party1: { company: "", printName: "", title: "", noticeAddress: "" },
            party2: { company: "", printName: "", title: "", noticeAddress: "" },
          };
          return jsonResponse({ reply: "Got it.", fields, isComplete: false });
        }
        throw new Error(`unexpected fetch: ${url}`);
      })
    );
    await sendMessage(user, "We're evaluating a joint venture.");

    expect(
      await screen.findByText("Evaluating a joint venture.", { selector: "p" })
    ).toBeInTheDocument();
  });

  it("routes to the generic document flow, fetches its template, and shows the auto-generated cover page", async () => {
    const user = userEvent.setup();
    const csaMarkdown = [
      "# Cloud Service Agreement",
      "",
      '1. <span class="header_2">Service</span>',
      '    1. <span class="header_3">Access.</span>  <span class="coverpage_link">Customer</span> may access the Cloud Service.',
    ].join("\n");

    const fetchMock = vi.fn(
      withAnonymousAuth((url: string) => {
        if (url.includes("/api/chat/detect-document-type")) {
          return jsonResponse({
            reply: "Let's set up a Cloud Service Agreement.",
            documentType: "csa",
          });
        }
        if (url.includes("/templates/csa.md")) {
          return textResponse(csaMarkdown);
        }
        throw new Error(`unexpected fetch: ${url}`);
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderDocumentCreator();
    await sendMessage(user, "We're onboarding a cloud vendor.");

    expect(await screen.findByText("Let's set up a Cloud Service Agreement.")).toBeInTheDocument();
    // The auto-generated cover page lists the discovered variable with its placeholder.
    expect(await screen.findByText(/\[Fill in Customer\]/)).toBeInTheDocument();
    expect(screen.getAllByText("Cloud Service Agreement").length).toBeGreaterThan(0);

    fetchMock.mockImplementation(
      withAnonymousAuth((url: string) => {
        if (url.includes("/api/chat/generic-message")) {
          return jsonResponse({
            reply: "Got it.",
            fields: { customer: "Acme, Inc." },
            isComplete: false,
          });
        }
        throw new Error(`unexpected fetch: ${url}`);
      })
    );
    await sendMessage(user, "Our company is Acme, Inc.");

    expect(await screen.findByText("Acme, Inc.")).toBeInTheDocument();
  });

  it("only enables the download button once the model marks the generic document complete", async () => {
    const user = userEvent.setup();
    const csaMarkdown = '# Cloud Service Agreement\n\n1. <span class="coverpage_link">Customer</span> only.';

    const fetchMock = vi.fn(
      withAnonymousAuth((url: string) => {
        if (url.includes("/api/chat/detect-document-type")) {
          return jsonResponse({ reply: "Sure.", documentType: "csa" });
        }
        if (url.includes("/templates/csa.md")) {
          return textResponse(csaMarkdown);
        }
        throw new Error(`unexpected fetch: ${url}`);
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderDocumentCreator();
    await sendMessage(user, "cloud vendor agreement");
    await screen.findByText("Sure.");

    expect(screen.getByText("Finish the chat to enable download")).toBeInTheDocument();

    fetchMock.mockImplementation(
      withAnonymousAuth((url: string) => {
        if (url.includes("/api/chat/generic-message")) {
          return jsonResponse({ reply: "All set!", fields: { customer: "Acme" }, isComplete: true });
        }
        throw new Error(`unexpected fetch: ${url}`);
      })
    );
    await sendMessage(user, "Acme, please finalize.");

    expect(await screen.findByRole("button", { name: "Download PDF (mock)" })).toBeInTheDocument();
  });

  it("shows a Save button once signed in and complete, and posts the document on click", async () => {
    const user = userEvent.setup();
    let savedBody: Record<string, unknown> | null = null;
    const fetchMock = vi.fn(
      withSignedInAuth((url: string, init?: RequestInit) => {
        if (url.includes("/api/chat/detect-document-type")) {
          return jsonResponse({ reply: "Sure.", documentType: "mutual-nda" });
        }
        if (url.includes("/api/chat/message")) {
          const fields = {
            purpose: "Evaluating a joint venture.",
            effectiveDate: "2026-09-03",
            mndaTermType: "expires",
            mndaTermYears: 1,
            confidentialityTermType: "term",
            confidentialityTermYears: 1,
            governingLaw: "",
            jurisdiction: "",
            modifications: "",
            party1: { company: "Acme, Inc.", printName: "Jane", title: "", noticeAddress: "" },
            party2: { company: "Globex", printName: "John", title: "", noticeAddress: "" },
          };
          return jsonResponse({ reply: "All set!", fields, isComplete: true });
        }
        if (url.includes("/api/documents") && init?.method === "POST") {
          savedBody = JSON.parse(init.body as string);
          return jsonResponse({ id: 1, ...savedBody, createdAt: "", updatedAt: "" });
        }
        throw new Error(`unexpected fetch: ${url}`);
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderDocumentCreator();
    await sendMessage(user, "I need an NDA");
    await screen.findByText("Sure.");
    await sendMessage(user, "Looks good, finalize.");

    const saveButton = await screen.findByRole("button", { name: "Save to My Documents" });
    await user.click(saveButton);

    expect(await screen.findByText("Saved!")).toBeInTheDocument();
    expect(savedBody).toMatchObject({
      documentType: "mutual-nda",
      title: "Acme, Inc. <> Globex NDA",
    });
  });

  it("restores a saved generic document's fields and marks it complete when loaded", async () => {
    const user = userEvent.setup();
    const csaMarkdown = '# Cloud Service Agreement\n\n1. <span class="coverpage_link">Customer</span> only.';
    const savedDoc = {
      id: 7,
      documentType: "csa",
      title: "Acme <> CloudCo",
      fields: { customer: "Acme, Inc." },
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    };

    const fetchMock = vi.fn(
      withSignedInAuth((url: string) => {
        if (url.includes("/api/documents")) return jsonResponse([savedDoc]);
        if (url.includes("/templates/csa.md")) return textResponse(csaMarkdown);
        throw new Error(`unexpected fetch: ${url}`);
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderDocumentCreator();
    await user.click(await screen.findByRole("button", { name: "My Documents" }));
    await user.click(await screen.findByRole("button", { name: "Load" }));

    expect(await screen.findByText("Acme, Inc.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Download PDF (mock)" })).toBeInTheDocument();
  });

  it("updates the loaded document in place on re-save, instead of creating a duplicate", async () => {
    const user = userEvent.setup();
    const csaMarkdown = '# Cloud Service Agreement\n\n1. <span class="coverpage_link">Customer</span> only.';
    const savedDoc = {
      id: 7,
      documentType: "csa",
      title: "Acme <> CloudCo",
      fields: { customer: "Acme, Inc." },
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    };
    let putCalled = false;
    let postCalled = false;

    const fetchMock = vi.fn(
      withSignedInAuth((url: string, init?: RequestInit) => {
        if (url.includes("/templates/csa.md")) return textResponse(csaMarkdown);
        if (url.endsWith("/api/documents/7")) {
          putCalled = true;
          return jsonResponse({ ...savedDoc, id: 7 });
        }
        if (url.endsWith("/api/documents") && init?.method === "POST") {
          postCalled = true;
          return jsonResponse({ id: 999 });
        }
        if (url.endsWith("/api/documents")) return jsonResponse([savedDoc]);
        throw new Error(`unexpected fetch: ${url}`);
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderDocumentCreator();
    await user.click(await screen.findByRole("button", { name: "My Documents" }));
    await user.click(await screen.findByRole("button", { name: "Load" }));
    await screen.findByText("Acme, Inc.");

    await user.click(await screen.findByRole("button", { name: "Save to My Documents" }));

    expect(await screen.findByText("Saved!")).toBeInTheDocument();
    expect(putCalled).toBe(true);
    expect(postCalled).toBe(false);
  });
});
