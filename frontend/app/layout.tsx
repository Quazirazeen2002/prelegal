import type { Metadata } from "next";
import { Spectral, Public_Sans } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/components/AuthContext";
import "./globals.css";

const THEME_INIT_SCRIPT = `
  try {
    var stored = localStorage.getItem("theme");
    var light = stored ? stored === "light" : !window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("light", light);
  } catch (e) {}
`;

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Legal Document Assistant",
  description:
    "Draft a legal document from scratch with an AI assistant, or upload one you already have for an instant plain-English summary, risk highlights, and clause explanations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spectral.variable} ${publicSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
