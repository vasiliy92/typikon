'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Settings, Moon, Sun, Church } from 'lucide-react';
import { Locale, localeNames, locales } from '@/i18n/config';
import fr from '@/i18n/messages/fr.json';
import csy from '@/i18n/messages/csy.json';
import { I18nProvider, type Messages } from '@/lib/i18n';

const messages: Record<Locale, Messages> = { fr, csy };

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const [dark, setDark] = useState(false);
  const currentLocale = (locales.includes(locale as Locale) ? locale : 'fr') as Locale;
  const t = messages[currentLocale];

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('typikon-theme');
    if (saved === 'dark' || (!saved && prefersDark)) {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('typikon-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const pathname = usePathname();
  const navItems = [
    { href: `/${currentLocale}`, label: t.nav.service, icon: Church },
    { href: `/${currentLocale}/admin`, label: t.nav.admin, icon: Settings },
  ];

  return (
    <I18nProvider value={{ locale: currentLocale, t }}>
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href={`/${currentLocale}`} className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                  <span className="text-white font-display font-bold text-sm">T</span>
                </div>
                <span className="font-display font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                  {t.app.title}
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href !== `/${currentLocale}` && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        active ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                      )}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                {locales.map((loc) => (
                  <Link
                    key={loc}
                    href={pathname.replace(`/${currentLocale}`, `/${loc}`)}
                    className={clsx(
                      'px-2.5 py-1 text-xs font-medium transition-all',
                      loc === currentLocale
                        ? 'text-white'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                    )}
                    style={loc === currentLocale ? { background: 'var(--primary)' } : {}}
                  >
                    {localeNames[loc]}
                  </Link>
                ))}
              </div>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg transition-all hover:bg-[var(--muted)]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* Mobile nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around py-2" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== `/${currentLocale}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-all',
                  active ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]',
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </I18nProvider>
  );
}
