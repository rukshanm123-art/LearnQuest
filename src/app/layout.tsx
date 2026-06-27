import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { AuthBootstrap } from "@/components/auth/AuthBootstrap";

const display = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const APP_NAME = "LearnQuest";
const DESCRIPTION =
  "LearnQuest is a playful, gamified learning adventure for Kiwi kids aged 5–14, aligned to the New Zealand Curriculum. Earn XP, collect pets, and master English, Maths, Science and more.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${APP_NAME} — Learning adventures for Kiwi kids`,
    template: `%s · ${APP_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  keywords: ["education", "New Zealand Curriculum", "kids learning", "gamified learning", "maths", "english", "te reo Māori"],
  authors: [{ name: "LearnQuest" }],
  openGraph: {
    title: `${APP_NAME} — Learning adventures for Kiwi kids`,
    description: DESCRIPTION,
    type: "website",
    locale: "en_NZ",
    siteName: APP_NAME,
  },
  twitter: { card: "summary_large_image", title: APP_NAME, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#33a1ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
