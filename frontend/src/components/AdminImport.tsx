'use client';

import { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { apiPost } from '@/lib/api';

export function AdminImport() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult('');
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      setPreview(json);
    } catch {
      setPreview(null);
      setResult('Invalid JSON file');
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;
    setImporting(true);
    setResult('');
    try {
      const resp = await apiPost('/admin/import', preview);
      setResult(`Imported: ${JSON.stringify(resp)}`);
    } catch (err: unknown) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Import failed'}`);
    }
    setImporting(false);
  };

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>{t.admin.import_data}</label>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          className="block w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium"
          style={{ color: 'var(--muted-foreground)' }}
        />
      </div>

      {preview && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Preview</h4>
          <pre className="rounded-lg border p-3 text-xs overflow-auto max-h-64" style={{ borderColor: 'var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }}>
            {JSON.stringify(preview, null, 2).slice(0, 2000)}
            {JSON.stringify(preview, null, 2).length > 2000 ? '\n... (truncated)' : ''}
          </pre>
          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {importing ? '...' : t.admin.import}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: result.startsWith('Error') ? 'var(--destructive)' : 'var(--border)', color: 'var(--foreground)' }}>
          {result}
        </div>
      )}
    </div>
  );
}