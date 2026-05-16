'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete } from '@/lib/api';
import { AdminSelect } from '@/components/AdminSelect';
import { AdminCheckbox } from '@/components/AdminCheckbox';
import type { BlockResponse, PaginatedResponse } from '@/lib/api';

export function AdminBlocks() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, mutate } = useApi<PaginatedResponse<BlockResponse>>(
    `/admin/blocks?page=${page}&page_size=20`
  );
  const [editing, setEditing] = useState<BlockResponse | null>(null);
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
        <span className="admin-section-meta">{t.admin.total}: {total}</span>
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
                <div className="admin-item-title">{b.title ?? `Block ${b.id}`}</div>
                <div className="admin-item-sub">
                  {b.slot} · {t.admin.fields.slot_order} {b.slot_order} · {b.book_code} · {b.language.toUpperCase()}
                </div>
              </div>
              <div className="admin-item-actions">
                <button
                  onClick={() => { setEditing(b); setCreating(false); }}
                  className="admin-btn admin-btn-ghost"
                >
                  {t.admin.edit}
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="admin-btn admin-btn-danger"
                >
                  {t.admin.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="admin-pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="admin-pagination-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span>{t.admin.page} {page} {t.admin.of} {pages}</span>
          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="admin-pagination-btn"
          >
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
  block: BlockResponse | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const f = t.admin.fields;

  const [form, setForm] = useState<Record<string, string>>({
    book_code: block?.book_code ?? '',
    location_key: block?.location_key ?? '',
    slot: block?.slot ?? '',
    slot_order: String(block?.slot_order ?? ''),
    language: block?.language ?? 'fr',
    translation_group_id: block?.translation_group_id ?? '',
    title: block?.title ?? '',
    content: block?.content ?? '',
    tone: block?.tone ?? '',
    rank: String(block?.rank ?? ''),
    is_doxastikon: block?.is_doxastikon ? 'true' : 'false',
    is_theotokion: block?.is_theotokion ? 'true' : 'false',
    is_irmos: block?.is_irmos ? 'true' : 'false',
    is_katabasia: block?.is_katabasia ? 'true' : 'false',
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
      <div className="admin-form-grid admin-form-grid-2">
        <div className="admin-field">
          <label>{f.book_code}</label>
          <AdminSelect
            value={form.book_code}
            onChange={(v) => update('book_code', v)}
            options={[
              { value: '', label: '\u2014' },
              ...Object.entries(t.books).map(([code, name]) => ({
                value: code,
                label: name as string,
              })),
            ]}
          />
        </div>
        <div className="admin-field">
          <label>{f.language}</label>
          <AdminSelect
            value={form.language}
            onChange={(v) => update('language', v)}
            options={['fr', 'ru', 'en', 'gr'].map((l) => ({ value: l, label: l.toUpperCase() }))}
          />
        </div>
        <div className="admin-field">
          <label>{f.slot}</label>
          <input value={form.slot} onChange={(e) => update('slot', e.target.value)} required />
        </div>
        <div className="admin-field">
          <label>{f.slot_order}</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.slot_order}
            onChange={(e) => update('slot_order', e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
          />
        </div>
        <div className="admin-field">
          <label>{f.location_key}</label>
          <input value={form.location_key} onChange={(e) => update('location_key', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.translation_group_id}</label>
          <input value={form.translation_group_id} onChange={(e) => update('translation_group_id', e.target.value)} />
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
          <textarea value={form.content} onChange={(e) => update('content', e.target.value)} rows={4} />
        </div>
      </div>

      <div className="admin-form-grid admin-form-grid-2" style={{ marginTop: '12px' }}>
        <div className="admin-field">
          <label>{f.tone}</label>
          <AdminSelect
            value={form.tone}
            onChange={(v) => update('tone', v)}
            options={[
              { value: '', label: '\u2014' },
              ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                value: String(n),
                label: `${t.service.tone_label} ${n}`,
              })),
            ]}
          />
        </div>
        <div className="admin-field">
          <label>{f.rank}</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.rank}
            onChange={(e) => update('rank', e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
          />
        </div>
        <div className="admin-field">
          <label>{f.source_ref}</label>
          <input value={form.source_ref} onChange={(e) => update('source_ref', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>{f.rubric}</label>
          <input value={form.rubric} onChange={(e) => update('rubric', e.target.value)} />
        </div>
      </div>

      <div className="admin-form-grid admin-form-grid-3" style={{ marginTop: '12px' }}>
        <AdminCheckbox label={f.is_doxastikon} checked={form.is_doxastikon === 'true'} onChange={(c) => update('is_doxastikon', c ? 'true' : 'false')} />
        <AdminCheckbox label={f.is_irmos} checked={form.is_irmos === 'true'} onChange={(c) => update('is_irmos', c ? 'true' : 'false')} />
        <AdminCheckbox label={f.is_katabasia} checked={form.is_katabasia === 'true'} onChange={(c) => update('is_katabasia', c ? 'true' : 'false')} />
        <AdminCheckbox label={f.is_theotokion} checked={form.is_theotokion === 'true'} onChange={(c) => update('is_theotokion', c ? 'true' : 'false')} />
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
