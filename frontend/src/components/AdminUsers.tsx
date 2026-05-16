'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

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
    if (!confirm('Delete this user?')) return;
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.admin.users}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {loading ? t.common.loading : t.admin.search}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {t.admin.create_user}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="email"
              placeholder={t.admin.email}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="password"
              placeholder={t.admin.password}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <div className="flex gap-2">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="admin">{t.admin.role_admin}</option>
              </select>
              <button
                onClick={createUser}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                {t.admin.save}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg"
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
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-600 dark:text-gray-400">{t.admin.email}</th>
              <th className="text-left py-2 text-gray-600 dark:text-gray-400">Role</th>
              <th className="text-right py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-2 text-gray-900 dark:text-white">{u.email}</td>
                <td className="py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === 'superadmin'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {u.role === 'superadmin' ? t.admin.role_superadmin : t.admin.role_admin}
                  </span>
                </td>
                <td className="py-2 text-right">
                  {u.role !== 'superadmin' && (
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 text-xs"
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
