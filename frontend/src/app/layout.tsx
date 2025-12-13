import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header, Footer, Sidebar } from "@/components/layout";
import { LoginModal, RegisterModal, SubmitFeedModal } from "@/components/auth";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FeedPulse - Community RSS Feed Discovery",
  description: "Discover, share, and curate the best RSS feeds with the community. AI-powered categorization and community-driven curation.",
  keywords: ["RSS", "feeds", "discovery", "community", "curation", "news"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 flex">
            <Sidebar />
            <main className="flex-1">{children}</main>
          </div>
          <Footer />
        </div>
        <LoginModal />
        <RegisterModal />
        <SubmitFeedModal />
        <Toaster />
      </body>
    </html>
  );
}
