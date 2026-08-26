import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GlobalActionIndicator } from "@/components/GlobalActionIndicator";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Korvesta | Bonds, Treasuries & ETFs",
    template: "%s | Korvesta",
  },
  description:
    "Clear research and education for Treasury bonds, fixed income and ETFs.",
  applicationName: "Korvesta",
  openGraph: {
    type: "website",
    siteName: "Korvesta",
    title: "Korvesta | Bonds, Treasuries & ETFs",
    description:
      "Clear research and education for Treasury bonds, fixed income and ETFs.",
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
