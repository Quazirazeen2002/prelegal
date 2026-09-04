"use client";

import { useState } from "react";
import AppShell, { ViewKey } from "@/components/AppShell";
import LandingPage from "@/components/LandingPage";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [entered, setEntered] = useState<ViewKey | null>(null);

  if (isLoading) return null;

  if (!user && !entered) {
    return <LandingPage onEnter={setEntered} />;
  }

  return <AppShell initialView={entered ?? "draft"} />;
}
