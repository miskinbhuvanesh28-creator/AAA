import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ORDER, pName, pShort, sName, sShort } from '../engine/constants.ts';
import {
  analyzeDashaPeriod,
  computeAshtottari,
  computeCharaDasha,
  computeKalachakra,
  computeMandookaDasha,
  computeNarayanaDasha,
  computeShoolaDasha,
  computeYogini,
  findActiveVimshottari,
  type DashaPeriod,
} from '../engine/dasha.ts';
import { formatDms } from '../engine/ephemeris.ts';
import { tr } from '../engine/i18n.ts';
import { computeJaiminiSummary, getRashiAspects } from '../engine/jaimini.ts';
import { KP_EVENTS, computeKpHorary, evaluateKpEvent, getKpHoraryTable, getRulingPlanets } from '../engine/kp.ts';
import type { Language, PlanetId } from '../engine/types.ts';

function tx(lang: Language, te: string, en: string, hi?: string): string {
  if (lang === 'te') return te;
  if (lang === 'hi' && hi) return hi;
  return en;
}

function fmtDate(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toISOString().slice(0, 10);
}

type DashaSysKey =
  | 'vimshottari'
  | 'yogini'
  | 'ashtottari'
  | 'chara'
  | 'narayana'
  | 'kalachakra'
  | 'shoola'
  | 'mandooka';

const DASHA_SUB_SET = new Set<DashaSysKey>([
  'vimshottari',
  'yogini',
  'ashtottari',
  'chara',
  'narayana',
  'kalachakra',
  'shoola',
  'mandooka',
]);

