import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Knowledge Base",
  description: "Internal IT documentation — technical guides, system configuration, and compliance policies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
