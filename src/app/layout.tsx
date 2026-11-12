import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dispute Compass — AI Case Coach for PayPal Disputes",
  description:
    "Know where you stand. Settle smart. Escalate right. Deterministic deadline engine, evidence strength meter, settlement advisor, AI case coach and an integrity-guarded letter studio — built on the PayPal Disputes API sandbox.",
  keywords: ["PayPal", "Disputes API", "AI", "hackathon", "case coach", "deadline engine"],
  authors: [{ name: "Team AHVO" }],
  openGraph: {
    title: "Dispute Compass",
    description: "AI Case Coach for PayPal disputes — deadline engine, strength meter, settlement advisor, integrity guard.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
