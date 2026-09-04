import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppShell from "./AppShell";
import { AuthProvider } from "./AuthContext";

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AppShell", () => {
  it("starts on the Draft a Document view", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(jsonResponse({ detail: "no" }, false)));

    render(
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    );

    expect(await screen.findByPlaceholderText("Type your reply…")).toBeInTheDocument();
    expect(screen.getAllByText("Draft a Document").length).toBeGreaterThan(0);
  });

  it("switches views via the sidebar and updates the top bar title", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(jsonResponse({ detail: "no" }, false)));

    render(
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    );
    await screen.findByPlaceholderText("Type your reply…");

    await user.click(screen.getByRole("button", { name: /Document Upload/ }));
    expect(await screen.findByText("Upload your legal document and let AI simplify the complex.")).toBeInTheDocument();
    expect(screen.getByText(/Sign in.*to upload and analyze/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Risk Highlights/ }));
    expect(await screen.findByText(/Upload a document first/)).toBeInTheDocument();
  });
});
