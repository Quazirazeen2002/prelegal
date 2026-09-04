import { apiUrl } from "@/lib/api";

export type User = {
  id: number;
  email: string;
  created_at: string;
};

async function parseJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || fallbackMessage);
  }
  return response.json();
}

export async function getCurrentUser(): Promise<User | null> {
  const response = await fetch(apiUrl("/api/auth/me"), { credentials: "include" });
  if (response.status === 401) return null;
  return parseJsonOrThrow<User>(response, "Could not load your account.");
}

export async function signUp(email: string, password: string): Promise<User> {
  const response = await fetch(apiUrl("/api/auth/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return parseJsonOrThrow<User>(response, "Could not create your account.");
}

export async function signIn(email: string, password: string): Promise<User> {
  const response = await fetch(apiUrl("/api/auth/signin"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return parseJsonOrThrow<User>(response, "Invalid email or password.");
}

export async function signOut(): Promise<void> {
  await fetch(apiUrl("/api/auth/signout"), { method: "POST", credentials: "include" });
}
