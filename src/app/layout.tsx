import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LMS - School Management System",
  description: "Comprehensive school management system for managing schools, students, teachers, and classes",
};

import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader
          color="#10b981"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #10b981, 0 0 5px #10b981"
        />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
