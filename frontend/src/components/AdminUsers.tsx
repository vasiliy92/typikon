"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

interface UserItem {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminUsers() {
  const { isSuperadmin } = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", display_name: "", role: "admin" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isSuperadmin) return;
    loadUsers();
  }, [isSuperadmin]);

  const loadUsers = async () => {
    try {
      const data = await apiGet<{ items: UserItem[]; total: number }>("/auth/users");
      setUsers(data.items);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiPost("/auth/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ email: "", password: "", display_name: "", role: "admin" });
      setShowForm(false);
      await loadUsers();
    } catch {
      // error handling
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    await apiPatch(`/auth/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    await loadUsers();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user?")) return;
    await apiDelete(`/auth/users/${userId}`);
    await loadUsers();
  };

  if (!isSuperadmin) {
    return <p className="text-muted">{t.auth.noPermission}</p>;
  }

  if (loading) return <p>...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t.auth.users}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          +
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-foreground/10 p-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder={t.auth.password}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder={t.auth.displayName}
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            required
            className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm"
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {creating ? "..." : t.auth.createUser}
          </button>
        </form>
      )}

      <div className="divide-y divide-foreground/10">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{u.display_name} <span className="text-muted text-sm">({u.role})</span></p>
              <p className="text-sm text-muted">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActive(u)}
                className={`px-2 py-1 text-xs rounded ${u.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
              >
                {u.is_active ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => handleDelete(u.id)}
                className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
