"use client";

// No React state here on purpose: deriving an "isLight" value from the DOM
// during render is unreliable across server/client hydration (the server has
// no `document`, so it always computes the opposite of whatever the
// blocking theme-init script already set on the client, producing a stale
// icon that hydration won't correct). Instead, both icons are always in the
// DOM and Tailwind's `light:` variant — plain CSS, unaffected by hydration —
// decides which one is visible.
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
}

export default function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-canvas-border text-base transition-colors hover:bg-canvas-overlay"
    >
      <span className="light:hidden">☀️</span>
      <span className="hidden light:inline">🌙</span>
    </button>
  );
}
