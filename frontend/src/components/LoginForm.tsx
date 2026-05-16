'use client';

import { useState, FormEvent } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

export function LoginForm() {
  const { t } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError(t.admin.login_error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border p-8 shadow-lg"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-2xl font-bold text-center" style={{ color: 'var(--foreground)' }}>
          {t.admin.login}
        </h2>

        {error && (
          <div className="rounded-lg px-4 py-2 text-sm" style={{ background: 'var(--destructive)/10', color: 'var(--destructive)' }}>
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {t.admin.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {t.admin.password}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {loading ? t.common.loading : t.admin.login_button}
        </button>
      </form>
    </div>
  );
}
