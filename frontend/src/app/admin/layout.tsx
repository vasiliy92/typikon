'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LoginForm } from '@/components/LoginForm';
import { Locale } from '@/i18n/config';
import en from '@/i18n/messages/en.json';
import fr from '@/i18n/messages/fr.json';
import ru from '@/i18n/messages/ru.json';

type Messages = typeof fr;

const MESSAGE_MAP: Record<Locale, Messages> = { en: en as Messages, fr, ru };

export type AdminTab = 'dashboard' | 'calendar' | 'saints' | 'blocks' | 'templates' | 'users' | 'import';

function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [locale, setLocale] = useState<Locale>('fr');
  const [messages, setMessages] = useState<Messages>(fr);

  useEffect(() => {
    const saved = localStorage.getItem('admin-locale') as Locale | null;
    if (saved && ['en', 'fr', 'ru'].includes(saved)) {
      setLocale(saved);
      setMessages(MESSAGE_MAP[saved]);
    }
  }, []);

  const switchLocale = useCallback((l: Locale) => {
    setLocale(l);
    setMessages(MESSAGE_MAP[l]);
    localStorage.setItem('admin-locale', l);
  }, []);

  if (loading) {
    return (
      <div className="admin-content" style={{ textAlign: 'center', paddingTop: '120px' }}>
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.875rem' }}>
          …
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <I18nProvider value={{ locale, t: messages }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
          <LoginForm />
        </div>
      </I18nProvider>
    );
  }

  const t = messages.admin;

  return (
    <I18nProvider value={{ locale, t: messages }}>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <Link href="/fr" className="admin-topbar-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {messages.common.back}
            </Link>
            <span className="admin-topbar-sep">/</span>
            <span className="admin-topbar-title">{t.title}</span>
          </div>
          <div className="admin-topbar-right">
            {(['fr', 'ru', 'en'] as Locale[]).map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`admin-tab${locale === l ? ' active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.6875rem' }}
              >
                {l.toUpperCase()}
              </button>
            ))}
            <span className="admin-topbar-sep">|</span>
            <div className="admin-user-info">
              <span style={{ color: 'var(--fg-soft)' }}>{user?.display_name || user?.email}</span>
              <button className="admin-logout-btn" onClick={logout}>
                {t.logout}
              </button>
            </div>
          </div>
        </header>

        {/* Page content — children is the admin page which handles its own tabs */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </I18nProvider>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
