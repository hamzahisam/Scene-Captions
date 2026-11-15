import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { StudyProvider } from "@/components/study-context";

/*
 * Fonts are self-hosted (OFL 1.1, licences in src/fonts/) with next/font/local,
 * so builds never need to reach Google Fonts. Files come from the Fontsource
 * variable packages (latin subset). Captions do not use these faces.
 */
const display = localFont({
  src: "../fonts/anybody-latin-variable.woff2",
  variable: "--font-display",
  weight: "100 900",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "50% 150%" }],
  fallback: ["system-ui", "sans-serif"],
});
const text = localFont({
  src: [
    { path: "../fonts/atkinson-hyperlegible-next-latin-variable.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/atkinson-hyperlegible-next-latin-variable-italic.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-text",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  title: "SceneCaptions — Stay in the story",
  description: "A research prototype for viewer-controlled, personalized non-speech captions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <StudyProvider>{children}</StudyProvider>
      </body>
    </html>
  );
}
