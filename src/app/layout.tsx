import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "@/app/providers";
import { THEME_SCRIPT } from "@/components/theme/theme-script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Lawris — AI Legal Workflow Assistant",
  description:
    "Modern case management, AI-assisted drafting, and case-grounded legal research for Indian advocates.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets html.dark before paint to prevent theme flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="system"
        />
      </body>
    </html>
  );
}
