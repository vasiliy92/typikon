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
  const [isError, setIsError] = useState(false);
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
      setResult(t.admin.invalid_json);
      setIsError(true);
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;
    setImporting(true);
    setResult('');
    try {
      const resp = await apiPost('/admin/import', preview);
      setResult(`${t.admin.import_success}: ${JSON.stringify(resp)}`);
      setIsError(false);
    } catch (err: unknown) {
      setResult(`${t.admin.import_error}: ${err instanceof Error ? err.message : t.common.error}`);
      setIsError(true);
    }
    setImporting(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.875rem', fontWeight: 500, color: 'var(--fg)', marginBottom: 8 }}>
          {t.admin.import_data}
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          className="admin-file-input"
        />
      </div>

      {preview && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-ui), sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--fg-soft)', marginBottom: 8 }}>
            {t.admin.preview}
          </label>
          <pre className="admin-preview">
            {JSON.stringify(preview, null, 2).slice(0, 2000)}
            {JSON.stringify(preview, null, 2).length > 2000 ? '\n... (truncated)' : ''}
          </pre>
          <button
            onClick={handleImport}
            disabled={importing}
            className="admin-btn admin-btn-primary"
            style={{ marginTop: 12 }}
          >
            {importing ? '...' : t.admin.import}
          </button>
        </div>
      )}

      {result && (
        <div className={`admin-result ${isError ? 'error' : 'success'}`}>
          {result}
        </div>
      )}
    </div>
  );
}