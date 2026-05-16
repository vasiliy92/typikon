'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { ServiceBlockResponse, PaginatedResponse } from '@/lib/api';

/** Look up an enum value in a translation object, with fallback to the raw key. */
const enumLabel = (obj: Record<string, string>, key: string): string => obj[key] ?? key;

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

  const bookOptions = Object.entries(t.books);
  const langOptions = Object.entries(t.languages);

  return (
    <div>
      <div className="admin-section-header">
        <span className="admin-section-meta">{t.admin.total}: {total}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={bookFilter}
            onChange={(e) => { setBookFilter(e.target.value); setPage(1); }}
            className="admin-filter-select"
          >
            <option value="">{t.admin.filter_book}</option>
            {bookOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={langFilter}
            onChange={(e) => { setLangFilter(e.target.value); setPage(1); }}
            className="admin-filter-select"
          >
            <option value="">{t.admin.filter_language}</option>
            {langOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => { setCreating(true); setEditing(null); }}
            className="admin-btn admin-btn-primary"
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
        <p className="admin-section-meta" style={{ padding: '16px 0' }}>
          {t.app.no_results}
        </p>
      ) : (
        <div>
          {items.map((b) => (
            <div key={b.id} className="admin-row">
              <div className="admin-row-main">
                <div className="admin-row-title">{b.title ?? b.location_key}</div>
                <div className="admin-row-sub">
                  {enumLabel(t.books as Record<string, string>, b.book_code)} · {enumLabel(t.languages as Record<string, string>, b.language)} · {b.slot} · {t.admin.fields.tone} {b.tone ?? '-'}
                </div>
              </div>
              <div className="admin-row-actions">
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
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="admin-pagination-btn">←</button>
          <span>{t.admin.page} {page} {t.admin.of} {pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages} className="admin-pagination-btn">→</button>
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

  const bookOptions = Object.entries(t.books).map(([value, label]) => ({ value, label }));
  const langOptions = Object.entries(t.languages).map(([value, label]) => ({ value, label }));

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-grid admin-form-grid-3">
        <div className="admin-field">
          <label>{f.book_code}</label>
          <select value={form.book_code} onChange={(e) => update('book_code', e.target.value)}>
            {bookOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
        <div className="admin-field">
          <label>{f.language}</label>
          <select value={form.language} onChange={(e) => update('language', e.target.value)}>
            {langOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
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
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div className="admin-field">
          <label>{f.title}</label>
          <input value={form.title} onChange={(e) => update('title', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.content}</label>
          <textarea value={form.content} onChange={(e) => update('content', e.target.value)} rows={5} style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }} />
        </div>
      </div>
      <div className="admin-form-grid admin-form-grid-2" style={{ marginTop: 12 }}>
        <div className="admin-field">
          <label>{f.source_ref}</label>
          <input value={form.source_ref} onChange={(e) => update('source_ref', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.rubric}</label>
          <input value={form.rubric} onChange={(e) => update('rubric', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {(['is_doxastikon', 'is_theotokion', 'is_irmos', 'is_katabasia'] as const).map((flag) => (
          <label key={flag} className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={form[flag] === 'true'} onChange={(e) => update(flag, String(e.target.checked))} />
            <span style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '0.8125rem', fontWeight: 400, color: 'var(--fg-soft)' }}>
              {(f as Record<string, string>)[flag] ?? flag.replace('is_', '')}
            </span>
          </label>
        ))}
      </div>
      <div className="admin-form-actions">
        <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary">{t.admin.cancel}</button>
        <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">{t.admin.save}</button>
      </div>
    </form>
  );
}