import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserMenu from "./UserMenu";
import { AuthProvider } from "./AuthContext";

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UserMenu", () => {
  it("shows a Sign in button when signed out, which opens the auth modal", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(jsonResponse({ detail: "no" }, false)));

    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    );

    const signInButton = await screen.findByRole("button", { name: "Sign in" });
    await user.click(signInButton);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the user's email and a Sign out button when signed in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(jsonResponse({ id: 1, email: "alice@example.com", created_at: "" }))
    );

    render(
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    );

    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
