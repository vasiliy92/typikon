'use client';

import { useI18n } from '@/lib/i18n';
import { useAuth, AuthProvider } from '@/lib/auth';
import { LoginForm } from '@/components/LoginForm';
import { AdminUsers } from '@/components/AdminUsers';
import { useState } from 'react';

function AdminContent() {
  const { t } = useI18n();
  const { user, logout, isAuthenticated, isSuperadmin } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const tabs = [
    { id: 'calendar', label: t.admin.calendar },
    { id: 'saints', label: t.admin.saints },
    { id: 'templates', label: t.admin.templates },
    { id: 'blocks', label: t.admin.blocks },
    { id: 'import', label: t.admin.import },
    ...(isSuperadmin ? [{ id: 'users', label: t.admin.users }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t.admin.title}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
            >
              {t.admin.logout}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {activeTab === 'calendar' && (
            <p className="text-gray-500 dark:text-gray-400">
              {t.admin.calendar} — coming soon
            </p>
          )}
          {activeTab === 'saints' && (
            <p className="text-gray-500 dark:text-gray-400">
              {t.admin.saints} — coming soon
            </p>
          )}
          {activeTab === 'templates' && (
            <p className="text-gray-500 dark:text-gray-400">
              {t.admin.templates} — coming soon
            </p>
          )}
          {activeTab === 'blocks' && (
            <p className="text-gray-500 dark:text-gray-400">
              {t.admin.blocks} — coming soon
            </p>
          )}
          {activeTab === 'import' && (
            <p className="text-gray-500 dark:text-gray-400">
              {t.admin.import_data} — coming soon
            </p>
          )}
          {activeTab === 'users' && isSuperadmin && <AdminUsers />}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}
