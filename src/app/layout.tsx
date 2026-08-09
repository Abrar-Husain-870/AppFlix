import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import PwaRegister from "@/components/pwa/PwaRegister";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#E50914",
};

export const metadata: Metadata = {
  title: {
    default: "AppFlix — Student App Showcase",
    template: "%s | AppFlix",
  },
  description:
    "Discover and showcase student-built apps, tools, and digital projects. The app store for university innovation.",
  keywords: ["student apps", "university apps", "app showcase", "student developers"],
  authors: [{ name: "AppFlix" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AppFlix",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "AppFlix — Student App Showcase",
    description:
      "Discover and showcase student-built apps, tools, and digital projects.",
    siteName: "AppFlix",
  },
  twitter: {
    card: "summary_large_image",
    title: "AppFlix — Student App Showcase",
    description:
      "Discover and showcase student-built apps, tools, and digital projects.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "font-sans", geist.variable)} suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: "#141414", color: "#FFFFFF" }}
        suppressHydrationWarning
      >
        <PwaRegister />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