export const DashaSystemsPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, lang } = useApp();
  const isTe = lang === 'te';

  const resolveSys = (st: string): DashaSysKey =>
    DASHA_SUB_SET.has(st as DashaSysKey) ? (st as DashaSysKey) : 'vimshottari';

  const [system, setSystem] = useState<DashaSysKey>(() => resolveSys(subTab));
  useEffect(() => {
    if (DASHA_SUB_SET.has(subTab as DashaSysKey)) {
      setSystem(subTab as DashaSysKey);
    }
  }, [subTab]);

  const active = useMemo(() => findActiveVimshottari(chart.p[1], chart.t0), [chart.p, chart.t0]);
  const [selMd, setSelMd] = useState<DashaPeriod>(active.maha);
  const [selAd, setSelAd] = useState<DashaPeriod>(active.antar);
  const [selPd, setSelPd] = useState<DashaPeriod>(active.pratyantar);
  const [selSd, setSelSd] = useState<DashaPeriod>(active.sookshma);
  const [analyzedLord, setAnalyzedLord] = useState<PlanetId>(() => active.maha.lord as PlanetId);

  useEffect(() => {
    setSelMd(active.maha);
    setSelAd(active.antar);
    setSelPd(active.pratyantar);
    setSelSd(active.sookshma);
    setAnalyzedLord(active.maha.lord as PlanetId);
  }, [active]);

  const vim = active.tree;
  const adList = useMemo(() => vim.getSub(selMd), [vim, selMd]);
  const pdList = useMemo(() => vim.getSub(selAd), [vim, selAd]);
  const sdList = useMemo(() => vim.getSub(selPd), [vim, selPd]);
  const pranaList = useMemo(() => vim.getSub(selSd), [vim, selSd]);

  const yogini = useMemo(() => computeYogini(chart.p[1], chart.t0), [chart.p, chart.t0]);
  const ashtottari = useMemo(() => computeAshtottari(chart.p[1], chart.t0), [chart.p, chart.t0]);
  const chara = useMemo(() => computeCharaDasha(chart), [chart]);
  const narayana = useMemo(() => computeNarayanaDasha(chart), [chart]);
  const shoola = useMemo(() => computeShoolaDasha(chart), [chart]);
  const mandooka = useMemo(() => computeMandookaDasha(chart), [chart]);
  const kalachakra = useMemo(() => computeKalachakra(chart.p[1], chart.t0), [chart.p, chart.t0]);
  const dashaPhalalu = useMemo(() => analyzeDashaPeriod(chart, analyzedLord), [chart, analyzedLord]);

  return (
    <div className="space-y-6">
      {/* System Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs">
          {(
            [
              ['vimshottari', tx(lang, 'వింశోత్తరి (5 స్థాయిలు)', 'Vimshottari (5 Levels)')],
              ['yogini', tx(lang, 'యోగిని (36సం.)', 'Yogini (36y)')],
              ['ashtottari', tx(lang, 'అష్టోత్తరి (108సం.)', 'Ashtottari (108y)')],
              ['chara', tx(lang, 'జైమినీ చర దశ', 'Jaimini Chara')],
              ['narayana', tx(lang, 'నారాయణ దశ', 'Narayana')],
              ['kalachakra', tx(lang, 'కాలచక్ర దశ', 'Kalachakra')],
              ['shoola', tx(lang, 'శూల దశ (108సం.)', 'Shoola (108y)')],
              ['mandooka', tx(lang, 'మండూక దశ', 'Mandooka')],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSystem(k)}
              className={`px-3 py-1.5 rounded-md font-medium ${
                system === k
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          {tx(lang, 'ప్రస్తుత దశ:', 'Now Active:')}{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {pName(active.maha.lord as PlanetId, lang)} / {pName(active.antar.lord as PlanetId, lang)} /{' '}
            {pName(active.pratyantar.lord as PlanetId, lang)}
          </span>
        </div>
      </div>

      {/* Dasha Phalalu Analyzer */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              {tx(lang, 'దశా ఫలాలు విశ్లేషణ', 'Dasha Phalalu Analyzer', 'दशा फल विश्लेषण')}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {pName(dashaPhalalu.lordId, lang)} — H{dashaPhalalu.house} ({sName(dashaPhalalu.sign, lang)},{' '}
              {isTe ? dashaPhalalu.dignity : dashaPhalalu.dignityKey})
            </h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {ORDER.map((pid) => (
              <button
                key={pid}
                type="button"
                onClick={() => setAnalyzedLord(pid)}
                className={`px-2 py-0.5 rounded font-medium ${
                  analyzedLord === pid
                    ? 'bg-amber-600 text-white'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {pShort(pid, lang)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          {isTe ? dashaPhalalu.phalaluTe : dashaPhalalu.phalaluEn}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500">
          <span>
            {tx(lang, 'కారక పాత్ర:', 'Role:')} <strong className="text-slate-700 dark:text-slate-200">{dashaPhalalu.role}</strong>
            {dashaPhalalu.badhaka ? ` (${tx(lang, 'బాధక', 'Badhaka')})` : ''}
          </span>
          <span>
            {tx(lang, 'అధిపత్య భావాలు:', 'Lordships:')}{' '}
            <strong className="font-mono">{dashaPhalalu.ownedHouses.map((h) => `H${h}`).join(', ') || '—'}</strong>
          </span>
          <span>
            {tx(lang, 'KP సూచికలు:', 'KP Significators:')}{' '}
            <strong className="font-mono">H{dashaPhalalu.kpSigs.join(', H') || '—'}</strong>
          </span>
        </div>
      </div>

      {system === 'vimshottari' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-xs">
          {[
            {
              title: tx(lang, '1. మహాదశ', '1. Mahadasha'),
              list: vim.mahas,
              selected: selMd,
              onSelect: (p: DashaPeriod) => {
                setSelMd(p);
                setAnalyzedLord(p.lord as PlanetId);
                const sub1 = vim.getSub(p)[0];
                setSelAd(sub1);
                const sub2 = vim.getSub(sub1)[0];
                setSelPd(sub2);
                setSelSd(vim.getSub(sub2)[0]);
              },
            },
            {
              title: tx(lang, '2. అంతర్దశ', '2. Antardasha'),
              list: adList,
              selected: selAd,
              onSelect: (p: DashaPeriod) => {
                setSelAd(p);
                setAnalyzedLord(p.lord as PlanetId);
                const sub2 = vim.getSub(p)[0];
                setSelPd(sub2);
                setSelSd(vim.getSub(sub2)[0]);
              },
            },
            {
              title: tx(lang, '3. ప్రత్యంతర్దశ', '3. Pratyantardasha'),
              list: pdList,
              selected: selPd,
              onSelect: (p: DashaPeriod) => {
                setSelPd(p);
                setSelSd(vim.getSub(p)[0]);
              },
            },
            {
              title: tx(lang, '4. సూక్ష్మదశ', '4. Sookshma Dasha'),
              list: sdList,
              selected: selSd,
              onSelect: (p: DashaPeriod) => setSelSd(p),
            },
            {
              title: tx(lang, '5. ప్రాణదశ', '5. Prana Dasha'),
              list: pranaList,
              selected: pranaList[0],
              onSelect: () => undefined,
            },
          ].map((col) => (
            <div
              key={col.title}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold">
                {col.title}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto tabular-nums">
                {col.list.map((p, idx) => {
                  const isSel = col.selected && p.start === col.selected.start && p.lord === col.selected.lord;
                  const nowIn = Date.now() >= p.start && Date.now() < p.end;
                  return (
                    <button
                      key={`${p.lord}-${idx}`}
                      type="button"
                      onClick={() => col.onSelect(p)}
                      className={`w-full text-left px-3 py-2 transition-colors ${
                        isSel
                          ? 'bg-amber-600 text-white'
                          : nowIn
                            ? 'bg-amber-50 dark:bg-amber-950/30 font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{pName(p.lord as PlanetId, lang)}</span>
                        <span className="text-[10px] opacity-80">
                          {nowIn ? tx(lang, 'ప్రస్తుతం', 'Now') : `${p.years.toFixed(2)}${tx(lang, 'సం.', 'y')}`}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono opacity-80 mt-0.5">
                        {fmtDate(p.start)} → {fmtDate(p.end)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {(system === 'yogini' || system === 'ashtottari') && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-2">{tx(lang, 'దశానాథుడు', 'Period Lord')}</th>
                <th className="px-4 py-2 text-right">{tx(lang, 'సంవత్సరాలు', 'Years')}</th>
                <th className="px-4 py-2">{tx(lang, 'ప్రారంభ తేదీ', 'Start Date')}</th>
                <th className="px-4 py-2">{tx(lang, 'ముగింపు తేదీ', 'End Date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums font-mono">
              {(system === 'yogini' ? yogini.mahas : ashtottari.mahas).map((m, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 font-sans font-semibold">
                    {typeof m.lord === 'number' ? pName(m.lord as PlanetId, lang) : m.lord}
                  </td>
                  <td className="px-4 py-2 text-right">{m.years.toFixed(1)}</td>
                  <td className="px-4 py-2">{fmtDate(m.start)}</td>
                  <td className="px-4 py-2">{fmtDate(m.end)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(system === 'chara' || system === 'narayana' || system === 'shoola' || system === 'mandooka') && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-2">{tr(lang, 'sign')}</th>
                <th className="px-4 py-2">{tx(lang, 'రాశ్యాధిపతి & స్థితి', 'Lord & Position')}</th>
                <th className="px-4 py-2">{tx(lang, 'క్రమం', 'Direction')}</th>
                <th className="px-4 py-2 text-right">{tx(lang, 'సంవత్సరాలు', 'Years')}</th>
                <th className="px-4 py-2">{tx(lang, 'కాలపరిమితి', 'Start – End')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {(system === 'chara'
                ? chara
                : system === 'narayana'
                  ? narayana
                  : system === 'shoola'
                    ? shoola
                    : mandooka
              ).map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 font-semibold">{sName(row.sign, lang)}</td>
                  <td className="px-4 py-2">
                    {pName(row.lord, lang)} ({sName(row.lordSign, lang)})
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {row.direction === 'Forward' ? tx(lang, 'సవ్య (Forward)', 'Forward') : tx(lang, 'అపసవ్య (Reverse)', 'Reverse')}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{row.years}</td>
                  <td className="px-4 py-2 font-mono">
                    {fmtDate(row.start)} → {fmtDate(row.end)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {system === 'kalachakra' && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {tx(lang, 'చక్రం:', 'Cycle:')}{' '}
            <span className="font-semibold">
              {kalachakra.isSavya ? tx(lang, 'సవ్య (Savya)', 'Savya') : tx(lang, 'అపసవ్య (Apasavya)', 'Apasavya')}
            </span>{' '}
            · {tx(lang, 'పాదం', 'Pada')} {kalachakra.pada} · {tx(lang, 'దేహ రాశి:', 'Deha:')}{' '}
            <span className="font-semibold">{sName(kalachakra.deha, lang)}</span> · {tx(lang, 'జీవ రాశి:', 'Jeeva:')}{' '}
            <span className="font-semibold">{sName(kalachakra.jeeva, lang)}</span> ({kalachakra.totalYears}
            {tx(lang, 'సం.', 'y')})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs tabular-nums">
            {kalachakra.periods.map((p, idx) => (
              <div key={idx} className="p-2.5 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-semibold">
                  {sName(p.sign, lang)} ({p.years}
                  {tx(lang, 'సం.', 'y')})
                </span>
                <span className="font-mono text-[11px] text-slate-500">{fmtDate(p.start)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const KpAstrologyPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, calcConfig, updateCalcConfig, lang, activeProfile } = useApp();
  const isTe = lang === 'te';
  const [horaryNum, setHoraryNum] = useState(108);
  const [horaryQuestion, setHoraryQuestion] = useState(() =>
    isTe ? 'ఈ వృత్తి మార్పు శుభ ఫలితాలను ఇస్తుందా?' : 'Will this career transition bring growth?',
  );
  const [selectedEventId, setSelectedEventId] = useState(
    subTab.startsWith('event-') ? subTab.replace('event-', '') : 'marriage',
  );

  const ruling = useMemo(() => getRulingPlanets(activeProfile, calcConfig), [activeProfile, calcConfig]);
  const horary = useMemo(() => computeKpHorary(horaryNum, activeProfile, calcConfig), [horaryNum, activeProfile, calcConfig]);
  const horaryTable = useMemo(() => getKpHoraryTable(), []);
  const eventResults = useMemo(() => KP_EVENTS.map((rule) => evaluateKpEvent(chart, rule)), [chart]);
  const focusedEvent = eventResults.find((e) => e.rule.id === selectedEventId) || eventResults[0];

  return (
    <div className="space-y-6">
      {/* KP Convention + Ruling Planets Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {tx(lang, 'ప్రస్తుత పాలక గ్రహాలు (తత్కాలిక)', 'Current Ruling Planets (Tatkalika)')} · {ruling.localTimeStr}
            </h2>
            <div className="flex items-center gap-1 p-0.5 rounded bg-slate-100 dark:bg-slate-950 text-xs">
              <button
                type="button"
                onClick={() => updateCalcConfig({ kpMode: 'new' })}
                className={`px-2.5 py-1 rounded ${calcConfig.kpMode === 'new' ? 'bg-white dark:bg-slate-800 font-medium shadow-sm' : ''}`}
              >
                {tx(lang, 'KP నూతన (291)', 'KP New (291)')}
              </button>
              <button
                type="button"
                onClick={() => updateCalcConfig({ kpMode: 'old' })}
                className={`px-2.5 py-1 rounded ${calcConfig.kpMode === 'old' ? 'bg-white dark:bg-slate-800 font-medium shadow-sm' : ''}`}
              >
                {tx(lang, 'KP పాత పద్ధతి', 'KP Old')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div>
              <span className="text-slate-400">{tx(lang, 'వారాధిపతి:', 'Day Lord:')}</span>{' '}
              <span className="font-semibold">{pName(ruling.dayLord, lang)}</span>
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'లగ్న రాశి/నక్ష/సబ్:', 'Lagna Sign/Star/Sub:')}</span>{' '}
              <span className="font-semibold">
                {pShort(ruling.lagnaSignLord, lang)} / {pShort(ruling.lagnaStarLord, lang)} / {pShort(ruling.lagnaSubLord, lang)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'చంద్ర రాశి/నక్ష/సబ్:', 'Moon Sign/Star/Sub:')}</span>{' '}
              <span className="font-semibold">
                {pShort(ruling.moonSignLord, lang)} / {pShort(ruling.moonStarLord, lang)} / {pShort(ruling.moonSubLord, lang)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, '1–249 పట్టిక:', 'Total 1–249 Table:')}</span>{' '}
              <span className="font-mono">
                {horaryTable.length} {tx(lang, 'భాగాలు', 'slots')}
              </span>
            </div>
          </div>
        </div>

        {/* KP Horary Quick Box */}
        <div className="lg:col-span-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 text-xs">
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {tx(lang, 'KP హోరరీ (1–249 సంఖ్య)', 'KP Horary (1–249 Number)')}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={249}
              value={horaryNum}
              onChange={(e) => setHoraryNum(Math.min(249, Math.max(1, Number(e.target.value) || 1)))}
              className="w-24 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 font-mono"
            />
            <input
              type="text"
              value={horaryQuestion}
              onChange={(e) => setHoraryQuestion(e.target.value)}
              className="flex-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1"
            />
          </div>
          <div className="text-slate-500">
            #{horary.entry.number}: {sName(horary.entry.sign, lang)} {formatDms(horary.entry.startLon % 30)} ·{' '}
            {tx(lang, 'నక్షత్రం', 'Star')} {pShort(horary.entry.starLord, lang)} · {tx(lang, 'సబ్', 'Sub')}{' '}
            {pShort(horary.entry.subLord, lang)}
          </div>
        </div>
      </div>

      {/* Cusps + Planetary Significators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">
              {tx(lang, 'ప్లాసిడస్ కస్ప్ సబ్-లార్డులు & భావ సూచికలు', 'Placidus Cuspal Sub-Lords & Significators')}
            </h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tx(lang, 'కస్ప్', 'Cusp')}</th>
                <th className="px-3 py-2">{tr(lang, 'degree')}</th>
                <th className="px-3 py-2">{tx(lang, 'నక్ష / సబ్ / సబ్-సబ్', 'Star / Sub / SS')}</th>
                <th className="px-3 py-2">{tx(lang, 'భావ సూచిక గ్రహాలు', 'House Significators')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {chart.kp.cuspSubs.map((c) => (
                <tr key={c.house}>
                  <td className="px-3 py-2 font-mono font-semibold">H{c.house}</td>
                  <td className="px-3 py-2 font-mono">
                    {sShort(c.sign, lang)} {formatDms(c.lon % 30)}
                  </td>
                  <td className="px-3 py-2">
                    {pShort(c.starLord, lang)} /{' '}
                    <span className="font-semibold text-amber-700 dark:text-amber-300">{pShort(c.subLord, lang)}</span> /{' '}
                    {pShort(c.subSubLord, lang)}
                  </td>
                  <td className="px-3 py-2">{(chart.kp.cuspSig[c.house] || []).map((pid) => pShort(pid, lang)).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">
              {tx(lang, 'గ్రహాల 4-స్థాయి కారకత్వ సూచికలు', 'Planetary 4-Fold Significators')}
            </h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tr(lang, 'planet')}</th>
                <th className="px-3 py-2">{tx(lang, 'నక్షత్రాధిపతి', 'Star Lord')}</th>
                <th className="px-3 py-2">{tr(lang, 'subLord')}</th>
                <th className="px-3 py-2">{tx(lang, 'సూచించే భావాలు (1–12)', 'Signifies Houses (1–12)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {chart.rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-semibold">{pName(r.id, lang)}</td>
                  <td className="px-3 py-2">{pShort(r.sub[0], lang)}</td>
                  <td className="px-3 py-2 text-amber-700 dark:text-amber-300 font-medium">{pShort(r.sub[1], lang)}</td>
                  <td className="px-3 py-2 font-mono">{(chart.kp.sig[r.id] || []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8 KP Event Analyses */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {tx(lang, 'KP ఘటనా ఫలిత విశ్లేషణ (సబ్-లార్డ్ నియమాలు)', 'KP Event Promise Analysis (Sub-Lord Rules)')}
          </h3>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {KP_EVENTS.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedEventId(ev.id)}
                className={`px-2.5 py-1 rounded ${
                  focusedEvent.rule.id === ev.id
                    ? 'bg-amber-600 text-white font-medium'
                    : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {isTe ? ev.titleTe.split(' ')[0] : ev.titleEn.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-slate-400">{tx(lang, 'రంగం & ప్రధాన కస్ప్', 'Domain & Primary Cusp')}</div>
            <div className="font-semibold text-sm mt-0.5">
              {isTe ? focusedEvent.rule.titleTe : focusedEvent.rule.titleEn} ({tx(lang, 'కస్ప్', 'Cusp')}{' '}
              {focusedEvent.rule.primaryCusp})
            </div>
            <div className="text-slate-500 mt-1">
              {tx(lang, 'సహాయక భావాలు:', 'Supporting Houses:')} {focusedEvent.rule.supportingHouses.join(', ')}
            </div>
          </div>
          <div>
            <div className="text-slate-400">{tx(lang, 'కస్ప్ సబ్-లార్డ్ & ఫలితం', 'Cusp Sub-Lord & Verdict')}</div>
            <div className="font-semibold text-sm mt-0.5">
              {pName(focusedEvent.subLord, lang)} →{' '}
              <span className="text-amber-700 dark:text-amber-300">{focusedEvent.verdict}</span>
            </div>
            <div className="text-slate-500 mt-1">
              {tx(lang, 'సూచించే భావాలు:', 'Signifies:')} {focusedEvent.subLordSigs.join(', ')}
            </div>
          </div>
          <div>
            <div className="text-slate-400">{tx(lang, 'బలమైన ఫలదాయక గ్రహాలు', 'Strongest Fruitful Significators')}</div>
            <div className="mt-1 space-y-1">
              {focusedEvent.bestSignificators.slice(0, 3).map((bs) => (
                <div key={bs.id}>
                  <span className="font-medium">{pName(bs.id, lang)}</span>: {tx(lang, 'భావాలు', 'Houses')}{' '}
                  {bs.matches.join(', ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const JaiminiAstrologyPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, calcConfig, updateCalcConfig, lang } = useApp();
  const isTe = lang === 'te';
  const jaimini = useMemo(() => computeJaiminiSummary(chart), [chart]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {tx(lang, 'కారకాంశ:', 'Karakamsha:')}{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{sName(jaimini.karakamshaSign, lang)}</span> · AL:{' '}
          <span className="font-semibold">{sName(jaimini.AL, lang)}</span> · UL:{' '}
          <span className="font-semibold">{sName(jaimini.UL, lang)}</span> · {subTab}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs">
          <button
            type="button"
            onClick={() => updateCalcConfig({ karakaMode: '7' })}
            className={`px-3 py-1 rounded ${calcConfig.karakaMode === '7' ? 'bg-white dark:bg-slate-800 font-medium shadow-sm' : ''}`}
          >
            {tx(lang, '7 చర కారకులు', '7 Chara Karakas')}
          </button>
          <button
            type="button"
            onClick={() => updateCalcConfig({ karakaMode: '8' })}
            className={`px-3 py-1 rounded ${calcConfig.karakaMode === '8' ? 'bg-white dark:bg-slate-800 font-medium shadow-sm' : ''}`}
          >
            {tx(lang, '8 కారకులు (రాహువు సహా)', '8 Karakas (incl. Rahu)')}
          </button>
        </div>
      </div>

      {/* Chara Karakas + Arudha Padas A1-A12 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold">{tx(lang, 'జైమినీ చర కారకులు', 'Chara Karakas')}</h2>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tx(lang, 'కారక స్థానం', 'Karaka Role')}</th>
                <th className="px-3 py-2">{tr(lang, 'planet')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'రాశి డిగ్రీలు', 'Degree in Sign')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {chart.karakas.map((k) => (
                <tr key={k.roleEn}>
                  <td className="px-3 py-2 font-medium">{isTe ? k.role : k.roleEn}</td>
                  <td className="px-3 py-2 font-semibold text-amber-700 dark:text-amber-300">{pName(k.planet, lang)}</td>
                  <td className="px-3 py-2 text-right font-mono">{k.deg.toFixed(2)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 text-xs">
          <h2 className="text-sm font-semibold">{tx(lang, 'ఆరూఢ పదాలు (A1–A12) & జైమినీ యోగాలు', 'Arudha Padas (A1–A12) & Jaimini Yogas')}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <div key={h} className="p-2 rounded border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">
                  {h === 1 ? 'AL (A1)' : h === 12 ? 'UL (A12)' : `A${h}`}
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{sName(jaimini.arudhas[h], lang)}</div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-slate-600 dark:text-slate-300">
            <div>
              {tx(lang, 'ఆత్మ–అమాత్యకారక యోగం:', 'AK–AmK Yoga:')} <span className="font-medium">{jaimini.akAmkReason}</span>
            </div>
            <div>
              {tx(lang, 'ఆత్మ–దారకారక సంబంధం:', 'AK–DK Link:')}{' '}
              <span className="font-medium">
                {jaimini.akDkLink
                  ? tx(lang, 'రాశి / దృష్టి ద్వారా అనుసంధానం', 'Connected via Sign/Rashi Drishti')
                  : tx(lang, 'వేరువేరు స్థితి', 'Separate')}
              </span>
            </div>
            <div>
              {tx(lang, 'కారకాంశం', 'Planets aspecting Karakamsha')} ({sName(jaimini.karakamshaSign, lang)}):{' '}
              {jaimini.aspKarakamsha.length ? jaimini.aspKarakamsha.map((id) => pShort(id, lang)).join(', ') : tx(lang, 'లేవు', 'None')}
            </div>
          </div>
        </div>
      </div>

      {/* Argala & Rashi Drishti */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">{tx(lang, 'అర్గళ & విరోధార్గళ (12 భావాలు)', 'Argala & Virodhargala (12 Houses)')}</h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-2.5 py-2">{tr(lang, 'house')}</th>
                <th className="px-2.5 py-2">{tx(lang, 'ధన (2/12)', 'Dhana (2/12)')}</th>
                <th className="px-2.5 py-2">{tx(lang, 'సుఖ (4/10)', 'Sukha (4/10)')}</th>
                <th className="px-2.5 py-2">{tx(lang, 'లాభ (11/3)', 'Labha (11/3)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {jaimini.argala.map((ar) => (
                <tr key={ar.house}>
                  <td className="px-2.5 py-1.5 font-mono font-semibold">H{ar.house}</td>
                  <td className="px-2.5 py-1.5">
                    {ar.dhanaArgala2.map((x) => pShort(x, lang)).join(',') || '—'} /{' '}
                    {ar.obstructedBy12.map((x) => pShort(x, lang)).join(',') || '—'}
                  </td>
                  <td className="px-2.5 py-1.5">
                    {ar.sukhaArgala4.map((x) => pShort(x, lang)).join(',') || '—'} /{' '}
                    {ar.obstructedBy10.map((x) => pShort(x, lang)).join(',') || '—'}
                  </td>
                  <td className="px-2.5 py-1.5">
                    {ar.labhaArgala11.map((x) => pShort(x, lang)).join(',') || '—'} /{' '}
                    {ar.obstructedBy3.map((x) => pShort(x, lang)).join(',') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">{tx(lang, 'జైమినీ రాశి దృష్టి', 'Jaimini Rashi Drishti (Sign Aspects by Planet)')}</h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tr(lang, 'planet')}</th>
                <th className="px-3 py-2">{tx(lang, 'స్థిత రాశి', 'Placed Sign')}</th>
                <th className="px-3 py-2">{tx(lang, 'రాశి దృష్టి స్థానాలు', 'Rashi Drishti Signs')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ORDER.map((pid: PlanetId) => (
                <tr key={pid}>
                  <td className="px-3 py-2 font-medium">{pName(pid, lang)}</td>
                  <td className="px-3 py-2">{sName(chart.s[pid], lang)}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {getRashiAspects(chart.s[pid])
                      .map((s) => sShort(s, lang))
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
