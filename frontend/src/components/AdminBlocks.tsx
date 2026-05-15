'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete, refreshApi, PaginatedResponse, ServiceBlockResponse } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

export default function AdminBlocks() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [bookFilter, setBookFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [editing, setEditing] = useState<ServiceBlockResponse | null>(null);
  const [creating, setCreating] = useState(false);

  const queryParams = new URLSearchParams({
    page: String(page),
    page_size: '25',
    ...(bookFilter && { book_code: bookFilter }),
    ...(langFilter && { language: langFilter }),
  }).toString();

  const { data, error, isLoading } = useApi<PaginatedResponse<ServiceBlockResponse>>(
    `/api/v1/admin/blocks?${queryParams}`
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await apiPost('/api/v1/admin/blocks', {
        book_code: fd.get('book_code'),
        location_key: fd.get('location_key'),
        slot: fd.get('slot'),
        slot_order: Number(fd.get('slot_order')) || 1,
        language: fd.get('language') || 'csy',
        content: fd.get('content'),
        title: fd.get('title') || null,
        tone: fd.get('tone') || null,
      });
      setCreating(false);
      refreshApi(`/api/v1/admin/blocks?${queryParams}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await apiPut(`/api/v1/admin/blocks/${editing.id}`, {
        content: fd.get('content'),
        title: fd.get('title') || null,
        tone: fd.get('tone') || null,
      });
      setEditing(null);
      refreshApi(`/api/v1/admin/blocks?${queryParams}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.app.confirm_delete)) return;
    try {
      await apiDelete(`/api/v1/admin/blocks/${id}`);
      refreshApi(`/api/v1/admin/blocks?${queryParams}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.app.loading}</div>;
  if (error) return <div className="text-sm" style={{ color: 'oklch(0.6 0.2 25)' }}>{error.message}</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={bookFilter} onChange={(e) => { setBookFilter(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">{t.admin.filter_book}</option>
          {Object.entries(t.books).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
        <select value={langFilter} onChange={(e) => { setLangFilter(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">{t.admin.filter_language}</option>
          <option value="csy">Церковнославѧ́нскїй</option>
          <option value="fr">Français</option>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
        <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-1 text-sm">
          <Plus size={14} /> {t.app.create}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <form onSubmit={handleCreate} className="service-block space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{t.app.create}</h3>
            <button type="button" onClick={() => setCreating(false)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="book_code" placeholder="book_code" className="input-field" required />
            <input name="location_key" placeholder="location_key" className="input-field" required />
            <input name="slot" placeholder="slot" className="input-field" required />
            <input name="slot_order" type="number" placeholder="slot_order" defaultValue="1" className="input-field" />
            <select name="language" className="input-field">
              <option value="csy">CSY</option>
              <option value="fr">FR</option>
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
            <input name="tone" placeholder="tone" className="input-field" />
          </div>
          <input name="title" placeholder="title" className="input-field" />
          <textarea name="content" placeholder="content" className="input-field min-h-[100px]" required />
          <button type="submit" className="btn-primary text-sm inline-flex items-center gap-1">
            <Check size={14} /> {t.app.save}
          </button>
        </form>
      )}

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleUpdate} className="service-block space-y-3 border-l-4" style={{ borderLeftColor: 'var(--secondary)' }}>
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{t.app.edit} #{editing.id}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {editing.book_code} / {editing.location_key} / {editing.slot}
            </div>
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {editing.language} / order {editing.slot_order}
            </div>
          </div>
          <input name="title" defaultValue={editing.title || ''} placeholder="title" className="input-field" />
          <input name="tone" defaultValue={editing.tone || ''} placeholder="tone" className="input-field" />
          <textarea name="content" defaultValue={editing.content} className="input-field min-h-[150px]" required />
          <button type="submit" className="btn-primary text-sm inline-flex items-center gap-1">
            <Check size={14} /> {t.app.save}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Book</th>
              <th>Location</th>
              <th>Slot</th>
              <th>Lang</th>
              <th>Title</th>
              <th>Tone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((block) => (
              <tr key={block.id}>
                <td className="font-mono text-xs">{block.id}</td>
                <td className="text-xs">{block.book_code}</td>
                <td className="text-xs font-mono">{block.location_key}</td>
                <td className="text-xs">{block.slot}</td>
                <td className="text-xs">{block.language}</td>
                <td className="text-sm max-w-[200px] truncate">{block.title || '—'}</td>
                <td>{block.tone ? <span className="tone-badge text-xs">{block.tone}</span> : '—'}</td>
                <td className="flex gap-1">
                  <button onClick={() => setEditing(block)} className="p-1 rounded hover:bg-[var(--muted)]">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(block.id)} className="p-1 rounded hover:bg-[var(--muted)]" style={{ color: 'oklch(0.6 0.2 25)' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline text-xs">
            ←
          </button>
          <span>{t.admin.page} {data.page} {t.admin.of} {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="btn-outline text-xs">
            →
          </button>
          <span>({data.total} {t.admin.total})</span>
        </div>
      )}
    </div>
  );
}