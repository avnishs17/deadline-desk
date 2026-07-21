import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deadline Desk",
  description: "Human-verified return, warranty, renewal, and cancellation deadline tracking from purchase documents."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
