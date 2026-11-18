import React, { useMemo, useState } from 'react';
import { ChartRenderer, WesternWheelChart } from '../components/ChartsSVG.tsx';
import { useApp } from '../context/AppContext.tsx';
import {
  GEMSTONE_MAP,
  LAL_KITAB_PAKKA,
  RUDRAKSHA_MAP,
  analyzeNumberString,
  buildMagicSquare,
  compareHoroscopes,
  computeNumerology,
  computeWesternAnalysis,
  computeWesternSecondaryProgressions,
  computeWesternSolarReturn,
  computeWesternSynastry,
} from '../engine/compatibilityNumerologyWestern.ts';
import { NAK_NAMES, SEVEN, pName, pShort, sName, sShort } from '../engine/constants.ts';
import { CITIES } from '../engine/data/coreData.ts';
import { formatDms } from '../engine/ephemeris.ts';
import { tr } from '../engine/i18n.ts';
import { computeKpHorary } from '../engine/kp.ts';
import { searchMuhurtaWindows, type MuhurtaEventType } from '../engine/panchanga.ts';
import { computeChart } from '../engine/parashari.ts';
import type { Language } from '../engine/types.ts';

function tx(lang: Language, te: string, en: string, hi?: string): string {
  if (lang === 'te') return te;
  if (lang === 'hi' && hi) return hi;
  return en;
}

const PRASHNA_DOMAINS: { id: string; te: string; en: string; houses: number[] }[] = [
  { id: 'career', te: 'వృత్తి / ఉద్యోగం (6, 10, 11)', en: 'Career & Promotion (6, 10, 11)', houses: [6, 10, 11] },
  { id: 'marriage', te: 'వివాహం / సంబంధం (2, 7, 11)', en: 'Marriage & Partnership (2, 7, 11)', houses: [2, 7, 11] },
  { id: 'finance', te: 'ధనం / పెట్టుబడి (2, 6, 11)', en: 'Wealth & Finance (2, 6, 11)', houses: [2, 6, 11] },
  { id: 'property', te: 'భూమి / గృహం / వాహనం (4, 11, 12)', en: 'Property & Vehicle (4, 11, 12)', houses: [4, 11, 12] },
  { id: 'education', te: 'విద్య / పరీక్షలు (4, 5, 9, 11)', en: 'Education & Exams (4, 5, 9, 11)', houses: [4, 5, 9, 11] },
  { id: 'health', te: 'ఆరోగ్యం / కోలుకోవడం (1, 5, 11)', en: 'Health & Recovery (1, 5, 11)', houses: [1, 5, 11] },
  { id: 'travel', te: 'ప్రయాణం / విదేశం (3, 9, 12)', en: 'Travel & Foreign (3, 9, 12)', houses: [3, 9, 12] },
];

