'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { apiGet, apiPost, apiDelete, type PaginatedResponse } from '@/lib/api';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'superadmin' | 'admin';
  is_active: boolean;
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
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin');
  const [error, setError] = useState('');

  if (!isSuperadmin) return null;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGet<PaginatedResponse<User>>('/auth/users');
      setUsers(data.items);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    setError('');
    if (!newEmail || !newPassword || !newDisplayName) {
      setError('All fields are required');
      return;
    }
    try {
      await apiPost('/auth/users', {
        email: newEmail,
        password: newPassword,
        display_name: newDisplayName,
        role: newRole,
      });
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('admin');
      setShowCreate(false);
      loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
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
      <div className="admin-section-header">
        <span className="admin-section-title">{t.admin.users}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
          >
            {loading ? t.common.loading : t.admin.search}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="admin-btn admin-btn-primary"
          >
            {t.admin.create_user}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="admin-form">
          {error && (
            <div className="admin-login-error" style={{ marginBottom: 12 }}>{error}</div>
          )}
          <div className="admin-form-grid admin-form-grid-2">
            <div className="admin-field">
              <label>{t.auth.displayName}</label>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label>{t.admin.email}</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label>{t.admin.password}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label>Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'superadmin')}
              >
                <option value="admin">{t.admin.role_admin}</option>
                <option value="superadmin">{t.admin.role_superadmin}</option>
              </select>
            </div>
          </div>
          <div className="admin-form-actions">
            <button
              onClick={() => { setShowCreate(false); setError(''); }}
              className="admin-btn admin-btn-secondary"
            >
              {t.admin.cancel}
            </button>
            <button
              onClick={createUser}
              className="admin-btn admin-btn-primary"
            >
              {t.admin.save}
            </button>
          </div>
        </div>
      )}

      {users.length > 0 && (
        <table className="admin-table-bookish">
          <thead>
            <tr>
              <th>{t.auth.displayName}</th>
              <th>{t.admin.email}</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.display_name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`admin-badge ${u.role === 'superadmin' ? 'admin-badge-accent' : 'admin-badge-muted'}`}>
                    {u.role === 'superadmin' ? t.admin.role_superadmin : t.admin.role_admin}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {u.role !== 'superadmin' && (
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="admin-btn admin-btn-danger"
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