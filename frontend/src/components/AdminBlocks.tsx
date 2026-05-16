'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import { AdminSelect } from '@/components/AdminSelect';
import { AdminCheckbox } from '@/components/AdminCheckbox';
import type { ServiceBlockResponse, PaginatedResponse } from '@/lib/api';

const BOOKS = [
  'gospel', 'apostol', 'psalter', 'liturgicon', 'horologion', 'octoechos',
  'menaion_monthly', 'menaion_festal', 'menaion_general', 'triodion',
  'pentecostarion', 'irmologion', 'typikon', 'euchologion', 'hieraticon',
  'prologue', 'troparion',
] as const;

const LANGUAGES = ['fr', 'ru'] as const;

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
      <div className="admin-section-header">
        <div className="admin-filter-bar">
          <AdminSelect
            value={bookFilter}
            onChange={(v) => { setBookFilter(v); setPage(1); }}
            options={[
              { value: '', label: t.admin.filter_book },
              ...BOOKS.map((b) => ({ value: b, label: t.books[b as keyof typeof t.books] })),
            ]}
            placeholder={t.admin.filter_book}
          />
          <AdminSelect
            value={langFilter}
            onChange={(v) => { setLangFilter(v); setPage(1); }}
            options={[
              { value: '', label: t.admin.filter_language },
              ...LANGUAGES.map((l) => ({ value: l, label: t.languages[l as keyof typeof t.languages] })),
            ]}
            placeholder={t.admin.filter_language}
          />
          <span className="admin-section-meta">{t.admin.total}: {total}</span>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="admin-btn admin-btn-add"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t.admin.add}
        </button>
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
        <p style={{ fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.8125rem', color: 'var(--muted)', padding: '16px 0' }}>
          {t.app.no_results}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((b) => (
            <div key={b.id} className="admin-item-card">
              <div className="admin-item-main">
                <div className="admin-item-title">{b.title ?? b.location_key}</div>
                <div className="admin-item-sub">
                  {t.books[b.book_code as keyof typeof t.books] ?? b.book_code} · {t.languages[b.language as keyof typeof t.languages] ?? b.language} · {b.slot} · {t.admin.fields.tone} {b.tone ?? '—'}
                </div>
              </div>
              <div className="admin-item-actions">
                <button onClick={() => { setEditing(b); setCreating(false); }} className="admin-btn admin-btn-ghost">
                  {t.admin.edit}
                </button>
                <button onClick={() => handleDelete(b.id)} className="admin-btn admin-btn-danger">
                  {t.admin.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="admin-pagination">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="admin-pagination-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span>{t.admin.page} {page} {t.admin.of} {pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="admin-pagination-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
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
  const f = t.admin.fields;

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
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-grid admin-form-grid-3">
        <div className="admin-field">
          <label>{f.book_code}</label>
          <AdminSelect
            value={form.book_code}
            onChange={(v) => update('book_code', v)}
            options={BOOKS.map((b) => ({ value: b, label: t.books[b as keyof typeof t.books] }))}
          />
        </div>
        <div className="admin-field">
          <label>{f.language}</label>
          <AdminSelect
            value={form.language}
            onChange={(v) => update('language', v)}
            options={LANGUAGES.map((l) => ({ value: l, label: t.languages[l as keyof typeof t.languages] }))}
          />
        </div>
        <div className="admin-field">
          <label>{f.tone}</label>
          <input value={form.tone} onChange={(e) => update('tone', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.location_key}</label>
          <input value={form.location_key} onChange={(e) => update('location_key', e.target.value)} required />
        </div>
        <div className="admin-field">
          <label>{f.slot}</label>
          <input value={form.slot} onChange={(e) => update('slot', e.target.value)} required />
        </div>
        <div className="admin-field">
          <label>{f.slot_order}</label>
          <input type="number" value={form.slot_order} onChange={(e) => update('slot_order', e.target.value)} />
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <div className="admin-field">
          <label>{f.title}</label>
          <input value={form.title} onChange={(e) => update('title', e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: '8px' }}>
        <div className="admin-field">
          <label>{f.content}</label>
          <textarea value={form.content} onChange={(e) => update('content', e.target.value)} rows={5} style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }} />
        </div>
      </div>

      <div className="admin-form-grid admin-form-grid-4" style={{ marginTop: '12px' }}>
        {(['is_doxastikon', 'is_theotokion', 'is_irmos', 'is_katabasia'] as const).map((flag) => (
          <AdminCheckbox
            key={flag}
            checked={form[flag] === 'true'}
            onChange={(checked) => update(flag, String(checked))}
            label={f[flag as keyof typeof f]}
          />
        ))}
      </div>

      <div style={{ marginTop: '12px' }}>
        <div className="admin-field">
          <label>{f.source_ref}</label>
          <input value={form.source_ref} onChange={(e) => update('source_ref', e.target.value)} />
        </div>
      </div>

      <div className="admin-form-actions">
        <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary">
          {t.admin.cancel}
        </button>
        <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
          {t.admin.save}
        </button>
      </div>
    </form>
  );
}