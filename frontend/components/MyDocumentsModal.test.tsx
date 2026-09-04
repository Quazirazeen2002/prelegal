import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyDocumentsModal from "./MyDocumentsModal";
import { SavedDocument } from "@/lib/documents";

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const SAMPLE_DOC: SavedDocument = {
  id: 1,
  documentType: "csa",
  title: "Acme <> CloudCo",
  fields: { customer: "Acme" },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

describe("MyDocumentsModal", () => {
  it("lists saved documents and calls onLoad when Load is clicked", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(jsonResponse([SAMPLE_DOC])));
    const onLoad = vi.fn();

    render(<MyDocumentsModal onClose={vi.fn()} onLoad={onLoad} />);

    expect(await screen.findByText("Acme <> CloudCo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load" }));

    expect(onLoad).toHaveBeenCalledWith(SAMPLE_DOC);
  });

  it("shows an empty state when there are no saved documents", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(jsonResponse([])));

    render(<MyDocumentsModal onClose={vi.fn()} onLoad={vi.fn()} />);

    expect(await screen.findByText("You haven't saved any documents yet.")).toBeInTheDocument();
  });

  it("removes a document from the list after Delete succeeds", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") return jsonResponse({});
      return jsonResponse([SAMPLE_DOC]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MyDocumentsModal onClose={vi.fn()} onLoad={vi.fn()} />);
    await screen.findByText("Acme <> CloudCo");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.queryByText("Acme <> CloudCo")).not.toBeInTheDocument();
  });
});
