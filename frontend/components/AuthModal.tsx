"use client";

import { useState } from "react";
import { useAuth } from "./AuthContext";

type Props = {
  onClose: () => void;
};

export default function AuthModal({ onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-sm border border-paper-border bg-paper p-7 shadow-[0_40px_80px_-30px_rgba(1,10,24,0.65)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-paper-ink">
            {mode === "signin" ? "Sign in" : "Create an account"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-paper-ink-muted transition-colors hover:bg-paper-overlay hover:text-paper-ink"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-paper-ink-muted">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-paper-border bg-white px-3 py-2.5 text-sm text-paper-ink shadow-sm transition-shadow focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-paper-ink-muted">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-paper-border bg-white px-3 py-2.5 text-sm text-paper-ink shadow-sm transition-shadow focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-del">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand-purple px-4 py-2.5 text-sm font-bold text-on-brand shadow-sm transition-colors hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm font-medium text-brand-purple hover:underline"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
