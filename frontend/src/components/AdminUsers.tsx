'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { AdminSelect } from '@/components/AdminSelect';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'superadmin' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  const [newRole, setNewRole] = useState<'admin'>('admin');

  const f = t.admin.fields;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ items: User[]; total: number }>('/auth/users');
      setUsers(data.items);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isSuperadmin) return null;

  const createUser = async () => {
    try {
      await apiPost('/auth/users', { email: newEmail, password: newPassword, display_name: newDisplayName, role: newRole });
      setNewEmail('');
      setNewPassword('');
      setNewDisplayName('');
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
      <div className="admin-section-header">
        <span className="admin-section-meta">{t.admin.users}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
          >
            {loading ? t.common.loading : t.admin.search}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="admin-btn admin-btn-add"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t.admin.create_user}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="admin-form" style={{ marginBottom: '16px' }}>
          <div className="admin-form-grid admin-form-grid-2">
            <div className="admin-field">
              <label>{f.email}</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={f.email}
              />
            </div>
            <div className="admin-field">
              <label>{f.display_name}</label>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder={f.display_name}
              />
            </div>
            <div className="admin-field">
              <label>{f.password}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={f.password}
              />
            </div>
            <div className="admin-field">
              <label>{f.role}</label>
              <AdminSelect
                value={newRole}
                onChange={(v) => setNewRole(v as 'admin')}
                options={[
                  { value: 'admin', label: t.admin.role_admin },
                ]}
              />
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="button" onClick={() => setShowCreate(false)} className="admin-btn admin-btn-secondary">
              {t.admin.cancel}
            </button>
            <button type="button" onClick={createUser} className="admin-btn admin-btn-primary">
              {t.admin.save}
            </button>
          </div>
        </div>
      )}

      {users.length > 0 && (
        <table className="admin-table-bookish">
          <thead>
            <tr>
              <th>{f.email}</th>
              <th>{f.display_name}</th>
              <th>{f.role}</th>
              <th style={{ textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.display_name}</td>
                <td>
                  <span className={`admin-badge${u.role === 'superadmin' ? ' admin-badge-accent' : ' admin-badge-muted'}`}>
                    {u.role === 'superadmin' ? t.admin.role_superadmin : t.admin.role_admin}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {u.role !== 'superadmin' && (
                    <button onClick={() => deleteUser(u.id)} className="admin-btn admin-btn-danger">
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