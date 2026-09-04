"use client";

import { useState } from "react";
import { useAuth } from "./AuthContext";
import AuthModal from "./AuthModal";

export default function UserMenu() {
  const { user, signOut, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isLoading) return null;

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="rounded-full bg-brand-purple px-4 py-1.5 text-sm font-bold text-on-brand shadow-sm transition-colors hover:bg-brand-purple-dark"
        >
          Sign in
        </button>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="hidden text-canvas-ink-muted sm:inline">{user.email}</span>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-full border border-canvas-border-strong px-3 py-1.5 font-medium text-canvas-ink-muted transition-colors hover:bg-canvas-overlay hover:text-canvas-ink"
      >
        Sign out
      </button>
    </div>
  );
}
