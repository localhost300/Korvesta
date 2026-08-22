import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GlobalActionIndicator } from "@/components/GlobalActionIndicator";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Korvesta | Smarter Market Intelligence",
    template: "%s | Korvesta",
  },
  description:
    "Professional-grade market data, actionable insight and trading education.",
  applicationName: "Korvesta",
  openGraph: {
    type: "website",
    siteName: "Korvesta",
    title: "Korvesta | Smarter Market Intelligence",
    description:
      "Professional-grade market data, actionable insight and trading education.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <GlobalActionIndicator />
        {children}
      </body>
    </html>
  );
}
