'use client';

import { useState, useEffect } from 'react';
import { Header } from './header';
import { Footer } from './footer';
import { Sidebar } from './sidebar';
import { LoginModal, RegisterModal, SubmitFeedModal } from '@/components/auth';
import { AuthProvider } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/prerendering, render a minimal shell
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="h-16 border-b bg-background/95" />
        <div className="flex-1 flex">
          <main className="flex-1">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
