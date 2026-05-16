'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { SaintResponse, PaginatedResponse } from '@/lib/api';

export function AdminSaints() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, mutate } = useApi<PaginatedResponse<SaintResponse>>(
    `/admin/saints?page=${page}&page_size=20`
  );
  const [editing, setEditing] = useState<SaintResponse | null>(null);
  const [creating, setCreating] = useState(false);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 20);

  const handleDelete = async (id: number) => {
    if (!confirm(t.app.confirm_delete)) return;
    await apiDelete(`/admin/saints/${id}`);
    mutate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t.admin.total}: {total}
        </span>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {t.admin.add}
        </button>
      </div>

      {(creating || editing) && (
        <SaintForm
          saint={editing}
          onSave={async (payload) => {
            if (editing) {
              await apiPut(`/admin/saints/${editing.id}`, payload);
            } else {
              await apiPost('/admin/saints', payload);
            }
            setCreating(false);
            setEditing(null);
            mutate();
          }}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {items.length === 0 ? (
        <p className="text-sm py-4" style={{ color: 'var(--muted-foreground)' }}>
          {t.app.no_results}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>
                  {s.name_ru}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {s.name_fr ?? ''} · {s.categories?.join(', ')}
                </div>
              </div>
              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => { setEditing(s); setCreating(false); }}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: 'var(--primary)' }}
                >
                  {t.admin.edit}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: 'var(--destructive)' }}
                >
                  {t.admin.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded text-sm disabled:opacity-30"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            ←
          </button>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t.admin.page} {page} {t.admin.of} {pages}
          </span>
          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="px-3 py-1 rounded text-sm disabled:opacity-30"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

function SaintForm({
  saint,
  onSave,
  onCancel,
}: {
  saint: SaintResponse | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const f = t.admin.fields;
  const [form, setForm] = useState<Record<string, string>>({
    name_ru: saint?.name_ru ?? '',
    name_fr: saint?.name_fr ?? '',
    categories: saint?.categories?.join(',') ?? '',
    feast_month: String(saint?.feast_month ?? ''),
    feast_day: String(saint?.feast_day ?? ''),
    troparion_ru: saint?.troparion_ru ?? '',
    troparion_fr: saint?.troparion_fr ?? '',
    troparion_tone: saint?.troparion_tone ?? '',
    kontakion_ru: saint?.kontakion_ru ?? '',
    kontakion_fr: saint?.kontakion_fr ?? '',
    kontakion_tone: saint?.kontakion_tone ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (['feast_month', 'feast_day'].includes(k)) {
        payload[k] = v ? Number(v) : null;
      } else if (k === 'categories') {
        payload[k] = v ? v.split(',').map((s: string) => s.trim()) : [];
      } else {
        payload[k] = v || null;
      }
    }
    await onSave(payload);
    setSaving(false);
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const inputStyle = { borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' } as React.CSSProperties;
  const labelStyle = { color: 'var(--muted-foreground)' } as React.CSSProperties;
  const inputCls = 'w-full rounded border px-2 py-1 text-sm';

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 mb-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.name_ru}</label>
          <input value={form.name_ru} onChange={(e) => update('name_ru', e.target.value)} required className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.name_fr}</label>
          <input value={form.name_fr} onChange={(e) => update('name_fr', e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.categories}</label>
          <input value={form.categories} onChange={(e) => update('categories', e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.feast_month}</label>
          <input type="number" value={form.feast_month} onChange={(e) => update('feast_month', e.target.value)} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.feast_day}</label>
          <input type="number" value={form.feast_day} onChange={(e) => update('feast_day', e.target.value)} className={inputCls} style={inputStyle} />
        </div>
      </div>
      <details className="border rounded p-2" style={{ borderColor: 'var(--border)' }}>
        <summary className="text-xs font-medium cursor-pointer" style={labelStyle}>{f.troparion}</summary>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.troparion_ru}</label>
            <textarea value={form.troparion_ru} onChange={(e) => update('troparion_ru', e.target.value)} rows={3} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.troparion_fr}</label>
            <textarea value={form.troparion_fr} onChange={(e) => update('troparion_fr', e.target.value)} rows={3} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.troparion_tone}</label>
            <input value={form.troparion_tone} onChange={(e) => update('troparion_tone', e.target.value)} className={inputCls} style={inputStyle} />
          </div>
        </div>
      </details>
      <details className="border rounded p-2" style={{ borderColor: 'var(--border)' }}>
        <summary className="text-xs font-medium cursor-pointer" style={labelStyle}>{f.kontakion}</summary>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.kontakion_ru}</label>
            <textarea value={form.kontakion_ru} onChange={(e) => update('kontakion_ru', e.target.value)} rows={3} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.kontakion_fr}</label>
            <textarea value={form.kontakion_fr} onChange={(e) => update('kontakion_fr', e.target.value)} rows={3} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>{f.kontakion_tone}</label>
            <input value={form.kontakion_tone} onChange={(e) => update('kontakion_tone', e.target.value)} className={inputCls} style={inputStyle} />
          </div>
        </div>
      </details>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg text-sm" style={labelStyle}>
          {t.admin.cancel}
        </button>
        <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          {t.admin.save}
        </button>
      </div>
    </form>
  );
}