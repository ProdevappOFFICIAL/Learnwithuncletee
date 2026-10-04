import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Updated import
import "./globals.css";
import { SidebarProvider } from "@/context/SidebarContext";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from 'sonner';

// Configure Inter with preferred weights and CSS variable
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.learningdeck.online'),
  title: {
    default: "LearningDeck | #1 Offline CBT & Hybrid Exam Manager",
    template: "%s | LearningDeck",
  },
  description: "The ultimate alternative to legacy PHP/SQL exam systems. LearningDeck is a high-performance offline exam manager and CBT platform designed for modern hybrid education. Secure, scalable, and intelligent.",
  keywords: [
    "LearningDeck",
    "learning",
    "offline exam manager",
    "cbt exam manager",
    "hybrid exam",
    "alternative to php sql exams",
    "educational management system",
    "computer based testing platform",
    "automated exam grading",
    "school management software",
  ],
  authors: [{ name: "LearningDeck Team" }],
  creator: "LearningDeck",
  publisher: "LearningDeck",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/learningdeck-icon.png",
    shortcut: "/learningdeck-icon.png",
    apple: "/learningdeck-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://learningdeck.online", // Adjust if domain is different
    siteName: "LearningDeck",
    title: "LearningDeck | Intelligent Exam Management",
    description: "Modernize your examination process with LearningDeck. The leading offline and hybrid CBT manager.",
    images: [
      {
        url: "/og-image.png", // Assuming an OG image might exist or should be added
        width: 1200,
        height: 630,
        alt: "LearningDeck - Modern Exam Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LearningDeck | The Future of CBT Exams",
    description: "Stop relying on outdated PHP/SQL systems. Switch to LearningDeck for secure, offline-first exam management.",
    creator: "@learningdeckorg",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col bg-[#E9EDF7]">
        <QueryProvider>
          <SidebarProvider>
            {children}
            <Toaster richColors position="top-right" />
          </SidebarProvider>
        </QueryProvider>
      </body>
    </html>
  );
}