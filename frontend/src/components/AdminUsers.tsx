'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'admin';
  created_at: string;
}

export function AdminUsers() {
  const { t } = useI18n();
  const { isSuperadmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin'>('admin');

  if (!isSuperadmin) return null;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ users: User[] }>('/auth/users');
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      await apiPost('/auth/users', { email: newEmail, password: newPassword, role: newRole });
      setNewEmail('');
      setNewPassword('');
      setShowCreate(false);
      loadUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm(t.app.confirm_delete)) return;
    try {
      await apiDelete(`/auth/users/${id}`);
      loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          {t.admin.users}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            {loading ? t.common.loading : t.admin.search}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 text-sm rounded-lg text-white transition-colors"
            style={{ background: 'var(--primary)' }}
          >
            {t.admin.create_user}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="mb-4 p-4 rounded-lg" style={{ background: 'var(--muted)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="email"
              placeholder={t.admin.email}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
            />
            <input
              type="password"
              placeholder={t.admin.password}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
            />
            <div className="flex gap-2">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin')}
                className="px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
              >
                <option value="admin">{t.admin.role_admin}</option>
              </select>
              <button
                onClick={createUser}
                className="px-3 py-2 text-white text-sm rounded-lg"
                style={{ background: 'var(--primary)' }}
              >
                {t.admin.save}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-2 text-sm rounded-lg"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {t.admin.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {users.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="text-left py-2" style={{ color: 'var(--muted-foreground)' }}>{t.admin.email}</th>
              <th className="text-left py-2" style={{ color: 'var(--muted-foreground)' }}>Role</th>
              <th className="text-right py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2" style={{ color: 'var(--foreground)' }}>{u.email}</td>
                <td className="py-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: u.role === 'superadmin' ? 'var(--primary)/15' : 'var(--muted)',
                      color: u.role === 'superadmin' ? 'var(--primary)' : 'var(--muted-foreground)',
                    }}
                  >
                    {u.role === 'superadmin' ? t.admin.role_superadmin : t.admin.role_admin}
                  </span>
                </td>
                <td className="py-2 text-right">
                  {u.role !== 'superadmin' && (
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-xs font-medium"
                      style={{ color: 'var(--destructive)' }}
                    >
                      {t.admin.delete}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