export const CompatibilityPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { profiles, activeProfile, calcConfig, lang, navigate } = useApp();
  const isTe = lang === 'te';
  const [groomId, setGroomId] = useState(activeProfile.id);
  const [brideId, setBrideId] = useState(profiles.find((p) => p.id !== activeProfile.id)?.id || activeProfile.id);

  const groomProf = profiles.find((p) => p.id === groomId) || activeProfile;
  const brideProf = profiles.find((p) => p.id === brideId) || activeProfile;

  const groomChart = useMemo(() => computeChart({ ...groomProf, ay: calcConfig.ay }, calcConfig), [groomProf, calcConfig]);
  const brideChart = useMemo(() => computeChart({ ...brideProf, ay: calcConfig.ay }, calcConfig), [brideProf, calcConfig]);
  const cmp = useMemo(() => compareHoroscopes(groomChart, brideChart), [groomChart, brideChart]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5">
            <span className="text-slate-500">{tx(lang, 'వరుడు (A):', 'Partner A (Groom):', 'वर (A):')}</span>
            <select
              value={groomId}
              onChange={(e) => setGroomId(e.target.value)}
              className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-slate-500">{tx(lang, 'వధువు (B):', 'Partner B (Bride):', 'वधू (B):')}</span>
            <select
              value={brideId}
              onChange={(e) => setBrideId(e.target.value)}
              className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={() => navigate('reports', 'compatibility-report')}
          className="px-3 py-1.5 rounded bg-amber-600 text-white font-medium hover:bg-amber-700"
        >
          {tx(lang, 'వివాహ పొంతన నివేదిక', 'Generate Marriage Report', 'विवाह मिलान रिपोर्ट')}
        </button>
      </div>

      {/* Totals Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-slate-500">{tx(lang, 'అష్టకూట గుణాలు', 'Ashtakoota Score', 'अष्टकूट गुण')}</div>
          <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-amber-700 dark:text-amber-300">
            {cmp.koota.total} / 36
          </div>
          <div className="mt-1 text-slate-500">
            {cmp.koota.total >= 18
              ? tx(lang, 'శుభ పొంతన (≥18 గుణాలు)', 'Traditional Threshold Met (≥18)')
              : tx(lang, '18 గుణాల కంటే తక్కువ', 'Below 18 Gunas')}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-slate-500">{tx(lang, 'దశకూట పొంతనలు', 'Dashakoota Poruthams', 'दशकूट मिलान')}</div>
          <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {cmp.koota.dashakootaCount} / 10
          </div>
          <div className="mt-1 text-slate-500">{tx(lang, 'దక్షిణ భారత సంప్రదాయ పొంతన', 'South Indian Porutham Consensus')}</div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-slate-500">{tx(lang, 'కుజ దోష పరిశీలన', 'Kuja (Manglik) Alignment', 'मंगल दोष जांच')}</div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            A: {cmp.groomKuja.count}/3 · B: {cmp.brideKuja.count}/3
          </div>
          <div className="mt-1 text-slate-500 font-mono">{subTab}</div>
        </div>
      </div>

      {/* Ashtakoota & Dashakoota Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold">
              {tx(lang, 'అష్టకూట 36 గుణాల పట్టిక', 'Ashtakoota 36-Point Breakdown', 'अष्टकूट 36 गुण विवरण')}
            </h2>
          </div>
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {cmp.koota.items.map((k) => (
                <tr key={k.name}>
                  <td className="px-3 py-2 font-medium">{isTe ? k.nameTe : k.name}</td>
                  <td className="px-3 py-2 text-slate-500">{isTe ? k.noteTe : k.note}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {k.score} / {k.max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(isTe ? cmp.koota.exceptionsTe : cmp.koota.exceptions).length > 0 && (
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-t border-slate-100 dark:border-slate-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              {(isTe ? cmp.koota.exceptionsTe : cmp.koota.exceptions).map((ex, i) => (
                <div key={i}>
                  {tx(lang, 'మినహాయింపు గమనిక:', 'Exception Note:')} {ex}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold">
              {tx(lang, 'దశకూట (10 పొంతనలు) & సప్తమాధిపతి తనిఖీ', 'Dashakoota (10 Poruthams) & D1/7th Check')}
            </h2>
          </div>
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cmp.koota.dashakoota.map((d) => (
                <tr key={d.name}>
                  <td className="px-3 py-2 font-medium">{isTe ? d.nameTe : d.name}</td>
                  <td className="px-3 py-2 text-slate-500">{isTe ? d.noteTe : d.note}</td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      d.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {d.ok ? tx(lang, 'ఉత్తీర్ణం', 'Pass') : tx(lang, 'జాగ్రత్త', 'Caution')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div>
              {tx(lang, 'వరుని చంద్ర రాశి:', 'Partner A Moon:')} {isTe ? cmp.groomMoonTe : cmp.groomMoon} ·{' '}
              {tx(lang, '7వ అధిపతి:', '7th Lord:')} {isTe ? cmp.groom7thLordTe : cmp.groom7thLord}
            </div>
            <div>
              {tx(lang, 'వధువు చంద్ర రాశి:', 'Partner B Moon:')} {isTe ? cmp.brideMoonTe : cmp.brideMoon} ·{' '}
              {tx(lang, '7వ అధిపతి:', '7th Lord:')} {isTe ? cmp.bride7thLordTe : cmp.bride7thLord}
            </div>
            <div>
              {tx(lang, 'లగ్నాలు:', 'Lagnas:')} {sName(groomChart.lagS, lang)} / {sName(brideChart.lagS, lang)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MuhurtaPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { activeProfile, chart, calcConfig, lang } = useApp();
  const isTe = lang === 'te';
  const initialEvent: MuhurtaEventType =
    subTab === 'griha_pravesh' || subTab === 'grihapravesha'
      ? 'grihapravesha'
      : subTab === 'business' || subTab === 'travel' || subTab === 'vehicle' || subTab === 'education'
        ? subTab
        : 'marriage';
  const [eventType, setEventType] = useState<MuhurtaEventType>(initialEvent);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState(21);
  const [useNatalFilter, setUseNatalFilter] = useState(true);
  const [cityIdx, setCityIdx] = useState(0);

  const cityTuple = cityIdx > 0 ? CITIES[cityIdx - 1] : null;
  const windows = useMemo(() => {
    const loc = cityTuple
      ? { lat: cityTuple[2], lon: cityTuple[3], tz: cityTuple[4], ay: calcConfig.ay }
      : { lat: activeProfile.lat, lon: activeProfile.lon, tz: activeProfile.tz, ay: calcConfig.ay };
    return searchMuhurtaWindows(useNatalFilter ? chart.p[1] : null, startDate, days, eventType, loc, calcConfig);
  }, [cityTuple, activeProfile, calcConfig, useNatalFilter, chart.p, startDate, days, eventType]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <span className="text-slate-500">{tx(lang, 'కార్యం రకం', 'Event Type')}</span>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as MuhurtaEventType)}
            className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
          >
            <option value="marriage">{tx(lang, 'వివాహం / నిశ్చితార్థం', 'Marriage / Engagement')}</option>
            <option value="grihapravesha">{tx(lang, 'గృహ ప్రవేశం', 'Griha Pravesh')}</option>
            <option value="business">{tx(lang, 'వ్యాపార ప్రారంభం', 'Business Opening')}</option>
            <option value="vehicle">{tx(lang, 'వాహన కొనుగోలు', 'Vehicle Purchase')}</option>
            <option value="travel">{tx(lang, 'ప్రయాణం', 'Travel')}</option>
            <option value="education">{tx(lang, 'విద్యారంభం', 'Education / Vidyarambham')}</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-500">{tx(lang, 'ప్రారంభ తేదీ', 'Start Date')}</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 tabular-nums"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-500">{tx(lang, 'రోజులు', 'Window (Days)')}</span>
          <input
            type="number"
            min={7}
            max={45}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 21)}
            className="w-16 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 font-mono"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-slate-500">{tx(lang, 'ప్రాంతం', 'Location')}</span>
          <select
            value={cityIdx}
            onChange={(e) => setCityIdx(Number(e.target.value))}
            className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5"
          >
            <option value={0}>
              {tx(lang, 'ప్రొఫైల్', 'Profile')} ({activeProfile.place})
            </option>
            {CITIES.slice(0, 25).map((c, i) => (
              <option key={`${c[0]}-${i}`} value={i + 1}>
                {c[0]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={useNatalFilter} onChange={(e) => setUseNatalFilter(e.target.checked)} />
          <span>{tx(lang, 'తారా/చంద్ర బలంతో లెక్కించు', 'Score with Tara/Chandra Bala')}</span>
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {tx(
              lang,
              `శుభ ముహూర్త సమయాల పట్టిక (${windows.length} శుభ దినాలు)`,
              `Ranked Muhurta Windows (${windows.length} auspicious candidates)`,
            )}
          </h2>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="px-3 py-2">{tr(lang, 'date')}</th>
              <th className="px-3 py-2">{tx(lang, 'వారం & తిథి', 'Vara & Tithi')}</th>
              <th className="px-3 py-2">{tr(lang, 'nakshatra')}</th>
              <th className="px-3 py-2">{tx(lang, 'అభిజిత్ సమయం', 'Abhijit Window')}</th>
              <th className="px-3 py-2">{tx(lang, 'వర్జ్య రాహుకాలం', 'Avoid Rahu')}</th>
              <th className="px-3 py-2">{tx(lang, 'తారా / చంద్ర బలం', 'Tara / Chandra')}</th>
              <th className="px-3 py-2 text-right">{tr(lang, 'score')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
            {windows.map((w) => (
              <tr key={w.date}>
                <td className="px-3 py-2 font-mono font-semibold">{w.date}</td>
                <td className="px-3 py-2">
                  {isTe ? `${w.varaTe} · ${w.tithiTe}` : `${w.vara} · ${w.tithi}`}
                </td>
                <td className="px-3 py-2">{isTe ? w.nakshatraTe : w.nakshatra}</td>
                <td className="px-3 py-2 font-mono text-emerald-700 dark:text-emerald-400">{w.abhijit}</td>
                <td className="px-3 py-2 font-mono text-red-600 dark:text-red-400">{w.rahuAvoid}</td>
                <td className="px-3 py-2">
                  {isTe ? `${w.taraStatusTe} · ${w.chandraStatusTe}` : `${w.taraStatus} · ${w.chandraStatus}`}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-amber-700 dark:text-amber-300">
                  {w.score}/100
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const PrashnaPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { activeProfile, calcConfig, chartStyle, lang } = useApp();
  const isTe = lang === 'te';
  const [questionCat, setQuestionCat] = useState<string>('career');
  const [question, setQuestion] = useState(() =>
    isTe ? 'ఈ త్రైమాసికంలో నా ప్రయత్నం విజయవంతం అవుతుందా?' : 'Will the proposed venture succeed within this quarter?',
  );
  const [horaryNum, setHoraryNum] = useState(144);
  const [seedTime, setSeedTime] = useState(() => Date.now());

  const momentChart = useMemo(() => {
    const dt = new Date(seedTime + activeProfile.tz * 36e5);
    return computeChart(
      {
        ...activeProfile,
        y: dt.getUTCFullYear(),
        m: dt.getUTCMonth() + 1,
        d: dt.getUTCDate(),
        hh: dt.getUTCHours(),
        mi: dt.getUTCMinutes(),
        ss: dt.getUTCSeconds(),
      },
      calcConfig,
    );
  }, [seedTime, activeProfile, calcConfig]);

  const kpHorary = useMemo(() => computeKpHorary(horaryNum, activeProfile, calcConfig), [horaryNum, activeProfile, calcConfig]);

  const prashnaVerdict = useMemo(() => {
    const domain = PRASHNA_DOMAINS.find((d) => d.id === questionCat) || PRASHNA_DOMAINS[0];
    const subLord = kpHorary.entry.subLord;
    const subSigs = momentChart.kp.sig[subLord] || [];
    const moonRow = momentChart.rows.find((r) => r.id === 1)!;
    const moonSigs = momentChart.kp.sig[1] || [];
    const subMatches = subSigs.filter((h) => domain.houses.includes(h));
    const moonMatches = moonSigs.filter((h) => domain.houses.includes(h));
    const negativeHouses = [6, 8, 12].filter((h) => !domain.houses.includes(h));
    const negHits = subSigs.filter((h) => negativeHouses.includes(h));

    const score = subMatches.length * 2 + moonMatches.length - negHits.length;
    const verdictKey: 'yes' | 'mixed' | 'caution' = score >= 3 ? 'yes' : score >= 1 ? 'mixed' : 'caution';
    return {
      domain,
      subLord,
      subSigs,
      moonSubLord: moonRow.sub[1],
      subMatches,
      moonMatches,
      negHits,
      verdictKey,
    };
  }, [questionCat, kpHorary, momentChart]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            {tx(lang, 'ప్రశ్న & KP 1–249 హోరరీ పరిశీలన', 'Prashna & KP 1–249 Horary Consultation')} ({subTab})
          </h2>
          <button
            type="button"
            onClick={() => setSeedTime(Date.now())}
            className="px-3 py-1.5 rounded bg-amber-600 text-white font-medium hover:bg-amber-700"
          >
            {tx(lang, 'ప్రస్తుత క్షణ కుండలి వేయి', 'Cast Current Moment Chart')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-slate-500">{tx(lang, 'ప్రశ్న రంగం', 'Question Category')}</span>
            <select
              value={questionCat}
              onChange={(e) => setQuestionCat(e.target.value)}
              className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
            >
              {PRASHNA_DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>
                  {isTe ? d.te : d.en}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-3 flex flex-col gap-1">
            <span className="text-slate-500">{tx(lang, 'ప్రశ్న వివరం', 'Prashna Question')}</span>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={tx(lang, 'మీ ప్రశ్నను ఇక్కడ వ్రాయండి…', 'Enter exact Prashna question…')}
              className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-500 whitespace-nowrap">{tx(lang, 'సంఖ్య (1–249)', 'Horary # (1–249)')}</span>
            <input
              type="number"
              min={1}
              max={249}
              value={horaryNum}
              onChange={(e) => setHoraryNum(Math.min(249, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 font-mono"
            />
          </label>
        </div>
      </div>

      {/* KP Prashna Verdict Banner */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-400">
            {tx(lang, 'KP హోరరీ సబ్-లార్డ్ తీర్పు', 'KP Sub-Lord Prashna Verdict')}
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isTe ? prashnaVerdict.domain.te : prashnaVerdict.domain.en} —{' '}
            <span
              className={
                prashnaVerdict.verdictKey === 'yes'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : prashnaVerdict.verdictKey === 'mixed'
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-red-600 dark:text-red-400'
              }
            >
              {prashnaVerdict.verdictKey === 'yes'
                ? tx(lang, 'అనుకూల ఫలితం (కార్య సిద్ధి)', 'YES · Favorable Promise')
                : prashnaVerdict.verdictKey === 'mixed'
                  ? tx(lang, 'మిశ్రమం (కృషితో సాధ్యం)', 'MIXED · Conditional / Effort Needed')
                  : tx(lang, 'ఆలస్యం / జాగ్రత్త అవసరం', 'CAUTION · Obstacles / Delay')}
            </span>
          </div>
          <div className="text-slate-500">
            {tx(lang, 'హోరరీ సబ్-లార్డ్', 'Horary Sub-Lord')}:{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{pName(prashnaVerdict.subLord, lang)}</span>{' '}
            ({tx(lang, 'సూచించే భావాలు', 'signifies')} H{prashnaVerdict.subSigs.join(', H')}) ·{' '}
            {tx(lang, 'చంద్ర సబ్-లార్డ్', 'Moon Sub')}: {pShort(prashnaVerdict.moonSubLord, lang)}
          </div>
        </div>
        <div className="text-right font-mono tabular-nums">
          <div className="text-slate-400">{tx(lang, 'అనుకూల స్థానాలు', 'Domain Hits')}</div>
          <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {prashnaVerdict.subMatches.length ? `H${prashnaVerdict.subMatches.join(', H')}` : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-2">{tx(lang, 'తత్కాలిక ప్రశ్న కుండలి', 'Tatkalika Prashna Chart')}</h3>
          <ChartRenderer
            style={chartStyle === 'western' ? 'south' : chartStyle}
            data={{
              lagnaSign: momentChart.lagS,
              signsByPlanet: momentChart.s,
              retroFlags: momentChart.rows.map((r) => r.retro),
            }}
            title={`${tx(lang, 'ప్రశ్న', 'Prashna')} · ${sName(momentChart.lagS, lang)}`}
            subtitle={`${tx(lang, 'సంఖ్య', 'Horary')} #${kpHorary.entry.number}`}
            lang={lang}
          />
        </div>

        <div className="lg:col-span-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 text-xs">
          <h3 className="text-sm font-semibold">{tx(lang, 'హోరరీ & ప్రశ్న సమన్వయం', 'Horary & Prashna Synthesis')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400">{tx(lang, 'ప్రశ్న లగ్నం:', 'Prashna Lagna:')}</span>{' '}
              <span className="font-semibold">{sName(momentChart.lagS, lang)}</span>
            </div>
            <div>
              <span className="text-slate-400">
                {tx(lang, `హోరరీ లగ్నం (#${kpHorary.entry.number}):`, `Horary Ascendant (#${kpHorary.entry.number}):`)}
              </span>{' '}
              <span className="font-semibold">
                {sName(kpHorary.entry.sign, lang)} {formatDms(kpHorary.entry.startLon % 30)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'నక్షత్ర / సబ్ లార్డ్:', 'Star / Sub Lord:')}</span>{' '}
              <span className="font-semibold">
                {pShort(kpHorary.entry.starLord, lang)} / {pShort(kpHorary.entry.subLord, lang)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'చంద్ర స్థితి:', 'Moon Position:')}</span>{' '}
              <span className="font-semibold">
                {sName(momentChart.s[1], lang)} · {NAK_NAMES[lang]?.[momentChart.pan.nk]}
              </span>
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'తిథి / పక్షం:', 'Tithi:')}</span>{' '}
              <span className="font-semibold">{isTe ? momentChart.pan.tithi : momentChart.pan.tithiEn}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="font-semibold mb-1.5">
              {tx(lang, 'ప్రశ్న కాలంలో గ్రహాల భావ సూచికలు', 'Planetary House Significators at Question Time')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono">
              {momentChart.rows.map((r) => (
                <div key={r.id} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="font-sans font-medium">
                    {pName(r.id, lang)} ({tx(lang, 'సబ్:', 'Sub:')} {pShort(r.sub[1], lang)})
                  </span>
                  <span>{(momentChart.kp.sig[r.id] || []).join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NumerologyPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { activeProfile, lang } = useApp();
  const isTe = lang === 'te';
  const [nameInput, setNameInput] = useState(activeProfile.name);
  const [dobInput, setDobInput] = useState(
    `${activeProfile.y}-${String(activeProfile.m).padStart(2, '0')}-${String(activeProfile.d).padStart(2, '0')}`,
  );
  const [customString, setCustomString] = useState('TS09AB1234');
  const [magicOrder, setMagicOrder] = useState(3);

  const [y, m, d] = dobInput.split('-').map(Number);
  const num = useMemo(() => computeNumerology(nameInput, y || 1990, m || 1, d || 1), [nameInput, y, m, d]);
  const strResult = useMemo(() => analyzeNumberString(customString), [customString]);
  const magic = useMemo(() => buildMagicSquare(magicOrder), [magicOrder]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <label className="block">
          <span className="text-slate-500">{tx(lang, 'పూర్తి పేరు / వ్యాపార పేరు', 'Full Name / Business Name')}</span>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
          />
        </label>
        <label className="block">
          <span className="text-slate-500">{tr(lang, 'birthDate')}</span>
          <input
            type="date"
            value={dobInput}
            onChange={(e) => setDobInput(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-slate-500">{tx(lang, 'మొబైల్ / వాహన / ఇంటి సంఖ్య', 'Mobile / Vehicle / House Analyzer')}</span>
          <input
            value={customString}
            onChange={(e) => setCustomString(e.target.value)}
            className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 font-mono"
          />
        </label>
      </div>

      {/* Core Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
        {[
          { k: tx(lang, 'మూలాంకం (జన్మ సంఖ్య)', 'Moolank (Birth #)'), v: num.moolank },
          { k: tx(lang, 'భాగ్యాంకం (విధి సంఖ్య)', 'Bhagyank (Destiny)'), v: num.bhagyank },
          { k: tx(lang, 'జీవన మార్గ సంఖ్య', 'Life Path'), v: num.lifePath },
          { k: tx(lang, 'కల్డియన్ నామ సంఖ్య', 'Chaldean Name'), v: `${num.chaldeanCompound} → ${num.chaldeanRoot}` },
          { k: tx(lang, 'పైథాగరియన్ వ్యక్తీకరణ', 'Pythagorean Expr'), v: num.expression },
          { k: tx(lang, 'వ్యక్తిగత సంవత్సరం', 'Personal Year'), v: num.personalYear },
        ].map((item) => (
          <div key={item.k} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-slate-500">{item.k}</div>
            <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-amber-700 dark:text-amber-300">{item.v}</div>
          </div>
        ))}
      </div>

      {/* Lo Shu Grid + String Analyzer + Magic Square */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold mb-3">
            {tx(lang, 'లో షు గ్రిడ్ (Lo Shu Grid)', 'Lo Shu Grid')} ({subTab})
          </h3>
          <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto font-mono">
            {num.loShuGrid.flat().map((digit) => (
              <div
                key={digit}
                className={`h-16 rounded border flex flex-col items-center justify-center ${
                  num.loShuCounts[digit] > 0
                    ? 'border-amber-500/60 bg-amber-50/50 dark:bg-amber-950/30 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-base">{num.loShuCounts[digit] > 0 ? String(digit).repeat(num.loShuCounts[digit]) : '—'}</div>
                <div className="text-[10px] opacity-70">
                  {tx(lang, 'స్థానం', 'Pos')} {digit}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-slate-500 text-center">
            {tx(lang, 'లోపించిన సంఖ్యలు:', 'Missing numbers:')}{' '}
            {num.loShuMissing.length ? num.loShuMissing.join(', ') : tx(lang, 'లేవు (పూర్ణ గ్రిడ్)', 'None (Complete Grid)')}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5">
          <h3 className="text-sm font-semibold">
            {tx(lang, 'సంఖ్యా స్పందన & అనుకూలత', 'Vibration & Compatibility Check')}
          </h3>
          <div>
            {tx(lang, 'ఇన్‌పుట్:', 'Input:')} <span className="font-mono font-semibold">{customString}</span>
          </div>
          <div>
            {tx(lang, 'మొత్తం సంఖ్య:', 'Compound Total:')} <span className="font-mono font-semibold">{strResult.total}</span>
          </div>
          <div>
            {tx(lang, 'మూల సంఖ్య:', 'Root Vibration:')}{' '}
            <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">{strResult.root}</span>
          </div>
          <div>
            {tx(lang, 'అధిపతి గ్రహం:', 'Planetary Ruler:')}{' '}
            <span className="font-medium">{isTe ? strResult.rulerTe : strResult.ruler}</span>
          </div>
          <div>
            {tx(lang, 'స్థితి:', 'Status:')}{' '}
            <span className="font-semibold">
              {strResult.favorable
                ? tx(lang, 'శుభ స్పందన (1, 3, 5, 6 శ్రేణి)', 'Harmonious (1,3,5,6 series)')
                : tx(lang, 'సామాన్యం / క్రమశిక్షణ ప్రధానం', 'Neutral / Discipline-oriented')}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
            {tx(lang, 'ఆత్మ ప్రేరణ (స్వరాలు):', 'Soul Urge (Vowels):')} {num.soulUrge} ·{' '}
            {tx(lang, 'బాహ్య వ్యక్తిత్వం (హల్లులు):', 'Outer Personality (Consonants):')} {num.personality}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{tx(lang, 'వేద యంత్ర చతురస్రం', 'Vedic Yantra / Magic Square')}</h3>
            <select
              value={magicOrder}
              onChange={(e) => setMagicOrder(Number(e.target.value))}
              className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1"
            >
              <option value={3}>3×3 ({tx(lang, 'మొత్తం 15', 'Sum 15')})</option>
              <option value={4}>4×4 ({tx(lang, 'మొత్తం 34', 'Sum 34')})</option>
              <option value={5}>5×5 ({tx(lang, 'మొత్తం 65', 'Sum 65')})</option>
            </select>
          </div>
          <div className="space-y-1 font-mono text-center">
            {magic.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-1">
                {row.map((val, ci) => (
                  <span
                    key={ci}
                    className="w-9 h-9 flex items-center justify-center rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    {val}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const WesternAstrologyPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, profiles, activeProfile, calcConfig, lang } = useApp();
  const isTe = lang === 'te';
  const [partnerId, setPartnerId] = useState(profiles[1]?.id || activeProfile.id);
  const [includeMinor, setIncludeMinor] = useState(subTab === 'aspects');
  const currentYear = new Date().getFullYear();
  const [progAge, setProgAge] = useState(() => Math.max(0, currentYear - chart.inp.y));
  const [solarYear, setSolarYear] = useState(currentYear);

  const west = useMemo(() => computeWesternAnalysis(chart, includeMinor), [chart, includeMinor]);
  const partnerProf = profiles.find((p) => p.id === partnerId) || activeProfile;
  const partnerChart = useMemo(() => computeChart({ ...partnerProf, ay: calcConfig.ay }, calcConfig), [partnerProf, calcConfig]);
  const synastry = useMemo(() => computeWesternSynastry(chart, partnerChart), [chart, partnerChart]);
  const progressions = useMemo(() => computeWesternSecondaryProgressions(chart, progAge), [chart, progAge]);
  const solarReturn = useMemo(() => computeWesternSolarReturn(chart, solarYear), [chart, solarYear]);

  const elTeMap: Record<string, string> = { Fire: 'అగ్ని (Fire)', Earth: 'భూమి (Earth)', Air: 'వాయు (Air)', Water: 'జల (Water)' };
  const modTeMap: Record<string, string> = { Cardinal: 'చర (Cardinal)', Fixed: 'స్థిర (Fixed)', Mutable: 'ద్విస్వభావ (Mutable)' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col items-center">
          <h2 className="text-sm font-semibold mb-1">
            {tx(lang, 'పాశ్చాత్య సాయన జన్మ చక్రం', 'Western Tropical Birth Wheel')}
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            {tx(lang, 'లగ్నం', 'Asc')}: {sName(Math.floor(west.tropicalAsc / 30), lang)} {formatDms(west.tropicalAsc % 30)} · MC:{' '}
            {sName(Math.floor(west.tropicalMc / 30), lang)} {formatDms(west.tropicalMc % 30)}
          </p>
          <WesternWheelChart
            cusps={chart.placidusCu.map((c) => (c + chart.ay) % 360)}
            rows={chart.rows}
            outerPlanets={chart.outerPlanets}
            useTropical
            lang={lang}
          />
        </div>

        <div className="lg:col-span-7 space-y-5 text-xs">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-sm font-semibold mb-2">
              {tx(lang, 'తత్వ మరియు స్వభావ సమతుల్యత', 'Element & Modality Balance')} ({subTab})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(west.elements).map(([k, v]) => (
                <div key={k} className="p-2 rounded border border-slate-200 dark:border-slate-800 flex justify-between">
                  <span>{isTe ? elTeMap[k] || k : k}</span>
                  <span className="font-mono font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Object.entries(west.modalities).map(([k, v]) => (
                <div key={k} className="p-2 rounded border border-slate-200 dark:border-slate-800 flex justify-between">
                  <span>{isTe ? modTeMap[k] || k : k}</span>
                  <span className="font-mono font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto max-h-72">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-semibold">
                {tx(lang, 'సాయన గ్రహ స్థానాలు (యురేనస్, నెప్ట్యూన్, ప్లూటో సహా)', 'Tropical Positions (Incl. Uranus, Neptune, Pluto)')}
              </h3>
            </div>
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                {west.bodies.map((b) => (
                  <tr key={b.name}>
                    <td className="px-3 py-1.5 font-medium">
                      {isTe ? b.nameTe : b.name} {b.retro ? `(${tr(lang, 'retrograde')})` : ''}
                    </td>
                    <td className="px-3 py-1.5 font-mono">
                      {sName(b.sign, lang)} {formatDms(b.lon % 30)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Western Aspects + Synastry / Composite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto max-h-80">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              {tx(lang, 'పాశ్చాత్య గ్రహ దృష్టులు (0°, 60°, 90°, 120°, 180°)', 'Western Aspects (0°, 60°, 90°, 120°, 180°)')}
            </h3>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500">
              <input type="checkbox" checked={includeMinor} onChange={(e) => setIncludeMinor(e.target.checked)} />
              <span>{tx(lang, 'సూక్ష్మ దృష్టులు (30°/45°/135°/150°)', 'Minor (30°/45°/135°/150°)')}</span>
            </label>
          </div>
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {west.aspects.map((a, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-1.5 font-medium">
                    {isTe ? `${a.p1Te || a.p1} – ${a.p2Te || a.p2}` : `${a.p1} – ${a.p2}`}
                  </td>
                  <td className="px-3 py-1.5">{isTe ? a.typeTe : `${a.type} (${a.angle}°)`}</td>
                  <td className="px-3 py-1.5 font-mono text-right">
                    {tx(lang, 'వ్యత్యాసం', 'Orb')} {a.orb.toFixed(2)}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{tx(lang, 'సినాస్ట్రీ & కంపోజిట్ పొంతన', 'Synastry & Composite Midpoints')}</h3>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto tabular-nums">
            {synastry.synastryAspects.slice(0, 10).map((sa, idx) => (
              <div key={idx} className="py-1.5 flex justify-between">
                <span>
                  {isTe ? `${sa.p1Te || sa.p1} · ${sa.typeTe} · ${sa.p2Te || sa.p2}` : `${sa.p1} · ${sa.type} · ${sa.p2}`}
                </span>
                <span className="font-mono text-slate-500">{sa.orb.toFixed(1)}°</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Progressions + Tropical Solar Return */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold">{tx(lang, 'సెకండరీ ప్రోగ్రెషన్స్ (1 రోజు = 1 సం.)', 'Secondary Progressions (Day-for-a-Year)')}</h3>
              <div className="text-slate-500 mt-0.5">
                {tx(lang, 'ప్రోగ్రెస్డ్ లగ్నం:', 'Progressed Asc:')}{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {sName(progressions.progressedAscSign, lang)} {formatDms(progressions.progressedAsc % 30)}
                </span>
              </div>
            </div>
            <label className="flex items-center gap-1.5">
              <span className="text-slate-500">{tx(lang, 'వయసు', 'Age')}</span>
              <input
                type="number"
                min={0}
                max={120}
                value={progAge}
                onChange={(e) => setProgAge(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
                className="w-16 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 font-mono"
              />
            </label>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
            {progressions.planets.map((pp) => (
              <div key={pp.id} className="py-1.5 flex items-center justify-between gap-2">
                <span className="font-medium">{pName(pp.id, lang)}</span>
                <span className="font-mono">
                  {sShort(pp.natalSign, lang)} → <span className="font-semibold text-amber-700 dark:text-amber-300">{sName(pp.progressedSign, lang)} {formatDms(pp.degInSign)}</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {pp.changedSign ? tx(lang, 'రాశి మారింది', 'Sign Ingress') : tx(lang, 'అదే రాశి', 'Same Sign')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold">{tx(lang, 'సాయన సోలార్ రిటర్న్', 'Tropical Solar Return')}</h3>
              <div className="text-slate-500 font-mono text-[11px] mt-0.5">{solarReturn.exactLocalTime}</div>
            </div>
            <label className="flex items-center gap-1.5">
              <span className="text-slate-500">{tx(lang, 'సంవత్సరం', 'Year')}</span>
              <input
                type="number"
                min={chart.inp.y}
                max={chart.inp.y + 110}
                value={solarYear}
                onChange={(e) => setSolarYear(Number(e.target.value) || currentYear)}
                className="w-20 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 font-mono"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400">{tx(lang, 'సోలార్ రిటర్న్ లగ్నం', 'Solar Return Asc')}</div>
              <div className="font-semibold mt-0.5">
                {sName(solarReturn.solarReturnAscSign, lang)} {formatDms(solarReturn.solarReturnAsc % 30)}
              </div>
            </div>
            <div className="p-2 rounded border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400">{tx(lang, 'సోలార్ రిటర్న్ చంద్రుడు', 'Solar Return Moon')}</div>
              <div className="font-semibold mt-0.5">{sName(solarReturn.solarReturnMoonSign, lang)}</div>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
            {solarReturn.planets.map((sp) => (
              <div key={sp.id} className="py-1.5 flex items-center justify-between">
                <span className="font-medium">{pName(sp.id, lang)}</span>
                <span className="font-mono">
                  {sName(sp.sign, lang)} {formatDms(sp.degInSign)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const RemediesPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, lang } = useApp();
  const isTe = lang === 'te';

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200">
        {tr(lang, 'traditionalNotice')}{' '}
        {tx(
          lang,
          'క్రింది సూచనలు సంప్రదాయ జ్యోతిష & ధర్మశాస్త్ర గ్రంథాల ఆధారితంగా మాత్రమే ఇవ్వబడ్డాయి.',
          'Recommendations below reflect classical Jyotisha & Dharma Shastra traditions and are separated from calculated astronomical positions.',
        )}{' '}
        ({subTab})
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {SEVEN.map((pid) => {
          const row = chart.rows.find((r) => r.id === pid)!;
          const gem = GEMSTONE_MAP[pid];
          const rud = RUDRAKSHA_MAP[pid];
          const lk = LAL_KITAB_PAKKA[pid];
          return (
            <div key={pid} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{pName(pid, lang)}</h3>
                <span className="text-slate-500">
                  H{row.house} · {isTe ? row.dig : row.digKey}
                </span>
              </div>
              <div>
                <span className="text-slate-400">{tx(lang, 'రత్నం:', 'Ratna (Gemstone):')}</span>{' '}
                <span className="font-medium">{isTe ? gem.gemTe : gem.gem}</span> ({gem.metal}, {gem.finger}, {gem.day})
              </div>
              <div>
                <span className="text-slate-400">{tx(lang, 'రుద్రాక్ష:', 'Rudraksha:')}</span> {rud.mukhi}-
                {tx(lang, 'ముఖి', 'Mukhi')} ({rud.deity}) · <span className="font-mono">{rud.mantra}</span>
              </div>
              <div>
                <span className="text-slate-400">{tx(lang, 'లాల్ కితాబ్ పరిహారం:', 'Lal Kitab Tradition:')}</span>{' '}
                {isTe ? lk.remedyTe : lk.remedyEn}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs space-y-2">
        <h3 className="text-sm font-semibold">
          {tx(lang, 'వాస్తు, మంత్రం, స్తోత్రం & వ్రత నియమాలు', 'Vastu, Mantra, Stotra & Vrata Guidelines')}
        </h3>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {tx(
            lang,
            'సంప్రదాయ జ్యోతిషం సాత్విక ఉపాయాలను సూచిస్తుంది: సూర్యనమస్కారం & ఆదిత్యహృదయం (సూర్యుడు), శివాభిషేకం & సోమవార వ్రతం (చంద్రుడు), సుబ్రహ్మణ్య భుజంగం / హనుమాన్ చాలీసా & కందుల దానం (కుజుడు), విష్ణు సహస్రనామం & విద్యాదానం (బుధుడు), దక్షిణామూర్తి / గురు స్తోత్రం (గురుడు), శ్రీ సూక్తం & శ్వేత వస్తు దానం (శుక్రుడు), శని తైలాభిషేకం & సేవా ధర్మం (శని). త్రిక భావాధిపతులకు రత్నధారణ ముందు పండితుల సలహా తీసుకోవడం శ్రేయస్కరం.',
            'Traditional Jyotisha pairs planetary afflictions with Sattvic practices: Surya Namaskara & Aditya Hridayam (Sun), Shiva Abhisheka & Soma Vrata (Moon), Subrahmanya / Hanuman Chalisa & Masoor Daan (Mars), Vishnu Sahasranama & Vidya Daan (Mercury), Guru Stotra & Dakshinamurthy worship (Jupiter), Sri Suktam & White Daan (Venus), and Shani Tailabhisheka / Seva (Saturn). Consult a qualified scholar before wearing potent Ratnas for Trik-bhava lords.',
          )}
        </p>
      </div>
    </div>
  );
};
