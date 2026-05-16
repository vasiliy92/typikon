'use client';

import { useState, FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

export function LoginForm() {
  const { t } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <form onSubmit={handleSubmit} className="admin-login-card">
        <h2 className="admin-login-title">
          {t.admin.login}
        </h2>

        {error && (
          <div className="admin-login-error">{error}</div>
        )}

        <div className="admin-field" style={{ marginBottom: 12 }}>
          <label>{t.admin.email}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="admin-field" style={{ marginBottom: 16 }}>
          <label>{t.admin.password}</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: 36 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              tabIndex={-1}
              aria-label={showPassword ? t.auth.hide_password : t.auth.show_password}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="admin-btn admin-btn-primary admin-login-submit"
        >
          {loading ? t.common.loading : t.admin.login_button}
        </button>
      </form>
    </div>
  );
}