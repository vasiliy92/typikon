'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LoginForm } from '@/components/LoginForm';
import { AdminTabContext } from '@/lib/admin-tab';
import type { AdminTab } from '@/lib/admin-tab';
import { Locale } from '@/i18n/config';
import en from '@/i18n/messages/en.json';
import fr from '@/i18n/messages/fr.json';
import ru from '@/i18n/messages/ru.json';

type Messages = typeof fr;

const MESSAGE_MAP: Record<Locale, Messages> = { en: en as Messages, fr, ru };

// SVG icons for sidebar items (no emojis)
const ICONS: Record<AdminTab, ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  saints: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 2L14.5 9H22L16 13.5L18 21L12 17L6 21L8 13.5L2 9H9.5L12 2Z" />
    </svg>
  ),
  blocks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  ),
  templates: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  import: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [locale, setLocale] = useState<Locale>('fr');
  const [messages, setMessages] = useState<Messages>(fr);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
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
  const userInitial = (user?.display_name || user?.email || '?')[0].toUpperCase();

  const tabKeys: AdminTab[] = ['dashboard', 'calendar', 'saints', 'blocks', 'templates', 'users', 'import'];

  return (
    <I18nProvider value={{ locale, t: messages }}>
      <AdminTabContext.Provider value={{ activeTab, setActiveTab }}>
        <div className="admin-shell">
          {/* Sidebar */}
          <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
              <Link href="/fr" className="admin-sidebar-brand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
                <div>
                  <div className="admin-sidebar-title">Typikon</div>
                  <div className="admin-sidebar-subtitle">Administration</div>
                </div>
              </Link>
            </div>

            <nav className="admin-sidebar-nav">
              <div className="admin-sidebar-section-label">Navigation</div>
              {tabKeys.map((key) => (
                <button
                  key={key}
                  className={`admin-sidebar-item${activeTab === key ? ' active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  {ICONS[key]}
                  {t[key as keyof typeof t] as string}
                </button>
              ))}
            </nav>

            <div className="admin-sidebar-footer">
              <div className="admin-sidebar-user">
                <div className="admin-sidebar-avatar">{userInitial}</div>
                <div className="admin-sidebar-user-info">
                  <div className="admin-sidebar-user-name">{user?.display_name || user?.email}</div>
                  <div className="admin-sidebar-user-email">{user?.email}</div>
                </div>
              </div>
              <button className="admin-sidebar-logout" onClick={logout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t.logout}
              </button>
            </div>
          </aside>

          {/* Main area */}
          <div className="admin-main">
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
                <span className="admin-topbar-title">{t[activeTab as keyof typeof t] as string}</span>
              </div>
              <div className="admin-topbar-right">
                <div className="admin-lang-switcher">
                  {(['fr', 'ru', 'en'] as Locale[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => switchLocale(l)}
                      className={`admin-lang-pill${locale === l ? ' active' : ''}`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="admin-content">
              {children}
            </main>
          </div>
        </div>
      </AdminTabContext.Provider>
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