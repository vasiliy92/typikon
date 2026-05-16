"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function LoginForm() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError(t.auth.loginFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-foreground/10 bg-surface p-8 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-center">{t.auth.login}</h2>

        {error && (
          <div className="rounded-lg bg-red-500/10 text-red-400 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.auth.password}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? "..." : t.auth.login}
        </button>
      </form>
    </div>
  );
}
