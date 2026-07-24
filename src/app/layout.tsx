import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "AppFlix — Student Project Showcase",
    template: "%s | AppFlix",
  },
  description:
    "Discover and showcase student-built apps, tools, and digital projects. The Product Hunt for university innovation.",
  keywords: ["student projects", "university apps", "project showcase", "student developers"],
  authors: [{ name: "AppFlix" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "AppFlix — Student Project Showcase",
    description:
      "Discover and showcase student-built apps, tools, and digital projects.",
    siteName: "AppFlix",
  },
  twitter: {
    card: "summary_large_image",
    title: "AppFlix — Student Project Showcase",
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
    <html lang="en" className={cn("h-full", "antialiased", "font-sans", geist.variable)}>
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: "#141414", color: "#FFFFFF" }}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}

