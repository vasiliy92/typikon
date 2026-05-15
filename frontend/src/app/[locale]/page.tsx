'use client';

import { useState, useCallback } from 'react';
import { useI18n } from './layout';
import { apiPost, AssembledServiceResponse, LiturgicalDay, useApi } from '@/lib/api';
import { Calendar, ChevronDown, BookOpen, Loader2, Cross, Clock, Music } from 'lucide-react';
import clsx from 'clsx';

export default function ServicePage() {
  const { locale, t } = useI18n();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState('liturgy');
  const [calendarStyle, setCalendarStyle] = useState<'new' | 'old'>('new');
  const [mode, setMode] = useState<'full' | 'ustav'>('full');
  const [templeId] = useState(1);
  const [assembled, setAssembled] = useState<AssembledServiceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch liturgical day info
  const { data: litDay } = useApi<LiturgicalDay>(
    `/api/v1/calendar/${date}?style=${calendarStyle}`
  );

  const assemble = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<AssembledServiceResponse>(
        `/api/v1/service/assemble?date=${date}&service_type=${serviceType}&temple_id=${templeId}&language=${locale === 'csy' ? 'csy' : 'fr'}&calendar_style=${calendarStyle}&mode=${mode}`,
        {}
      );
      setAssembled(result);
    } catch (err: any) {
      setError(err.message || t.app.error);
    } finally {
      setLoading(false);
    }
  }, [date, serviceType, templeId, locale, calendarStyle, mode, t]);

  const serviceTypes = [
    'vespers', 'matins', 'vigil', 'hours', 'liturgy',
    'compline', 'midnight_office', 'typica', 'presanctified',
  ];

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="animate-fade-slide-up">
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          {t.service.title}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t.app.subtitle}
        </p>
      </div>

      {/* Controls */}
      <div className="animate-fade-slide-up animate-delay-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Date picker */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {t.service.select_date}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Service type */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {t.service.select_type}
          </label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="input-field"
          >
            {serviceTypes.map((st) => (
              <option key={st} value={st}>
                {(t.service_types as Record<string, string>)[st] || st}
              </option>
            ))}
          </select>
        </div>

        {/* Calendar style */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {t.service.calendar_style}
          </label>
          <select
            value={calendarStyle}
            onChange={(e) => setCalendarStyle(e.target.value as 'new' | 'old')}
            className="input-field"
          >
            <option value="new">{t.service.new_calendar}</option>
            <option value="old">{t.service.old_calendar}</option>
          </select>
        </div>

        {/* Mode */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {t.service.mode_full} / {t.service.mode_ustav}
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => setMode('full')}
              className={clsx('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                mode === 'full' ? 'text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
              style={mode === 'full' ? { background: 'var(--primary)' } : { background: 'var(--muted)' }}
            >
              <BookOpen size={14} className="inline mr-1" />
              {t.service.mode_full}
            </button>
            <button
              onClick={() => setMode('ustav')}
              className={clsx('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                mode === 'ustav' ? 'text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
              style={mode === 'ustav' ? { background: 'var(--primary)' } : { background: 'var(--muted)' }}
            >
              {t.service.mode_ustav}
            </button>
          </div>
        </div>
      </div>

      {/* Assemble button */}
      <div className="animate-fade-slide-up animate-delay-2">
        <button
          onClick={assemble}
          disabled={loading}
          className="btn-primary inline-flex items-center gap-2"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Cross size={18} />
          )}
          {t.service.assemble}
        </button>
      </div>

      {/* Liturgical day info card */}
      {(litDay || assembled?.liturgical_day) && (
        <div className="animate-fade-slide-up animate-delay-3 service-block">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--primary)' }}>
              <Calendar size={18} className="inline mr-1.5" />
              {(t.days_of_week as Record<string, string>)[
                (litDay || assembled!.liturgical_day).day_of_week_name
              ] || (litDay || assembled!.liturgical_day).day_of_week_name}
            </h2>
            <span className="tone-badge">
              {(litDay || assembled!.liturgical_day).tone}
            </span>
            <span className="feast-rank-badge feast-rank-1 text-xs">
              {(t.periods as Record<string, string>)[
                (litDay || assembled!.liturgical_day).period
              ] || (litDay || assembled!.liturgical_day).period}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <Clock size={12} className="inline mr-1" />
              {(t.fasting_types as Record<string, string>)[
                (litDay || assembled!.liturgical_day).fasting
              ] || (litDay || assembled!.liturgical_day).fasting}
            </span>
          </div>
          <div className="text-sm grid grid-cols-2 gap-2" style={{ color: 'var(--muted-foreground)' }}>
            <div>Julian: {(litDay || assembled!.liturgical_day).julian_date}</div>
            <div>Gregorian: {(litDay || assembled!.liturgical_day).gregorian_date}</div>
            <div>Pascha (Julian): {(litDay || assembled!.liturgical_day).pascha_julian}</div>
            <div>Days from Pascha: {(litDay || assembled!.liturgical_day).days_from_pascha}</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg p-4 text-sm" style={{ background: 'oklch(0.6 0.2 25 / 0.15)', color: 'oklch(0.6 0.2 25)' }}>
          {error}
        </div>
      )}

      {/* Assembled service output */}
      {assembled && (
        <div className="space-y-4 animate-fade-slide-up">
          {/* Feast entries */}
          {(assembled.fixed_entries.length > 0 || assembled.movable_entries.length > 0) && (
            <div>
              <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--secondary)' }}>
                <Music size={16} className="inline mr-1.5" />
                {t.service.feast_rank}: {(t.feast_ranks as Record<string, string>)[String(assembled.feast_rank)] || assembled.feast_rank}
              </h3>
              <div className="space-y-2">
                {[...assembled.fixed_entries, ...assembled.movable_entries].map((entry, i) => (
                  <div key={entry.id || i} className="service-block">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`feast-rank-badge feast-rank-${entry.rank}`}>
                        {(t.feast_ranks as Record<string, string>)[entry.rank] || `Rank ${entry.rank}`}
                      </span>
                      {entry.tone && <span className="tone-badge text-xs">{entry.tone}</span>}
                    </div>
                    <div className={clsx(locale === 'csy' && 'text-slavonic')}>
                      {(locale === 'csy' ? entry.title_csy : (entry.title_fr || entry.title_csy))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patron troparia */}
          {assembled.patron_troparia.has_patron && (
            <div className="service-block border-l-4" style={{ borderLeftColor: 'var(--secondary)' }}>
              <h3 className="service-block-title">{t.service.patron_troparia}</h3>
              <div className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>
                {assembled.patron_troparia.saint_name}
                {assembled.patron_troparia.dedication_type && ` (${assembled.patron_troparia.dedication_type})`}
              </div>
              {assembled.patron_troparia.troparion && (
                <div className="mb-2">
                  <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--accent)' }}>
                    Troparion, Tone {assembled.patron_troparia.troparion.tone}
                  </div>
                  <div className={clsx(locale === 'csy' && 'text-slavonic')}>
                    {assembled.patron_troparia.troparion.text}
                  </div>
                </div>
              )}
              {assembled.patron_troparia.kontakion && (
                <div>
                  <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--accent)' }}>
                    Kontakion, Tone {assembled.patron_troparia.kontakion.tone}
                  </div>
                  <div className={clsx(locale === 'csy' && 'text-slavonic')}>
                    {assembled.patron_troparia.kontakion.text}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Service blocks */}
          {assembled.blocks.length > 0 && (
            <div>
              <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                <BookOpen size={16} className="inline mr-1.5" />
                {t.service.blocks}
              </h3>
              <div className="space-y-2">
                {assembled.blocks.map((block, i) => (
                  <div key={`${block.slot_key}-${i}`} className={clsx(
                    'service-block',
                    block.block_type === 'rubric' && 'border-l-4',
                  )} style={block.block_type === 'rubric' ? { borderLeftColor: 'var(--muted-foreground)' } : {}}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                        {block.slot_key}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {block.block_type}
                      </span>
                      {block.tone && <span className="tone-badge text-xs">{block.tone}</span>}
                    </div>
                    {block.title && (
                      <div className="service-block-title text-sm">{block.title}</div>
                    )}
                    {block.rubric && (
                      <div className="rubric-text">{block.rubric}</div>
                    )}
                    {block.content && (
                      <div className={clsx('text-sm mt-1', locale === 'csy' && 'text-slavonic')}>
                        {block.content}
                      </div>
                    )}
                    {block.content_translated && (
                      <div className="text-sm mt-1 pl-3 border-l-2" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                        {block.content_translated}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lections */}
          {Object.keys(assembled.lections).length > 0 && (
            <div>
              <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                {t.service.lections}
              </h3>
              <div className="space-y-2">
                {Object.entries(assembled.lections).map(([book, lections]) => (
                  <div key={book}>
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--accent)' }}>
                      {(t.books as Record<string, string>)[book] || book}
                    </div>
                    {lections.map((lec) => (
                      <div key={lec.lection_id} className="lection-block">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{lec.short_ref}</span>
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            Zachalo {lec.zachalo}
                          </span>
                          {lec.is_paremia && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                              Paremia
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium">{lec.title}</div>
                        {lec.content && (
                          <div className={clsx('text-sm mt-1', locale === 'csy' && 'text-slavonic')}>
                            {lec.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!assembled && !loading && !error && (
        <div className="text-center py-16 animate-fade-slide-up animate-delay-3">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'var(--muted)' }}>
            <BookOpen size={28} style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <p className="font-display text-lg" style={{ color: 'var(--muted-foreground)' }}>
            {t.service.select_date}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {t.app.subtitle}
          </p>
        </div>
      )}

      {/* Bottom spacer for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}