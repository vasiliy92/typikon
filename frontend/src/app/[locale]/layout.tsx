"use client";

import React from "react";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import "@/app/globals.css";

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <a href="/" className="text-lg font-bold tracking-tight">
          Typikon
        </a>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/fr" className="text-muted hover:text-foreground transition-colors">FR</a>
          <a href="/csy" className="text-muted hover:text-foreground transition-colors">CSY</a>
          <a href="/ru" className="text-muted hover:text-foreground transition-colors">RU</a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-foreground/10 py-6 text-center text-xs text-muted">
      © {new Date().getFullYear()} Typikon — Orthodox Liturgical Service Generator
    </footer>
  );
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale;

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <I18nProvider locale={locale}>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
                {children}
              </main>
              <Footer />
            </div>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
