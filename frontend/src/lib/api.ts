import useSWR, { mutate } from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, { credentials: 'include' });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || res.statusText);
  }
  return res.json();
}

export function useApi<T>(path: string | null) {
  return useSWR<T>(path, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  return fetcher<T>(path);
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || res.statusText);
  }
  return res.json();
}

export async function apiPut<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || res.statusText);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || res.statusText);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || res.statusText);
  }
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || res.statusText);
  }
  return res.json();
}

export function refreshApi(path: string) {
  mutate(path);
}

export interface LiturgicalDay {
  gregorian_date: string;
  julian_date: string;
  pascha_julian: string;
  pascha_gregorian: string;
  days_from_pascha: number;
  week_from_pascha: number;
  tone: number;
  day_of_week: number;
  day_of_week_name: string;
  period: string;
  fasting: string;
}

export interface CalendarEntryResponse {
  id: number;
  date_type: string;
  month: number | null;
  day: number | null;
  pascha_offset: number | null;
  title_csy: string;
  title_fr: string | null;
  title_en: string | null;
  title_ru: string | null;
  rank: string;
  tone: number | null;
  fasting: string;
  saint_id: number | null;
  rubric: string | null;
}

export interface AssembledServiceResponse {
  date: string;
  service_type: string;
  temple_id: number;
  language: string;
  calendar_style: string;
  mode: string;
  liturgical_day: LiturgicalDay;
  feast_rank: number;
  template_type: string;
  fixed_entries: CalendarEntryResponse[];
  movable_entries: CalendarEntryResponse[];
  blocks: ServiceBlockItem[];
  lections: Record<string, LectionItem[]>;
  patron_troparia: PatronTroparia;
}

export interface ServiceBlockItem {
  slot_key: string;
  block_order: number;
  block_type: string;
  fixed_content_key: string | null;
  variable_sources: string[] | null;
  required: boolean;
  rubric: string | null;
  condition: Record<string, unknown> | null;
  content: string | null;
  title: string | null;
  book_code?: string;
  tone?: string;
  content_translated?: string;
  title_translated?: string;
}

export interface LectionItem {
  lection_id: number;
  book_code: string;
  zachalo: number;
  title: string;
  short_ref: string;
  content: string | null;
  reading_order: number;
  is_paremia: boolean;
}

export interface PatronTroparia {
  has_patron: boolean;
  saint_name?: string;
  dedication_type?: string;
  troparion?: { text: string; tone: string };
  kontakion?: { text: string; tone: string };
}

export interface ServiceBlockResponse {
  id: number;
  book_code: string;
  location_key: string;
  slot: string;
  slot_order: number;
  language: string;
  translation_group_id: string | null;
  title: string | null;
  content: string;
  tone: string | null;
  rank: number | null;
  is_doxastikon: boolean;
  is_theotokion: boolean;
  is_irmos: boolean;
  is_katabasia: boolean;
  source_ref: string | null;
  rubric: string | null;
}

export interface SaintResponse {
  id: number;
  name_csy: string;
  name_fr: string | null;
  name_en: string | null;
  categories: string[];
  feast_month: number | null;
  feast_day: number | null;
  brief_life_csy: string | null;
  brief_life_fr: string | null;
  brief_life_en: string | null;
  icon_url: string | null;
  troparion_csy: string | null;
  troparion_fr: string | null;
  troparion_en: string | null;
  troparion_tone: string | null;
  kontakion_csy: string | null;
  kontakion_fr: string | null;
  kontakion_en: string | null;
  kontakion_tone: string | null;
}

export interface TemplateResponse {
  id: number;
  service_type: string;
  name: string;
  sub_type: string | null;
  is_special: boolean;
  trigger_condition: Record<string, unknown> | null;
  description: string | null;
  blocks: TemplateBlockResponse[];
}

export interface TemplateBlockResponse {
  id: number;
  template_id: number;
  block_order: number;
  slot_key: string;
  block_type: string;
  fixed_content_key: string | null;
  variable_sources: string[] | null;
  required: boolean;
  rubric: string | null;
  typikon_ref: string | null;
  condition: Record<string, unknown> | null;
}

export interface ServiceTemplateResponse {
  id: number;
  name: string;
  service_type: string;
  description: string | null;
  blocks: ServiceTemplateBlockResponse[];
}

export interface ServiceTemplateBlockResponse {
  id: number;
  template_id: number;
  block_id: number;
  block_name: string;
  block_order: number;
  is_optional: boolean;
  conditions: Record<string, unknown> | null;
  overrides: Record<string, unknown> | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ImportResult {
  status: string;
  total_created: number;
  total_errors: number;
  details: Record<string, { created: number; errors: number }>;
}