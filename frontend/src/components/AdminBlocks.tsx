'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { ServiceBlockResponse, PaginatedResponse } from '@/lib/api';

export function AdminBlocks() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [bookFilter, setBookFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const query = `/admin/blocks?page=${page}&page_size=20${bookFilter ? `&book_code=${bookFilter}` : ''}${langFilter ? `&language=${langFilter}` : ''}`;
  const { data, mutate } = useApi<PaginatedResponse<ServiceBlockResponse>>(query);
  const [editing, setEditing] = useState<ServiceBlockResponse | null>(null);
  const [creating, setCreating] = useState(false);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.ceil(total / 20);

  const handleDelete = async (id: number) => {
    if (!confirm(t.app.confirm_delete)) return;
    await apiDelete(`/admin/blocks/${id}`);
    mutate();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t.admin.total}: {total}
        </span>
        <div className="flex gap-2">
          <select
            value={bookFilter}
            onChange={(e) => { setBookFilter(e.target.value); setPage(1); }}
            className="rounded border px-2 py-1 text-xs"
            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }}
          >
            <option value="">{t.admin.filter_book}</option>
            {['gospel', 'apostol', 'psalter', 'liturgicon', 'horologion', 'octoechos', 'menaion_monthly', 'menaion_festal', 'menaion_general', 'triodion', 'pentecostarion', 'irmologion', 'typikon', 'euchologion', 'hieraticon', 'prologue', 'troparion'].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={langFilter}
            onChange={(e) => { setLangFilter(e.target.value); setPage(1); }}
            className="rounded border px-2 py-1 text-xs"
            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }}
          >
            <option value="">{t.admin.filter_language}</option>
            {['fr', 'ru'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <button
            onClick={() => { setCreating(true); setEditing(null); }}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {t.admin.add}
          </button>
        </div>
      </div>

      {(creating || editing) && (
        <BlockForm
          block={editing}
          onSave={async (payload) => {
            if (editing) {
              await apiPut(`/admin/blocks/${editing.id}`, payload);
            } else {
              await apiPost('/admin/blocks', payload);
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
          {items.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>
                  {b.title ?? b.location_key}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {b.book_code} · {b.language} · {b.slot} · tone {b.tone ?? '-'}
                </div>
              </div>
              <div className="flex gap-2 ml-2">
                <button onClick={() => { setEditing(b); setCreating(false); }} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--primary)' }}>
                  {t.admin.edit}
                </button>
                <button onClick={() => handleDelete(b.id)} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--destructive)' }}>
                  {t.admin.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 rounded text-sm disabled:opacity-30" style={{ background: 'var(--muted-bg)', color: 'var(--foreground)' }}>←</button>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.admin.page} {page} {t.admin.of} {pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="px-3 py-1 rounded text-sm disabled:opacity-30" style={{ background: 'var(--muted-bg)', color: 'var(--foreground)' }}>→</button>
        </div>
      )}
    </div>
  );
}

function BlockForm({
  block,
  onSave,
  onCancel,
}: {
  block: ServiceBlockResponse | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<Record<string, string>>({
    book_code: block?.book_code ?? 'octoechos',
    location_key: block?.location_key ?? '',
    slot: block?.slot ?? '',
    slot_order: String(block?.slot_order ?? 0),
    language: block?.language ?? 'ru',
    title: block?.title ?? '',
    content: block?.content ?? '',
    tone: block?.tone ?? '',
    rank: String(block?.rank ?? ''),
    is_doxastikon: String(block?.is_doxastikon ?? false),
    is_theotokion: String(block?.is_theotokion ?? false),
    is_irmos: String(block?.is_irmos ?? false),
    is_katabasia: String(block?.is_katabasia ?? false),
    source_ref: block?.source_ref ?? '',
    rubric: block?.rubric ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (['slot_order', 'rank'].includes(k)) {
        payload[k] = v ? Number(v) : null;
      } else if (k.startsWith('is_')) {
        payload[k] = v === 'true';
      } else {
        payload[k] = v || null;
      }
    }
    await onSave(payload);
    setSaving(false);
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 mb-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>book_code</label>
          <select value={form.book_code} onChange={(e) => update('book_code', e.target.value)} className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }}>
            {['gospel', 'apostol', 'psalter', 'liturgicon', 'horologion', 'octoechos', 'menaion_monthly', 'menaion_festal', 'menaion_general', 'triodion', 'pentecostarion', 'irmologion', 'typikon', 'euchologion', 'hieraticon', 'prologue', 'troparion'].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>language</label>
          <select value={form.language} onChange={(e) => update('language', e.target.value)} className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }}>
            {['fr', 'ru'].map((l) => (<option key={l} value={l}>{l}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>tone</label>
          <input value={form.tone} onChange={(e) => update('tone', e.target.value)} className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>location_key</label>
          <input value={form.location_key} onChange={(e) => update('location_key', e.target.value)} required className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>slot</label>
          <input value={form.slot} onChange={(e) => update('slot', e.target.value)} required className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>slot_order</label>
          <input type="number" value={form.slot_order} onChange={(e) => update('slot_order', e.target.value)} className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>title</label>
        <input value={form.title} onChange={(e) => update('title', e.target.value)} className="w-full rounded border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>content</label>
        <textarea value={form.content} onChange={(e) => update('content', e.target.value)} rows={5} className="w-full rounded border px-2 py-1 text-sm font-mono" style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--foreground)' }} />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {['is_doxastikon', 'is_theotokion', 'is_irmos', 'is_katabasia'].map((flag) => (
          <label key={flag} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <input type="checkbox" checked={form[flag] === 'true'} onChange={(e) => update(flag, String(e.target.checked))} />
            {flag.replace('is_', '')}
          </label>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.admin.cancel}</button>
        <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>{t.admin.save}</button>
      </div>
    </form>
  );
}