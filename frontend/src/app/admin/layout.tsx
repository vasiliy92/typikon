'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import en from '@/i18n/messages/en.json';

export type Locale = 'en' | 'fr' | 'ru';

const LocaleContext = createContext<Locale>('en');
const MessagesContext = createContext(en);

export function useLocale() { return useContext(LocaleContext); }
export function useMessages() { return useContext(MessagesContext); }

const MESSAGES: Record<Locale, typeof en> = { en, fr: en, ru: en };

async function loadMessages(locale: Locale) {
  switch (locale) {
    case 'fr': return (await import('@/i18n/messages/fr.json')).default;
    case 'ru': return (await import('@/i18n/messages/ru.json')).default;
    default: return en;
  }
}

const NAV_ITEMS = [
  { key: 'dashboard', href: '/admin' },
  { key: 'users', href: '/admin/users' },
  { key: 'saints', href: '/admin/saints' },
  { key: 'blocks', href: '/admin/blocks' },
  { key: 'templates', href: '/admin/templates' },
  { key: 'calendar', href: '/admin/calendar' },
  { key: 'import', href: '/admin/import' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>('en');
  const [messages, setMessages] = useState(en);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin-locale') as Locale | null;
    if (saved && ['en', 'fr', 'ru'].includes(saved)) {
      setLocale(saved);
    }
  }, []);

  useEffect(() => {
    loadMessages(locale).then((m) => {
      MESSAGES[locale] = m;
      setMessages(m);
    });
    localStorage.setItem('admin-locale', locale);
  }, [locale]);

  const t = (key: string) => {
    const keys = key.split('.');
    let val: any = messages;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) val = val[k];
      else return key;
    }
    return typeof val === 'string' ? val : key;
  };

  return (
    <LocaleContext.Provider value={locale}>
      <MessagesContext.Provider value={messages}>
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
          {/* Sidebar */}
          <aside className={`fixed inset-y-0 left-0 z-30 w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-lg font-bold">Typikon Admin</h1>
            </div>
            <nav className="p-2 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`admin.nav.${item.key}`)}
                </Link>
              ))}
            </nav>
            {/* Locale Switcher */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex gap-1">
                {(['en', 'fr', 'ru'] as Locale[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      locale === l
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Topbar */}
            <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h2 className="text-lg font-semibold">{t('admin.title')}</h2>
            </header>
            <main className="p-6">{children}</main>
          </div>
        </div>
      </MessagesContext.Provider>
    </LocaleContext.Provider>
  );
}
