import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function Probe() {
  const { user, isLoading, signIn, signOut } = useAuth();
  return (
    <div>
      <p>isLoading: {String(isLoading)}</p>
      <p>user: {user ? user.email : "none"}</p>
      <button onClick={() => signIn("alice@example.com", "password123")}>Sign in</button>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}

describe("AuthContext", () => {
  it("loads the current user from /api/auth/me on mount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(jsonResponse({ id: 1, email: "alice@example.com", created_at: "" }))
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(await screen.findByText("user: alice@example.com")).toBeInTheDocument();
  });

  it("treats a 401 from /api/auth/me as signed out, not an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(jsonResponse({ detail: "Not authenticated" }, false)));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("isLoading: false")).toBeInTheDocument());
    expect(screen.getByText("user: none")).toBeInTheDocument();
  });

  it("updates user state after signIn and clears it after signOut", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/api/auth/me")) return jsonResponse({ detail: "no" }, false);
      if (url.includes("/api/auth/signin")) {
        return jsonResponse({ id: 1, email: "alice@example.com", created_at: "" });
      }
      if (url.includes("/api/auth/signout")) return jsonResponse({});
      throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText("user: none");

    await user.click(screen.getByText("Sign in"));
    expect(await screen.findByText("user: alice@example.com")).toBeInTheDocument();

    await user.click(screen.getByText("Sign out"));
    expect(await screen.findByText("user: none")).toBeInTheDocument();
  });
});
