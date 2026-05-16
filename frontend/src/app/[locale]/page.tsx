'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { apiPost, AssembledServiceResponse, LiturgicalDay, useApi } from '@/lib/api';
import { useTopbarTitle } from '@/lib/topbar';

/* ─── Font Scale ─── */
const FONT_SCALES = [
  { labelKey: 'small', value: 0.85 },
  { labelKey: 'normal', value: 1.0 },
  { labelKey: 'large', value: 1.25 },
  { labelKey: 'very_large', value: 1.5 },
  { labelKey: 'maximum', value: 1.85 },
];
const DEFAULT_SCALE = 1.5;
const FONT_SCALE_KEY = 'typikon-font-scale';

function useFontScale() {
  const [scale, setScale] = useState(DEFAULT_SCALE);

  useEffect(() => {
    const saved = localStorage.getItem(FONT_SCALE_KEY);
    if (saved) setScale(parseFloat(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(FONT_SCALE_KEY, String(scale));
    document.documentElement.style.setProperty('--reading-scale', String(scale));
  }, [scale]);

  return [scale, setScale] as const;
}

/* ─── Service Types ─── */
const SERVICE_TYPES = [
  'vespers', 'matins', 'vigil', 'hours', 'liturgy',
  'compline', 'midnight_office', 'typica', 'presanctified',
];

/* ─── SVG Icons ─── */
function CalendarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function ListIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
}

/* ─── Shared Content Renderer ─── */
function ServiceContent({ assembled, dayInfo, error, serviceType, t, locale }: {
  assembled: AssembledServiceResponse | null;
  dayInfo: any;
  error: string | null;
  serviceType: string;
  t: any;
  locale: string;
}) {
  if (error) {
    return (
      <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', padding: '12px 0' }}>
        {error}
      </div>
    );
  }

  if (!assembled) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="divider">✦ ✦ ✦</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 400, color: 'var(--fg)', margin: '16px 0 8px' }}>
          {t.home.title}
        </h1>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', color: 'var(--muted)', maxWidth: 420, margin: '0 auto' }}>
          {t.home.description}
        </p>
      </div>
    );
  }

  const blocks = assembled.blocks ?? [];
  const lections = assembled.lections ?? {};
  const patronTroparia = assembled.patron_troparia ?? { has_patron: false };

  return (
    <>
      {/* Title Block */}
      <div className="title-block">
        <h1>
          {(t.service_types as Record<string, string>)[serviceType] || serviceType}
        </h1>
        {dayInfo && (
          <div className="subtitle">
            {(t.days_of_week as Record<string, string>)[dayInfo.day_of_week_name] || dayInfo.day_of_week_name}
          </div>
        )}
        <div className="meta">
          {dayInfo && (
            <>
              {dayInfo.gregorian_date}
              {dayInfo.tone && ` · ${t.service.tone_label} ${dayInfo.tone}`}
              {dayInfo.fasting && ` · ${(t.fasting_types as Record<string, string>)[dayInfo.fasting] || dayInfo.fasting}`}
            </>
          )}
        </div>
      </div>

      <div className="divider">✦ ✦ ✦</div>

      {/* Patron Troparia */}
      {patronTroparia.has_patron && (
        <div id="section-patron" data-nav-title={t.service.patron_troparia} className="section">
          <span className="block-marker">TROPARIA</span>
          <h2 className="section-title">{t.service.patron_troparia}</h2>
          <div className="rubric">
            {patronTroparia.saint_name}
            {patronTroparia.dedication_type && ` (${patronTroparia.dedication_type})`}
          </div>
          {patronTroparia.troparion && (
            <div className="lit-text">
              <p className="red-init">
                {t.service.troparion_tone} {patronTroparia.troparion.tone}.{' '}
                {patronTroparia.troparion.text}
              </p>
            </div>
          )}
          {patronTroparia.kontakion && (
            <div className="lit-text">
              <p>
                {t.service.kontakion_tone} {patronTroparia.kontakion.tone}.{' '}
                {patronTroparia.kontakion.text}
              </p>
            </div>
          )}
          <div className="divider-line"><span>✦</span></div>
        </div>
      )}

      {/* Blocks */}
      {blocks.map((block, i) => (
        <div key={i} id={`section-${i}`} data-nav-title={block.title || block.slot_key} className="section">
          <span className="block-marker">{block.block_type}</span>
          <h2 className="section-title">{block.title || block.slot_key}</h2>
          {block.rubric && <div className="rubric">{block.rubric}</div>}

          {/* Lection */}
          {block.block_type === 'LECTION' && lections[block.slot_key] && (
            lections[block.slot_key].map((lec, li) => (
              <div key={`lec-${block.slot_key}-${li}`} className="lection">
                <div className="lection-ref">
                  {(t.books as Record<string, string>)[block.slot_key] || block.slot_key}
                  {' · '}
                  {lec.short_ref}
                  <span className="zachalo">Zachalo {lec.zachalo}</span>
                  {lec.is_paremia && <span className="paremia-label">Paremia</span>}
                </div>
                <div className="lit-text">
                  {lec.content ? (
                    <p className={li === 0 ? 'red-init' : ''}>
                      <strong className="incipit">{lec.title}</strong>{' '}
                      {lec.content}
                    </p>
                  ) : (
                    <p><strong className="incipit">{lec.title}</strong></p>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Generic content */}
          {block.content && (
            <div className="lit-text" dangerouslySetInnerHTML={{ __html: block.content }} />
          )}

          <div className="divider-line"><span>✦</span></div>
        </div>
      ))}
    </>
  );
}

/* ─── Main Page ─── */
export default function ServicePage() {
  const { locale, t } = useI18n();
  const { setTitle: setTopbarTitle } = useTopbarTitle();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState('liturgy');
  const [calendarStyle, setCalendarStyle] = useState<'new' | 'old'>('new');
  const [mode, setMode] = useState<'full' | 'ustav'>('full');
  const [templeId] = useState(1);
  const [fontScale, setFontScale] = useFontScale();
  const [assembled, setAssembled] = useState<AssembledServiceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile
  const [showTocSheet, setShowTocSheet] = useState(false);
  const [showServiceSheet, setShowServiceSheet] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const { data: litDay } = useApi<LiturgicalDay>(
    `/api/liturgical-day/${date}?calendar=${calendarStyle}`
  );

  const dayInfo = litDay ?? null;

  /* ─── Assemble ─── */
  const assemble = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<AssembledServiceResponse>('/api/assemble', {
        date,
        service_type: serviceType,
        calendar_style: calendarStyle,
        temple_id: templeId,
        mode,
      });
      setAssembled(res);
    } catch (e: any) {
      setError(e.message || 'Assembly failed');
    } finally {
      setLoading(false);
    }
  }, [date, serviceType, calendarStyle, templeId, mode]);

  /* ─── Set topbar title ─── */
  useEffect(() => {
    const serviceName = (t.service_types as Record<string, string>)[serviceType] || serviceType;
    setTopbarTitle(assembled ? serviceName : '');
  }, [assembled, serviceType, t, setTopbarTitle]);

  /* ─── Scroll spy ─── */
  const [activeSection, setActiveSection] = useState('');
  const [showRunningHeader, setShowRunningHeader] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowRunningHeader(window.scrollY > 200);
      setShowBackToTop(window.scrollY > 600);

      const sections = document.querySelectorAll('[data-nav-title]');
      let current = '';
      sections.forEach((sec) => {
        const el = sec as HTMLElement;
        if (el.getBoundingClientRect().top <= 120) {
          current = el.getAttribute('data-nav-title') || '';
        }
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Close dropdowns on outside click */
  const stopProp = (e: React.MouseEvent) => e.stopPropagation();
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      setShowFontMenu(false);
      setShowServicePicker(false);
    };
    if (showFontMenu || showServicePicker) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showFontMenu, showServicePicker]);

  /* ─── Derived: section list for TOC ─── */
  const sections = assembled?.blocks?.map((block, i) => ({
    id: `section-${i}`,
    title: block.title || block.slot_key,
  })) ?? [];

  /* ─── Scroll to section ─── */
  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════
          DESKTOP: Sidebar + Content
          ═══════════════════════════════════════ */}
      <div className="desktop-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-label">{t.service.service_order}</div>
          {sections.map((sec) => (
            <div
              key={sec.id}
              className={`sidebar-item ${activeSection === sec.title ? 'active' : ''}`}
              onClick={() => scrollToSection(sec.id)}
            >
              {sec.title}
            </div>
          ))}
          {sections.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', padding: '12px 24px' }}>
              {t.service.assemble_prompt}
            </div>
          )}

          {/* Sidebar Stats */}
          <div className="sidebar-stats">
            {assembled && (
              <>
                <span className="sidebar-stat">📄 {sections.length} {t.service.sections}</span>
              </>
            )}
          </div>
        </div>

        {/* Controls Strip */}
        <div className="controls-strip">
          {/* Service Picker */}
          <div className="chip-wrapper" onClick={stopProp}>
            <button
              className="chip"
              onClick={() => setShowServicePicker(!showServicePicker)}
            >
              <BookIcon size={12} />
              {(t.service_types as Record<string, string>)[serviceType] || serviceType}
            </button>
            {showServicePicker && (
              <div className="chip-dropdown open">
                {SERVICE_TYPES.map((st) => (
                  <button
                    key={st}
                    className={`chip-dropdown-item ${st === serviceType ? 'active' : ''}`}
                    onClick={() => { setServiceType(st); setShowServicePicker(false); }}
                  >
                    {(t.service_types as Record<string, string>)[st] || st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="chip-wrapper" onClick={stopProp}>
            <button
              className={`chip ${showFontMenu ? '' : ''}`}
              onClick={() => {}}
            >
              <CalendarIcon size={12} />
              {calendarStyle === 'new' ? t.service.new_calendar : t.service.old_calendar}
            </button>
          </div>

          {/* Calendar Toggle */}
          <div className="pill-group">
            <button
              className={`pill ${calendarStyle === 'new' ? 'active' : ''}`}
              onClick={() => setCalendarStyle('new')}
            >
              {t.service.new_calendar}
            </button>
            <button
              className={`pill ${calendarStyle === 'old' ? 'active' : ''}`}
              onClick={() => setCalendarStyle('old')}
            >
              {t.service.old_calendar}
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="pill-group">
            <button
              className={`pill ${mode === 'full' ? 'active' : ''}`}
              onClick={() => setMode('full')}
            >
              {t.service.mode_full}
            </button>
            <button
              className={`pill ${mode === 'ustav' ? 'active' : ''}`}
              onClick={() => setMode('ustav')}
            >
              {t.service.mode_ustav}
            </button>
          </div>

          {/* Assemble Button */}
          <button
            className="btn-assemble"
            onClick={assemble}
            disabled={loading}
          >
            {loading ? '…' : t.service.assemble}
          </button>
        </div>

        {/* Text Column */}
        <div className="text-column" ref={contentRef}>
          {/* Running Header */}
          <div className={`running-header ${showRunningHeader ? 'visible' : ''}`}>
            <span>{activeSection ? sections.find(s => s.id === activeSection)?.title : ''}</span>
            <span>{date}</span>
          </div>

          {/* Shared Content */}
          <ServiceContent
            assembled={assembled}
            dayInfo={dayInfo}
            error={error}
            serviceType={serviceType}
            t={t}
            locale={locale}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          MOBILE: Content + Bottom Bar + Sheets
          ═══════════════════════════════════════ */}
      <div className="mobile-content">
        {/* Mobile Text Column */}
        <div className="mobile-text-column">
          <ServiceContent
            assembled={assembled}
            dayInfo={dayInfo}
            error={error}
            serviceType={serviceType}
            t={t}
            locale={locale}
          />
        </div>
      </div>

      {/* Mobile Bottom Bar: Book | ✦ | List */}
      <div className="bottom-bar">
        <button className="bottom-action" onClick={() => setShowServiceSheet(true)} title={t.nav.service}>
          <BookIcon size={22} />
        </button>
        <button
          className={`bottom-action-center ${showMobileSettings ? 'active' : ''}`}
          onClick={() => setShowMobileSettings(!showMobileSettings)}
          title="Réglages"
        >
          ✦
        </button>
        <button className="bottom-action" onClick={() => setShowTocSheet(true)} title={t.service.toc}>
          <ListIcon size={22} />
        </button>
      </div>

      {/* Mobile TOC Sheet */}
      <div className={`bottom-sheet-overlay ${showTocSheet ? 'open' : ''}`} onClick={() => setShowTocSheet(false)} />
      <div className={`bottom-sheet ${showTocSheet ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-title">{t.service.toc}</div>
        {sections.map((sec) => (
          <div
            key={sec.id}
            className={`sheet-item ${activeSection === sec.id ? 'active' : ''}`}
            onClick={() => { scrollToSection(sec.id); setShowTocSheet(false); }}
          >
            <span className="sheet-item-text">{sec.title}</span>
          </div>
        ))}
        {sections.length === 0 && (
          <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', padding: '12px 0', textAlign: 'center' }}>
            {t.service.assemble_prompt}
          </div>
        )}
      </div>

      {/* Mobile Service Picker Sheet */}
      <div className={`bottom-sheet-overlay ${showServiceSheet ? 'open' : ''}`} onClick={() => setShowServiceSheet(false)} />
      <div className={`bottom-sheet ${showServiceSheet ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-title">{t.nav.service}</div>
        {SERVICE_TYPES.map((st) => (
          <div
            key={st}
            className={`sheet-item ${st === serviceType ? 'active' : ''}`}
            onClick={() => { setServiceType(st); setShowServiceSheet(false); }}
          >
            <span className="sheet-item-text">{(t.service_types as Record<string, string>)[st] || st}</span>
          </div>
        ))}
      </div>

      {/* Mobile Settings Sheet */}
      <div className={`bottom-sheet-overlay ${showMobileSettings ? 'open' : ''}`} onClick={() => setShowMobileSettings(false)} />
      <div className={`bottom-sheet ${showMobileSettings ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-title">Réglages</div>

        {/* Calendar */}
        <div className="settings-group">
          <div className="settings-label">{t.service.new_calendar}/{t.service.old_calendar}</div>
          <div className="pill-group">
            <button
              className={`pill ${calendarStyle === 'new' ? 'active' : ''}`}
              onClick={() => setCalendarStyle('new')}
            >
              {t.service.new_calendar}
            </button>
            <button
              className={`pill ${calendarStyle === 'old' ? 'active' : ''}`}
              onClick={() => setCalendarStyle('old')}
            >
              {t.service.old_calendar}
            </button>
          </div>
        </div>

        {/* Mode */}
        <div className="settings-group">
          <div className="settings-label">{t.service.mode_full}/{t.service.mode_ustav}</div>
          <div className="pill-group">
            <button
              className={`pill ${mode === 'full' ? 'active' : ''}`}
              onClick={() => setMode('full')}
            >
              {t.service.mode_full}
            </button>
            <button
              className={`pill ${mode === 'ustav' ? 'active' : ''}`}
              onClick={() => setMode('ustav')}
            >
              {t.service.mode_ustav}
            </button>
          </div>
        </div>

        {/* Date */}
        <div className="settings-group">
          <div className="settings-label">Date</div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="date-input"
            style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
          />
        </div>

        {/* Font Scale */}
        <div className="settings-group">
          <div className="settings-label">Aa</div>
          <div className="pill-group">
            {FONT_SCALES.map((s) => (
              <button
                key={s.value}
                className={`pill ${fontScale === s.value ? 'active' : ''}`}
                onClick={() => setFontScale(s.value)}
              >
                {s.labelKey === 'small' ? 'A' : s.labelKey === 'normal' ? 'Aa' : s.labelKey === 'large' ? 'Aa+' : s.labelKey === 'very_large' ? 'AA' : 'AAA'}
              </button>
            ))}
          </div>
        </div>

        {/* Assemble */}
        <button
          className="btn-assemble"
          onClick={assemble}
          disabled={loading}
          style={{ width: '100%', marginTop: '8px' }}
        >
          {loading ? '…' : t.service.assemble}
        </button>
      </div>

      {/* Back to Top */}
      <button
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </>
  );
}