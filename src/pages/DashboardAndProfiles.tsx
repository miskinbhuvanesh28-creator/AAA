import React, { useEffect, useState } from 'react';
import { Download, Edit2, Plus, Star, Trash2, Upload } from 'lucide-react';
import { ChartRenderer } from '../components/ChartsSVG.tsx';
import { useApp } from '../context/AppContext.tsx';
import { NAK_NAMES, pName, sName } from '../engine/constants.ts';
import { findActiveVimshottari } from '../engine/dasha.ts';
import { formatDms, jdToLocalDate } from '../engine/ephemeris.ts';
import { computeTransitReport } from '../engine/gocharaVarshaRect.ts';
import { tr } from '../engine/i18n.ts';
import { computeFullPanchanga } from '../engine/panchanga.ts';
import type { BirthProfile, Language, PlanetId } from '../engine/types.ts';

function tx(lang: Language, te: string, en: string, hi?: string): string {
  if (lang === 'te') return te;
  if (lang === 'hi' && hi) return hi;
  return en;
}

export const DashboardPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const {
    lang,
    activeProfile,
    profiles,
    setActiveProfileId,
    chart,
    chartStyle,
    navigate,
    openProfileModal,
    notifications,
    markNotificationRead,
    bookmarks,
    savedReports,
  } = useApp();

  const [convs, setConvs] = useState<{ id: string; title: string; updated_at: string }[]>([]);

  useEffect(() => {
    void fetch('/api/gemini/conversations')
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((d: { conversations?: typeof convs }) => setConvs(d.conversations || []));
  }, []);

  const activeDasha = findActiveVimshottari(chart.p[1], chart.t0);
  const now = new Date();
  const todayPanchanga = computeFullPanchanga(
    {
      y: now.getFullYear(),
      m: now.getMonth() + 1,
      d: now.getDate(),
      hh: now.getHours(),
      mi: now.getMinutes(),
      ss: 0,
      lat: activeProfile.lat,
      lon: activeProfile.lon,
      tz: activeProfile.tz,
      ay: chart.config.ay,
    },
    chart.config,
  );
  const transitReport = computeTransitReport(chart);
  const curYearStr = String(now.getFullYear());
  const activeShaniPhase =
    transitReport.shaniPhases.find((p) => p.from <= curYearStr && p.to >= curYearStr) || transitReport.shaniPhases[0];

  const isTe = lang === 'te';

  if (subTab === 'daily-panchanga') {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {tx(lang, 'నేటి పంచాంగ సారాంశం', 'Daily Panchanga Snapshot', 'दैनिक पंचांग सारांश')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeProfile.place} · {isTe ? todayPanchanga.samvatsaraTe : todayPanchanga.samvatsara} ·{' '}
                {isTe ? todayPanchanga.masaTe : todayPanchanga.masaEn} (
                {isTe ? todayPanchanga.chart.pan.paksha : todayPanchanga.chart.pan.pakshaEn})
              </p>
              {todayPanchanga.isAdhikaMasa && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {isTe ? todayPanchanga.adhikaMasaNoteTe : todayPanchanga.adhikaMasaNoteEn}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('panchanga', 'today')}
              className="px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
            >
              {tx(lang, 'సంపూర్ణ పంచాంగం తెరువు', 'Open Full Panchanga', 'पूर्ण पंचांग खोलें')}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <div className="text-slate-500">{tx(lang, 'వారం', 'Vara', 'वार')}</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {isTe ? todayPanchanga.varaTe : todayPanchanga.varaEn}
              </div>
            </div>
            <div>
              <div className="text-slate-500">{tx(lang, 'తిథి', 'Tithi', 'तिथि')}</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {isTe ? todayPanchanga.chart.pan.tithi : todayPanchanga.chart.pan.tithiEn} (
                {todayPanchanga.chart.pan.tithiPct.toFixed(0)}%)
              </div>
            </div>
            <div>
              <div className="text-slate-500">{tr(lang, 'nakshatra')}</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {NAK_NAMES[lang]?.[todayPanchanga.chart.pan.nk] || NAK_NAMES.en[todayPanchanga.chart.pan.nk]} (
                {todayPanchanga.chart.pan.nkPct.toFixed(0)}%)
              </div>
            </div>
            <div>
              <div className="text-slate-500">{tx(lang, 'రాహు కాలం', 'Rahu Kalam', 'राहु काल')}</div>
              <div className="font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                {todayPanchanga.rahuKalam}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subTab === 'notifications') {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-6 text-xs text-slate-500">
            {tx(lang, 'ప్రస్తుతం నోటిఫికేషన్లు లేవు.', 'No notifications right now.', 'अभी कोई सूचना नहीं है।')}
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</div>
                <div className="text-slate-500 mt-0.5">{n.message}</div>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => void markNotificationRead(n.id)}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  {tx(lang, 'చదివినట్లు గుర్తించు', 'Mark Read', 'पढ़ा हुआ चिह्नित करें')}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  if (subTab === 'favorites') {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        {bookmarks.length === 0 ? (
          <div className="p-6 text-xs text-slate-500">
            {tx(
              lang,
              'ఇష్టమైనవి ఇంకా సేవ్ చేయబడలేదు. శీఘ్ర సూచనల కోసం శాస్త్ర గ్రంథాలయ వ్యాసాలను బుక్‌మార్క్ చేయండి.',
              'No saved favorites yet. Bookmark articles in the Knowledge Library to keep quick references here.',
              'अभी कोई पसंदीदा सहेजा नहीं गया है। त्वरित संदर्भ के लिए ज्ञान पुस्तकालय से लेख बुकमार्क करें।',
            )}
          </div>
        ) : (
          bookmarks.map((b) => (
            <div key={b.id} className="p-4 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{b.title}</div>
                <div className="text-slate-500">
                  {b.item_type} · {b.meta}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('knowledge', 'encyclopedia')}
                className="text-amber-700 dark:text-amber-400 hover:underline"
              >
                {tx(lang, 'తెరువు', 'Open', 'खोलें')}
              </button>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">{tr(lang, 'lagna')}</div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {sName(chart.lagS, lang)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">{formatDms(chart.lag % 30)}</div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {tr(lang, 'rashi')} & {tr(lang, 'nakshatra')}
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{sName(chart.s[1], lang)}</div>
          <div className="mt-1 text-xs text-slate-500">
            {NAK_NAMES[lang]?.[chart.pan.nk] || NAK_NAMES.en[chart.pan.nk]} · {tx(lang, 'పాదం', 'Pada', 'पद')}{' '}
            {chart.rows[1].pada}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">{tr(lang, 'activeDasha')}</div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {activeDasha.maha
              ? `${pName(activeDasha.maha.lord as PlanetId, lang)} / ${pName(activeDasha.antar.lord as PlanetId, lang)}`
              : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {activeDasha.pratyantar
              ? `${pName(activeDasha.pratyantar.lord as PlanetId, lang)} ${tx(lang, 'ప్రత్యంతర · ముగింపు', 'PD · ends', 'प्रत्यंतर · समाप्त')} ${jdToLocalDate(activeDasha.pratyantar.end / 864e5 + 2440587.5, activeProfile.tz)}`
              : ''}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {tx(lang, 'నేటి పంచాంగం', 'Daily Panchanga', 'दैनिक पंचांग')}
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {isTe ? todayPanchanga.chart.pan.tithi : todayPanchanga.chart.pan.tithiEn}
          </div>
          <div className="mt-1 text-xs text-slate-500 truncate">
            {isTe ? todayPanchanga.varaTe : todayPanchanga.varaEn} ·{' '}
            {NAK_NAMES[lang]?.[todayPanchanga.chart.pan.nk] || NAK_NAMES.en[todayPanchanga.chart.pan.nk]}
          </div>
        </div>
      </div>

      {/* Main Split: Interactive Chart + Workspace Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {tx(lang, 'D1 జన్మ కుండలి', 'D1 Natal Chart', 'D1 जन्म कुंडली')} — {activeProfile.name}
              </h2>
              <p className="text-xs text-slate-500">
                {sName(chart.lagS, lang)} {tx(lang, 'లగ్నం', 'Lagna', 'लग्न')} · {chartStyle.toUpperCase()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('horoscope', 'complete-chart')}
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
            >
              {tx(lang, 'పూర్తి జాతకం', 'Full Horoscope', 'पूर्ण कुंडली')}
            </button>
          </div>
          <ChartRenderer
            style={chartStyle}
            data={{
              lagnaSign: chart.lagS,
              signsByPlanet: chart.s,
              retroFlags: chart.rows.map((r) => r.retro),
              combustFlags: chart.rows.map((r) => r.combust),
            }}
            title={`D1 · ${sName(chart.lagS, lang)}`}
            subtitle={activeProfile.name}
            lang={lang}
            cusps={chart.cu}
            rows={chart.rows}
            outerPlanets={chart.outerPlanets}
          />
        </div>

        <div className="lg:col-span-7 space-y-5">
          {/* Quick Actions */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              {tx(lang, 'శీఘ్ర జ్యోతిష విభాగాలు', 'Quick Astrology Workflows', 'त्वरित ज्योतिष मॉड्यूल')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                {
                  label: tx(lang, '23 వర్గ చక్రాలు (D1–D144)', '23 Divisional Charts (D1–D144)', '23 वर्ग कुंडली (D1–D144)'),
                  cat: 'divisional-charts',
                  sub: 'varga-overview',
                },
                {
                  label: tx(lang, 'షడ్బలం & వింశోపక', 'Shadbala & Vimsopaka', 'षड्बल और विंशोपक'),
                  cat: 'planetary-strength',
                  sub: 'shadbala',
                },
                {
                  label: tx(lang, 'KP సబ్-లార్డ్ & హోరరీ', 'KP Sub-Lords & Horary', 'KP सब-लॉर्ड व होररी'),
                  cat: 'kp-astrology',
                  sub: 'overview',
                },
                {
                  label: tx(lang, 'వివాహ పొంతన (అష్టకూట)', 'Ashtakoota Matching', 'अष्टकूट मिलान'),
                  cat: 'compatibility',
                  sub: 'ashtakoota',
                },
                {
                  label: tx(lang, 'ముహూర్త శోధన', 'Muhurta Search', 'मुहूर्त खोज'),
                  cat: 'muhurta',
                  sub: 'range-search',
                },
                {
                  label: tx(lang, 'AI జ్యోతిష గురు', 'Ask AI Astrologer', 'AI ज्योतिषी से पूछें'),
                  cat: 'ai-astrologer',
                  sub: 'chat',
                },
              ].map((a) => (
                <button
                  key={a.cat}
                  type="button"
                  onClick={() => navigate(a.cat, a.sub)}
                  className="text-left p-2.5 rounded-md border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 font-medium text-slate-800 dark:text-slate-200 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Saved Profiles + Recent Transits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {tx(lang, 'సేవ్ చేసిన జాతకాలు', 'Saved Birth Profiles', 'सहेजी गई कुंडलियां')}
                </h3>
                <button
                  type="button"
                  onClick={() => openProfileModal('create')}
                  className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                >
                  + {tx(lang, 'జోడించు', 'Add', 'जोड़ें')}
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {profiles.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveProfileId(p.id)}
                    className={`w-full text-left py-2 flex items-center justify-between gap-2 ${
                      p.id === activeProfile.id
                        ? 'text-amber-700 dark:text-amber-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                      {p.y}-{String(p.m).padStart(2, '0')}-{String(p.d).padStart(2, '0')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {tx(lang, 'ప్రస్తుత గోచార స్థితి', 'Upcoming & Active Transits', 'वर्तमान गोचर स्थिति')}
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('gochara', 'current')}
                  className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                >
                  {tx(lang, 'గోచారం తెరువు', 'Open Gochara', 'गोचर खोलें')}
                </button>
              </div>
              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400">{tx(lang, 'శని సంచార దశ:', 'Shani Window:', 'शनि दशा:')}</span>{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {activeShaniPhase
                      ? `${activeShaniPhase.type} (${activeShaniPhase.from})`
                      : tx(lang, 'సామాన్య దశ', 'Neutral Phase', 'सामान्य चरण')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">
                    {tx(lang, 'ద్వంద్వ గోచార భావాలు:', 'Double Transit Houses:', 'दोहरा गोचर भाव:')}
                  </span>{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100 font-mono">
                    {transitReport.doubleTransitHouses.length
                      ? transitReport.doubleTransitHouses.map((h) => `H${h}`).join(', ')
                      : tx(lang, 'మిశ్రమ ప్రభావం', 'Mixed activation', 'मिश्रित')}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                  <span>
                    {tx(lang, 'నివేదికలు:', 'Saved Reports:', 'रिपोर्ट:')} {savedReports.length}
                  </span>
                  <span>
                    {tx(lang, 'AI చర్చలు:', 'AI Threads:', 'AI संवाद:')} {convs.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BirthProfilesPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const {
    profiles,
    activeProfile,
    setActiveProfileId,
    openProfileModal,
    deleteProfile,
    saveProfile,
    navigate,
    lang,
  } = useApp();

  const [compareId, setCompareId] = useState<string>(() => profiles[1]?.id || profiles[0]?.id || '');

  const showArchived = subTab === 'archived-profiles';
  const visibleProfiles = profiles.filter((p) => (showArchived ? p.isArchived : !p.isArchived));

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'astrojyotish-profiles.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (subTab === 'profile-comparison') {
    const target = profiles.find((p) => p.id === compareId) || profiles[0];
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            {tx(lang, 'ప్రస్తుత జాతకం', 'Comparing Active Profile', 'सक्रिय कुंडली')}{' '}
            <span className="font-semibold">{activeProfile.name}</span>{' '}
            {tx(lang, 'తో పోల్చబడుతున్నది:', 'with:', 'के साथ तुलना:')}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={compareId}
              onChange={(e) => setCompareId(e.target.value)}
              className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => navigate('compatibility', 'ashtakoota')}
              className="px-3 py-1.5 rounded bg-amber-600 text-white font-medium hover:bg-amber-700"
            >
              {tx(lang, 'వివాహ పొంతన చూడండి', 'Run Marriage Compatibility', 'विवाह मिलान देखें')}
            </button>
          </div>
        </div>

        {target && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">{tx(lang, 'వివరం', 'Attribute', 'विवरण')}</th>
                  <th className="px-4 py-2.5">{activeProfile.name}</th>
                  <th className="px-4 py-2.5">{target.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                <tr>
                  <td className="px-4 py-2 text-slate-500">
                    {tx(lang, 'జన్మ తేదీ & సమయం', 'Birth Date & Time', 'जन्म तिथि व समय')}
                  </td>
                  <td className="px-4 py-2 font-mono">{`${activeProfile.y}-${String(activeProfile.m).padStart(2, '0')}-${String(activeProfile.d).padStart(2, '0')} ${String(activeProfile.hh).padStart(2, '0')}:${String(activeProfile.mi).padStart(2, '0')}`}</td>
                  <td className="px-4 py-2 font-mono">{`${target.y}-${String(target.m).padStart(2, '0')}-${String(target.d).padStart(2, '0')} ${String(target.hh).padStart(2, '0')}:${String(target.mi).padStart(2, '0')}`}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-slate-500">{tr(lang, 'birthPlace')}</td>
                  <td className="px-4 py-2">{activeProfile.place}</td>
                  <td className="px-4 py-2">{target.place}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-slate-500">
                    {tx(lang, 'అక్షాంశ, రేఖాంశాలు', 'Coordinates', 'निर्देशांक')}
                  </td>
                  <td className="px-4 py-2 font-mono">{`${activeProfile.lat.toFixed(3)}, ${activeProfile.lon.toFixed(3)}`}</td>
                  <td className="px-4 py-2 font-mono">{`${target.lat.toFixed(3)}, ${target.lon.toFixed(3)}`}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-500 tabular-nums">
          {visibleProfiles.length}{' '}
          {showArchived
            ? tx(lang, 'ఆర్కైవ్ చేసిన జాతకాలు', 'archived birth profiles', 'संग्रहीत कुंडलियां')
            : tx(lang, 'క్రియాశీల జన్మ జాతకాలు (SQLite)', 'active birth profiles stored in SQLite', 'सक्रिय कुंडलियां (SQLite)')}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => openProfileModal('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{tr(lang, 'newProfile')}</span>
          </button>
          <button
            type="button"
            onClick={() => openProfileModal('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{tr(lang, 'importJson')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{tr(lang, 'exportJson')}</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="px-4 py-2.5">{tx(lang, 'పేరు', 'Name', 'नाम')}</th>
              <th className="px-4 py-2.5">{tx(lang, 'తేదీ & సమయం', 'Date & Time', 'तिथि व समय')}</th>
              <th className="px-4 py-2.5">{tr(lang, 'birthPlace')}</th>
              <th className="px-4 py-2.5">{tx(lang, 'అక్షాంశ, రేఖాంశాలు (TZ)', 'Coords (Lat, Lon, TZ)', 'निर्देशांक (TZ)')}</th>
              <th className="px-4 py-2.5 text-right">{tr(lang, 'actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
            {visibleProfiles.map((p: BirthProfile) => {
              const isCurr = p.id === activeProfile.id;
              return (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProfileId(p.id);
                        navigate('horoscope', 'complete-chart');
                      }}
                      className="hover:text-amber-700 dark:hover:text-amber-400 text-left"
                    >
                      {p.name}
                      {isCurr && (
                        <span className="ml-2 text-[11px] text-amber-600 dark:text-amber-400">
                          ({tx(lang, 'ప్రస్తుతం', 'Active', 'सक्रिय')})
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    {`${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')} ${String(p.hh).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{p.place}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">
                    {`${p.lat.toFixed(2)}, ${p.lon.toFixed(2)} (${p.tz >= 0 ? '+' : ''}${p.tz})`}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveProfileId(p.id)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {tx(lang, 'ఎంచుకో', 'Select', 'चुनें')}
                      </button>
                      <button
                        type="button"
                        onClick={() => openProfileModal('edit', p)}
                        title={tr(lang, 'editProfile')}
                        className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveProfile({ isArchived: !p.isArchived }, p.id)}
                        title={
                          p.isArchived
                            ? tx(lang, 'పునరుద్ధరించు', 'Restore', 'पुनर्स्थापित करें')
                            : tx(lang, 'ఆర్కైవ్ చేయి', 'Archive', 'संग्रहीत करें')
                        }
                        className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      {profiles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => void deleteProfile(p.id)}
                          title={tr(lang, 'delete')}
                          className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
