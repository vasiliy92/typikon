{'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useApi, apiPost, apiPut, apiDelete, refreshApi, PaginatedResponse, SaintResponse } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

export default function AdminSaints() {
  const { t, locale } = useI18n();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<SaintResponse | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useApi<PaginatedResponse<SaintResponse>>(
    `/api/v1/admin/saints?page=${page}&page_size=25`
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await apiPost('/api/v1/admin/saints', {
        name_csy: fd.get('name_csy'),
        name_fr: fd.get('name_fr') || null,
        name_en: fd.get('name_en') || null,
        categories: fd.get('categories') ? (fd.get('categories') as string).split(',').map(s => s.trim()) : [],
        feast_month: fd.get('feast_month') ? Number(fd.get('feast_month')) : null,
        feast_day: fd.get('feast_day') ? Number(fd.get('feast_day')) : null,
        brief_life_csy: fd.get('brief_life_csy') || null,
        brief_life_fr: fd.get('brief_life_fr') || null,
        brief_life_en: fd.get('brief_life_en') || null,
        icon_url: fd.get('icon_url') || null,
        troparion_csy: fd.get('troparion_csy') || null,
        troparion_fr: fd.get('troparion_fr') || null,
        troparion_en: fd.get('troparion_en') || null,
        kontakion_csy: fd.get('kontakion_csy') || null,
        kontakion_fr: fd.get('kontakion_fr') || null,
        kontakion_en: fd.get('kontakion_en') || null,
      });
      setCreating(false);
      refreshApi(`/api/v1/admin/saints?page=${page}&page_size=25`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    try {
      await apiPut(`/api/v1/admin/saints/${editing.id}`, {
        name_csy: fd.get('name_csy'),
        name_fr: fd.get('name_fr') || null,
        name_en: fd.get('name_en') || null,
        categories: fd.get('categories') ? (fd.get('categories') as string).split(',').map(s => s.trim()) : editing.categories,
        feast_month: fd.get('feast_month') ? Number(fd.get('feast_month')) : editing.feast_month,
        feast_day: fd.get('feast_day') ? Number(fd.get('feast_day')) : editing.feast_day,
        brief_life_csy: fd.get('brief_life_csy') || null,
        brief_life_fr: fd.get('brief_life_fr') || null,
        brief_life_en: fd.get('brief_life_en') || null,
        icon_url: fd.get('icon_url') || null,
        troparion_csy: fd.get('troparion_csy') || null,
        troparion_fr: fd.get('troparion_fr') || null,
        troparion_en: fd.get('troparion_en') || null,
        kontakion_csy: fd.get('kontakion_csy') || null,
        kontakion_fr: fd.get('kontakion_fr') || null,
        kontakion_en: fd.get('kontakion_en') || null,
      });
      setEditing(null);
      refreshApi(`/api/v1/admin/saints?page=${page}&page_size=25`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.app.confirm_delete)) return;
    try {
      await apiDelete(`/api/v1/admin/saints/${id}`);
      refreshApi(`/api/v1/admin/saints?page=${page}&page_size=25`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t.app.loading}</div>;
  if (error) return <div className="text-sm" style={{ color: 'oklch(0.6 0.2 25)' }}>{error.message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-1 text-sm">
          <Plus size={14} /> {t.app.create}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="service-block space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{t.app.create}</h3>
            <button type="button" onClick={() => setCreating(false)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input name="name_csy" placeholder="Имѧ (CSY)" className="input-field" required />
            <input name="name_fr" placeholder="Nom (FR)" className="input-field" />
            <input name="name_en" placeholder="Name (EN)" className="input-field" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input name="categories" placeholder="martyr,bishop (comma)" className="input-field" />
            <input name="feast_month" type="number" min="1" max="12" placeholder="Feast month" className="input-field" />
            <input name="feast_day" type="number" min="1" max="31" placeholder="Feast day" className="input-field" />
          </div>
          <input name="icon_url" placeholder="Icon URL" className="input-field" />
          <details className="text-sm">
            <summary className="cursor-pointer font-display" style={{ color: 'var(--secondary)' }}>Troparion & Kontakion</summary>
            <div className="mt-2 space-y-2">
              <textarea name="troparion_csy" placeholder="Тропарь (CSY)" rows={3} className="input-field font-slavonic" />
              <textarea name="troparion_fr" placeholder="Tropaire (FR)" rows={3} className="input-field" />
              <textarea name="troparion_en" placeholder="Troparion (EN)" rows={3} className="input-field" />
              <textarea name="kontakion_csy" placeholder="Кондакъ (CSY)" rows={3} className="input-field font-slavonic" />
              <textarea name="kontakion_fr" placeholder="Kondakion (FR)" rows={3} className="input-field" />
              <textarea name="kontakion_en" placeholder="Kontakion (EN)" rows={3} className="input-field" />
            </div>
          </details>
          <details className="text-sm">
            <summary className="cursor-pointer font-display" style={{ color: 'var(--secondary)' }}>Brief Life</summary>
            <div className="mt-2 space-y-2">
              <textarea name="brief_life_csy" placeholder="Житіе (CSY)" rows={3} className="input-field font-slavonic" />
              <textarea name="brief_life_fr" placeholder="Vie brève (FR)" rows={3} className="input-field" />
              <textarea name="brief_life_en" placeholder="Brief life (EN)" rows={3} className="input-field" />
            </div>
          </details>
          <button type="submit" className="btn-primary text-sm inline-flex items-center gap-1">
            <Check size={14} /> {t.app.save}
          </button>
        </form>
      )}

      {editing && (
        <form onSubmit={handleUpdate} className="service-block space-y-3 border-l-4" style={{ borderLeftColor: 'var(--secondary)' }}>
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{t.app.edit} #{editing.id}</h3>
            <button type="button" onClick={() => setEditing(null)}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input name="name_csy" defaultValue={editing.name_csy} className="input-field" required />
            <input name="name_fr" defaultValue={editing.name_fr || ''} className="input-field" />
            <input name="name_en" defaultValue={editing.name_en || ''} className="input-field" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input name="categories" defaultValue={editing.categories?.join(', ') || ''} placeholder="martyr, bishop" className="input-field" />
            <input name="feast_month" type="number" min="1" max="12" defaultValue={editing.feast_month || ''} placeholder="Feast month" className="input-field" />
            <input name="feast_day" type="number" min="1" max="31" defaultValue={editing.feast_day || ''} placeholder="Feast day" className="input-field" />
          </div>
          <input name="icon_url" defaultValue={editing.icon_url || ''} placeholder="Icon URL" className="input-field" />
          <details className="text-sm" open>
            <summary className="cursor-pointer font-display" style={{ color: 'var(--secondary)' }}>Troparion & Kontakion</summary>
            <div className="mt-2 space-y-2">
              <textarea name="troparion_csy" defaultValue={editing.troparion_csy || ''} rows={3} className="input-field font-slavonic" />
              <textarea name="troparion_fr" defaultValue={editing.troparion_fr || ''} rows={3} className="input-field" />
              <textarea name="troparion_en" defaultValue={editing.troparion_en || ''} rows={3} className="input-field" />
              <textarea name="kontakion_csy" defaultValue={editing.kontakion_csy || ''} rows={3} className="input-field font-slavonic" />
              <textarea name="kontakion_fr" defaultValue={editing.kontakion_fr || ''} rows={3} className="input-field" />
              <textarea name="kontakion_en" defaultValue={editing.kontakion_en || ''} rows={3} className="input-field" />
            </div>
          </details>
          <button type="submit" className="btn-primary text-sm inline-flex items-center gap-1">
            <Check size={14} /> {t.app.save}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Categories</th>
              <th>Feast</th>
              <th>Has Trop.</th>
              <th>Has Icon</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((saint) => (
              <tr key={saint.id}>
                <td className="font-mono text-xs">{saint.id}</td>
                <td className="text-sm max-w-[200px] truncate">
                  {locale === 'csy' ? saint.name_csy : (saint.name_fr || saint.name_csy)}
                </td>
                <td className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {saint.categories?.join(', ') || '—'}
                </td>
                <td className="text-xs">
                  {saint.feast_month && saint.feast_day ? `${saint.feast_month}/${saint.feast_day}` : '—'}
                </td>
                <td>{saint.troparion_csy ? '✓' : '—'}</td>
                <td>{saint.icon_url ? '✓' : '—'}</td>
                <td className="flex gap-1">
                  <button onClick={() => setEditing(saint)} className="p-1 rounded hover:bg-[var(--muted)]">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(saint.id)} className="p-1 rounded hover:bg-[var(--muted)]" style={{ color: 'oklch(0.6 0.2 25)' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-outline text-xs">←</button>
          <span>{t.admin.page} {data.page} {t.admin.of} {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="btn-outline text-xs">→</button>
          <span>({data.total} {t.admin.total})</span>
        </div>
      )}
    </div>
  );
}