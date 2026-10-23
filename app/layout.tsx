import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLIENTESE",
  description: "Turn scattered client feedback into prioritized design tasks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
