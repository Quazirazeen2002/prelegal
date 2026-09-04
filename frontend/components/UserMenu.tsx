"use client";

import { useState } from "react";
import { useAuth } from "./AuthContext";
import AuthModal from "./AuthModal";

type Props = {
  onOpenMyDocuments: () => void;
};

export default function UserMenu({ onOpenMyDocuments }: Props) {
  const { user, signOut, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isLoading) return null;

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="rounded-full bg-brand-green px-4 py-1.5 text-sm font-bold text-background shadow-sm transition-colors hover:bg-brand-green-dark"
        >
          Sign in
        </button>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <button
        type="button"
        onClick={onOpenMyDocuments}
        className="font-medium text-white/90 transition-colors hover:text-white hover:underline"
      >
        My Documents
      </button>
      <span className="hidden text-white/50 sm:inline">{user.email}</span>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-full border border-white/25 px-3 py-1.5 font-medium text-white/90 transition-colors hover:bg-white/10"
      >
        Sign out
      </button>
    </div>
  );
}
