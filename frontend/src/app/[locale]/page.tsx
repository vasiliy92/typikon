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

      {/* Service Blocks — continuous flow */}
      {blocks.map((block, i) => (
        <div
          key={`${block.slot_key}-${i}`}
          id={`section-${i}`}
          data-nav-title={block.title || block.slot_key}
          className="section"
        >
          <span className="block-marker">{block.block_type.toUpperCase()}</span>
          {block.title && <h2 className="section-title">{block.title}</h2>}
          {block.rubric && <div className="rubric">{block.rubric}</div>}
          {block.content && (
            <div className="lit-text">
              <p className={i === 0 && !patronTroparia?.has_patron ? 'red-init' : ''}>{block.content}</p>
            </div>
          )}
          {block.content_translated && (
            <div className="lit-text" style={{ color: 'var(--muted)', fontSize: '0.9em', marginTop: '4px' }}>
              <p>{block.content_translated}</p>
            </div>
          )}
          <div className="divider-line"><span>✦</span></div>
        </div>
      ))}

      {/* Lections — continuous flow */}
      {Object.keys(lections).length > 0 && (
        <>
          {Object.entries(lections).map(([book, lections]) => (
            <div key={book}>
              {lections.map((lec, li) => {
                const sectionId = `lection-${book}-${li}`;
                return (
                  <div
                    key={sectionId}
                    id={sectionId}
                    data-nav-title={lec.short_ref}
                    className="section"
                  >
                    <span className="block-marker">LECTION</span>
                    <div className="lection">
                      <div className="lection-ref">
                        {(t.books as Record<string, string>)[book] || book}
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
                    <div className="divider-line"><span>✦</span></div>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}
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
  const [assembled, setAssembled] = useState<AssembledServiceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Update topbar breadcrumb with service name */
  useEffect(() => {
    if (assembled) {
      const serviceName = (t.service_types as Record<string, string>)[serviceType] || serviceType;
      setTopbarTitle(serviceName);
    } else {
      setTopbarTitle('');
    }
  }, [assembled, serviceType, t, setTopbarTitle]);

  const [fontScale, setFontScale] = useFontScale();
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showRunningHeader, setShowRunningHeader] = useState(false);

  // Mobile
  const [showTocSheet, setShowTocSheet] = useState(false);
  const [showServiceSheet, setShowServiceSheet] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const { data: litDay } = useApi<LiturgicalDay>(
    `/calendar/date/${date}?style=${calendarStyle}`
  );

  const assemble = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // UI locale → service language (backend only supports fr/ru for now)
      const lang = locale === 'ru' ? 'ru' : 'fr';
      const result = await apiPost<AssembledServiceResponse>(
        `/service/assemble?target_date=${date}&service_type=${serviceType}&temple_id=${templeId}&language=${lang}&calendar_style=${calendarStyle}&mode=${mode}`,
        {}
      );
      setAssembled(result);
    } catch (err: any) {
      setError(err.message || t.app.error);
      setAssembled(null);
    } finally {
      setLoading(false);
    }
  }, [date, serviceType, templeId, locale, calendarStyle, mode, t]);

  /* ─── Scroll Observer ─── */
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollY / docHeight : 0);
      setShowRunningHeader(scrollY > 400);
      setShowBackToTop(scrollY > 600);

      const sections = document.querySelectorAll('[data-nav-title]');
      for (let i = sections.length - 1; i >= 0; i--) {
        if ((sections[i] as HTMLElement).offsetTop - 120 <= scrollY) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ─── Close dropdowns on outside click ─── */
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
    type: block.block_type,
  })) || [];

  const dayInfo = litDay || assembled?.liturgical_day;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      {/* ─── Progress Bar ─── */}
      <div className="progress-bar" style={{ width: `${scrollProgress * 100}%` }} />

      {/* ═══════════════════════════════════════
          DESKTOP: Sidebar
          ═══════════════════════════════════════ */}
      <aside className="sidebar">
        {assembled && sections.length > 0 ? (
          <>
            <div className="sidebar-label">{t.service.service_order}</div>
            {sections.map((sec, i) => (
              <a
                key={sec.id}
                className={`sidebar-item ${activeSection === sec.id ? 'active' : ''}`}
                onClick={() => scrollToSection(sec.id)}
              >
                <span className="sidebar-item-num">{i + 1}</span>
                <span className="sidebar-item-text">{sec.title}</span>
              </a>
            ))}
            <div className="sidebar-divider" />
            <div className="sidebar-stats">
              <span className="sidebar-stat">📄 {sections.length} {t.service.sections}</span>
            </div>
          </>
        ) : (
          <div style={{ padding: '0 20px', color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontSize: '0.75rem' }}>
            {t.service.assemble_prompt}
          </div>
        )}
      </aside>

      {/* ═══════════════════════════════════════
          DESKTOP: Content Area
          ═══════════════════════════════════════ */}
      <div className="content-area">
        {/* Controls Bar */}
        <div className="controls-bar">
          {/* Service Picker */}
          <div className="service-picker" onClick={stopProp}>
            <button
              className={`service-picker-trigger ${showServicePicker ? 'open' : ''}`}
              onClick={() => setShowServicePicker(!showServicePicker)}
            >
              {(t.service_types as Record<string, string>)[serviceType] || serviceType}
              <span className="arrow">▾</span>
            </button>
            {showServicePicker && (
              <div className="service-picker-dropdown open">
                <div className="service-picker-group-label">{t.service.daily_cycle}</div>
                {SERVICE_TYPES.map((st) => (
                  <div
                    key={st}
                    className={`service-picker-item ${st === serviceType ? 'active' : ''}`}
                    onClick={() => { setServiceType(st); setShowServicePicker(false); }}
                  >
                    {(t.service_types as Record<string, string>)[st] || st}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date Input */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="date-input"
          />

          {/* Calendar Pill Group */}
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

          {/* Mode Pill Group */}
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
          <div className="settings-label">{t.service.calendar_style}</div>
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
          <div className="settings-label">{t.service.mode_label}</div>
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