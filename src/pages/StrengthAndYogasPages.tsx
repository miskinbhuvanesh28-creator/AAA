import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { NAK_DEITIES_TE, NAK_NAMES, SEVEN, pName, pShort, sName, sShort } from '../engine/constants.ts';
import { computeTransitReport } from '../engine/gocharaVarshaRect.ts';
import { tr } from '../engine/i18n.ts';
import { computeBhavaBala, computeShadbala, computeVimsopaka } from '../engine/strength.ts';
import type { Language } from '../engine/types.ts';
import { ALL_NAKSHATRAS, evaluateTaraChandraBala } from '../engine/yogasNakshatra.ts';

function tx(lang: Language, te: string, en: string, hi?: string): string {
  if (lang === 'te') return te;
  if (lang === 'hi' && hi) return hi;
  return en;
}

export const PlanetaryStrengthPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, lang } = useApp();
  const isTe = lang === 'te';
  const shadbala = useMemo(() => computeShadbala(chart), [chart]);
  const bhavaBala = useMemo(() => computeBhavaBala(chart, shadbala), [chart, shadbala]);
  const vimsopaka = useMemo(() => computeVimsopaka(chart), [chart]);

  const sortedPlanets = useMemo(() => [...shadbala].sort((a, b) => b.ratioPct - a.ratioPct), [shadbala]);
  const sortedHouses = useMemo(() => [...bhavaBala].sort((a, b) => a.rank - b.rank), [bhavaBala]);
  const strongestPlanet = sortedPlanets[0];
  const weakestPlanet = sortedPlanets[sortedPlanets.length - 1];
  const strongestHouse = sortedHouses[0];
  const weakestHouse = sortedHouses[sortedHouses.length - 1];

  const domainCards = useMemo(() => {
    const domains = [
      { titleTe: 'ఆరోగ్యం & వ్యక్తిత్వం (H1)', titleEn: 'Self & Vitality (H1)', houses: [1] },
      { titleTe: 'ధనం & లాభం (H2, H11)', titleEn: 'Wealth & Gains (H2, H11)', houses: [2, 11] },
      { titleTe: 'గృహం, సుఖం & మోక్షం (H4, H12)', titleEn: 'Home & Inner Peace (H4, H12)', houses: [4, 12] },
      { titleTe: 'విద్య, సంతానం & భాగ్యం (H5, H9)', titleEn: 'Intellect & Fortune (H5, H9)', houses: [5, 9] },
      { titleTe: 'సేవ, సవాళ్లు & ఆయువు (H6, H8)', titleEn: 'Resilience & Transformation (H6, H8)', houses: [6, 8] },
      { titleTe: 'వివాహం & వృత్తి (H7, H10)', titleEn: 'Partnerships & Career (H7, H10)', houses: [7, 10] },
    ];
    return domains.map((d) => {
      const rows = bhavaBala.filter((b) => d.houses.includes(b.house));
      const avgRupas = rows.reduce((s, r) => s + r.totalRupas, 0) / Math.max(1, rows.length);
      const avgRank = Math.round(rows.reduce((s, r) => s + r.rank, 0) / Math.max(1, rows.length));
      return { ...d, avgRupas, avgRank, rows };
    });
  }, [bhavaBala]);

  return (
    <div className="space-y-6">
      {/* Top Strength Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-slate-500">{tx(lang, 'అత్యంత బలమైన గ్రహం', 'Strongest Planet', 'सबसे बली ग्रह')}</div>
          <div className="mt-1 text-base font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {pName(strongestPlanet.id, lang)} ({strongestPlanet.ratioPct.toFixed(0)}%)
          </div>
          <div className="mt-0.5 text-slate-500 font-mono">{strongestPlanet.totalRupas.toFixed(2)} {tx(lang, 'రూపాలు', 'Rupas')}</div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-slate-500">{tx(lang, 'బలహీన గ్రహం', 'Weakest Planet', 'कमजोर ग्रह')}</div>
          <div className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
            {pName(weakestPlanet.id, lang)} ({weakestPlanet.ratioPct.toFixed(0)}%)
          </div>
          <div className="mt-0.5 text-slate-500 font-mono">{weakestPlanet.totalRupas.toFixed(2)} {tx(lang, 'రూపాలు', 'Rupas')}</div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-slate-500">{tx(lang, 'బలమైన భావం', 'Strongest House', 'सबसे बली भाव')}</div>
          <div className="mt-1 text-base font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums font-mono">
            H{strongestHouse.house} ({sName(strongestHouse.sign, lang)})
          </div>
          <div className="mt-0.5 text-slate-500 font-mono">{strongestHouse.totalRupas.toFixed(2)} {tx(lang, 'రూపాలు', 'Rupas')}</div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="text-slate-500">{tx(lang, 'బలహీన భావం', 'Weakest House', 'कमजोर भाव')}</div>
          <div className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400 tabular-nums font-mono">
            H{weakestHouse.house} ({sName(weakestHouse.sign, lang)})
          </div>
          <div className="mt-0.5 text-slate-500 font-mono">{weakestHouse.totalRupas.toFixed(2)} {tx(lang, 'రూపాలు', 'Rupas')}</div>
        </div>
      </div>

      {/* 6 Life Domain Strength Cards */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          {tx(lang, 'భావబలం ఆధారంగా 6 జీవన రంగాల బలం', 'Life Domain Strength Summary (Bhava Bala)', 'भाव बल के अनुसार 6 जीवन क्षेत्र')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {domainCards.map((d) => (
            <div key={d.titleEn} className="p-3 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {isTe ? d.titleTe : d.titleEn}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {d.rows.map((r) => `H${r.house}: ${r.totalRupas.toFixed(2)}`).join(' · ')}
                </div>
              </div>
              <div className="text-right font-mono tabular-nums shrink-0">
                <div className="font-semibold text-amber-700 dark:text-amber-300">{d.avgRupas.toFixed(2)}</div>
                <div className="text-[11px] text-slate-400">
                  {tx(lang, 'ర్యాంక్', 'Rank')} #{d.avgRank}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shadbala Main Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx(
              lang,
              'షడ్బల పట్టిక (విరూపాలు మరియు రూపాలలో ఆరు విధాల గ్రహబలం)',
              'Shadbala (Six-Fold Planetary Strength in Virupas & Rupas)',
              'षड्बल (विरुपा और रुपा में ग्रह बल)',
            )}
          </h2>
          <span className="text-xs text-slate-500 font-mono">{subTab}</span>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="px-3 py-2">{tr(lang, 'planet')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'స్థాన', 'Sthana', 'स्थान')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'దిగ్', 'Dig', 'दिग्')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'కాల', 'Kala', 'काल')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'చేష్ట', 'Cheshta', 'चेष्टा')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'నైసర్గిక', 'Naisargika', 'नैसर्गिक')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'దృక్', 'Drik', 'दृक्')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'మొత్తం రూపాలు', 'Total Rupas', 'कुल रुपा')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'కనీసం', 'Min Req', 'न्यूनतम')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'నిష్పత్తి %', 'Ratio %', 'अनुपात %')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'ఇష్ట / కష్ట', 'Ishta / Kashta', 'इष्ट / कष्ट')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums font-mono">
            {shadbala.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2 font-sans font-semibold text-slate-900 dark:text-slate-100">{pName(s.id, lang)}</td>
                <td className="px-3 py-2 text-right">{s.sthana.total.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{s.dig.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{s.kala.total.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{s.cheshta.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{s.naisargika.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{s.drik.toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-semibold text-amber-700 dark:text-amber-300">
                  {s.totalRupas.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right text-slate-500">{s.requiredRupas.toFixed(1)}</td>
                <td
                  className={`px-3 py-2 text-right font-semibold ${
                    s.ratioPct >= 100 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {s.ratioPct.toFixed(0)}%
                </td>
                <td className="px-3 py-2 text-right">
                  {s.ishtaPhala.toFixed(1)} / {s.kashtaPhala.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sthana & Vimsopaka Component Sub-Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">{tx(lang, 'స్థాన బల విభాగాలు', 'Sthana Bala Components', 'स्थान बल घटक')}</h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tr(lang, 'planet')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'ఉచ్చ', 'Uchcha')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'సప్తవర్గ', 'Saptavarga')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'ఓజయుగ్మ', 'Ojhayugma')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'కేంద్రాది', 'Kendradi')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'ద్రేక్కాణ', 'Drekkana')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums font-mono">
              {shadbala.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 font-sans font-medium">{pShort(s.id, lang)}</td>
                  <td className="px-3 py-2 text-right">{s.sthana.uchcha.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">{s.sthana.saptavargaja.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">{s.sthana.ojhayugma.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">{s.sthana.kendradi.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">{s.sthana.drekkana.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">
              {tx(lang, 'వింశోపక బలం (20 లోపు)', 'Vimsopaka Bala (out of 20)', 'विंशोपक बल (20 में से)')}
            </h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tr(lang, 'planet')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'షడ్వర్గ (6)', 'Shadvarga (6)')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'సప్తవర్గ (7)', 'Saptavarga (7)')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'దశవర్గ (10)', 'Dashavarga (10)')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'షోడశవర్గ (16)', 'Shodashavarga (16)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums font-mono">
              {vimsopaka.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-2 font-sans font-medium">{pShort(v.id, lang)}</td>
                  <td className="px-3 py-2 text-right">{v.shadvarga.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{v.saptavarga.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{v.dashavarga.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-amber-700 dark:text-amber-300">
                    {v.shodashavarga.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bhava Bala */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold">
            {tx(lang, 'భావబలం (12 భావాల బలం)', 'Bhava Bala (Strength of 12 Houses)', 'भाव बल (12 भाव)')}
          </h3>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="px-3 py-2">{tr(lang, 'house')}</th>
              <th className="px-3 py-2">{tr(lang, 'sign')}</th>
              <th className="px-3 py-2">{tx(lang, 'అధిపతి', 'Lord')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'భావాధిపతి', 'Bhavadhipati')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'భావ దిగ్', 'Bhava Dig')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'భావ దృక్', 'Bhava Drishti')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'మొత్తం రూపాలు', 'Total Rupas')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'ర్యాంక్', 'Rank')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums font-mono">
            {bhavaBala.map((b) => (
              <tr key={b.house}>
                <td className="px-3 py-2 font-semibold">H{b.house}</td>
                <td className="px-3 py-2 font-sans">{sName(b.sign, lang)}</td>
                <td className="px-3 py-2 font-sans">{pShort(b.lord, lang)}</td>
                <td className="px-3 py-2 text-right">{b.bhavadhipatiBala.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{b.bhavaDigbala.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{b.bhavaDrishtiBala.toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-semibold">{b.totalRupas.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">#{b.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AshtakavargaPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, lang } = useApp();
  const [shodhanaView, setShodhanaView] = useState<'raw' | 'trikona' | 'ekadhipatya'>(
    subTab === 'trikona' ? 'trikona' : subTab === 'ekadhipatya' ? 'ekadhipatya' : 'raw',
  );
  const transits = useMemo(() => computeTransitReport(chart), [chart]);
  const savTotal = chart.asht.sav.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {tx(lang, 'సర్వాష్టకవర్గ మొత్తం:', 'Sarva Ashtakavarga Total:', 'सर्वाष्टकवर्ग कुल:')}{' '}
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {savTotal} {tx(lang, 'బిందువులు', 'Bindus', 'बिंदु')}
          </span>{' '}
          ({tx(lang, 'శాస్త్రోక్త 337 తనిఖీ', 'Classical 337 check', 'शास्त्रीय 337 जांच')})
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs">
          {(
            [
              ['raw', tx(lang, 'భిన్నాష్టక / సర్వ', 'BAV / SAV', 'BAV / SAV')],
              ['trikona', tx(lang, 'త్రికోణ శోధన', 'Trikona Shodhana', 'त्रिकोण शोधन')],
              ['ekadhipatya', tx(lang, 'ఏకాధిపత్య శోధన', 'Ekadhipatya Shodhana', 'एकाधिपत्य शोधन')],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setShodhanaView(m)}
              className={`px-3 py-1 rounded-md font-medium ${
                shodhanaView === m ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main BAV + SAV Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="px-3 py-2">{tr(lang, 'planet')}</th>
              {Array.from({ length: 12 }, (_, s) => (
                <th key={s} className="px-2 py-2 text-right">
                  {sShort(s, lang)}
                </th>
              ))}
              <th className="px-3 py-2 text-right">{tx(lang, 'శోధ్య పిండ', 'Sodhya Pinda', 'शोध्य पिंड')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums font-mono">
            {SEVEN.map((pid) => {
              const row =
                shodhanaView === 'trikona'
                  ? chart.asht.trikonaBav[pid]
                  : shodhanaView === 'ekadhipatya'
                    ? chart.asht.ekadhipatyaBav[pid]
                    : chart.asht.bav[pid];
              return (
                <tr key={pid}>
                  <td className="px-3 py-2 font-sans font-semibold">{pName(pid, lang)}</td>
                  {row.map((val, s) => (
                    <td
                      key={s}
                      className={`px-2 py-2 text-right ${
                        val >= 5
                          ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                          : val <= 2
                            ? 'text-amber-700 dark:text-amber-400'
                            : ''
                      }`}
                    >
                      {val}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {chart.asht.sodhyaPinda[pid]}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-amber-50/50 dark:bg-amber-950/20 font-semibold">
              <td className="px-3 py-2 font-sans">{tx(lang, 'సర్వ (SAV)', 'Sarva (SAV)', 'सर्व (SAV)')}</td>
              {chart.asht.sav.map((val, s) => (
                <td key={s} className="px-2 py-2 text-right">
                  {val}
                </td>
              ))}
              <td className="px-3 py-2 text-right">{savTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pindas & Transit Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">
              {tx(lang, 'రాశి, గ్రహ & శోధ్య పిండాలు', 'Rashi, Graha & Sodhya Pinda', 'राशि, ग्रह व शोध्य पिंड')}
            </h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tr(lang, 'planet')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'రాశి పిండ', 'Rashi Pinda')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'గ్రహ పిండ', 'Graha Pinda')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'శోధ్య పిండ', 'Sodhya Pinda')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums font-mono">
              {SEVEN.map((pid) => (
                <tr key={pid}>
                  <td className="px-3 py-2 font-sans font-medium">{pName(pid, lang)}</td>
                  <td className="px-3 py-2 text-right">{chart.asht.rashiPinda[pid]}</td>
                  <td className="px-3 py-2 text-right">{chart.asht.grahaPinda[pid]}</td>
                  <td className="px-3 py-2 text-right font-semibold">{chart.asht.sodhyaPinda[pid]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">
              {tx(lang, 'ప్రస్తుత గోచార బిందువులు (కక్ష్య బలం)', 'Current Transit Bindus (Kakshya Strength)', 'वर्तमान गोचर बिंदु')}
            </h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tr(lang, 'planet')}</th>
                <th className="px-3 py-2">{tx(lang, 'గోచార రాశి', 'Transit Sign')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'BAV బిందువులు', 'BAV Bindus')}</th>
                <th className="px-3 py-2 text-right">{tx(lang, 'SAV బిందువులు', 'SAV Bindus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {transits.rows
                .filter((r) => r.bavBindus !== null)
                .map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 font-medium">{pName(r.id, lang)}</td>
                    <td className="px-3 py-2">{sName(r.sign, lang)}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.bavBindus} / 8</td>
                    <td className="px-3 py-2 text-right font-mono">{r.savBindus}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const YogasDoshasPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, lang } = useApp();
  const isTe = lang === 'te';
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'doshas' | 'cancellations'>(
    subTab === 'cancellations'
      ? 'cancellations'
      : ['kuja', 'kalasarpa', 'pitru', 'grahana', 'guruchandal', 'other-doshas'].includes(subTab)
        ? 'doshas'
        : 'active',
  );

  const filtered = useMemo(() => {
    return chart.yogas.filter((y) => {
      if (filterMode === 'active') return y.on;
      if (filterMode === 'doshas') return y.category === 'dosha';
      if (filterMode === 'cancellations') return y.cancelled || Boolean(y.cancelNote);
      return true;
    });
  }, [chart.yogas, filterMode]);

  const activeCount = chart.yogas.filter((y) => y.on && y.category !== 'dosha').length;
  const activeDoshaCount = chart.yogas.filter((y) => y.on && y.category === 'dosha').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {tx(
            lang,
            `మొత్తం ${chart.yogas.length} నియమాలలో ${activeCount} శాస్త్రీయ యోగాలు · ${activeDoshaCount} దోషాలు గుర్తించబడ్డాయి`,
            `${activeCount} active Classical Yogas · ${activeDoshaCount} active Doshas evaluated out of ${chart.yogas.length} rules`,
            `${chart.yogas.length} नियमों में से ${activeCount} योग · ${activeDoshaCount} दोष सक्रिय`,
          )}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs">
          {(
            [
              ['active', tx(lang, 'క్రియాశీల యోగాలు', 'Active in Chart', 'सक्रिय')],
              ['doshas', tx(lang, 'దోషాలు', 'Doshas', 'दोष')],
              ['cancellations', tx(lang, 'దోష పరిహారం', 'Cancellations', 'निवारण')],
              ['all', tx(lang, 'అన్నీ', 'All Evaluated', 'सभी')],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilterMode(k)}
              className={`px-3 py-1 rounded-md font-medium ${
                filterMode === k
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((y) => (
          <div
            key={y.id}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {isTe ? y.n : y.nEn}
                </h3>
                <div className="text-[11px] text-slate-400">
                  {y.src} · {y.category}
                </div>
              </div>
              <span
                className={`font-semibold whitespace-nowrap ${
                  !y.on
                    ? 'text-slate-400'
                    : y.cancelled
                      ? 'text-amber-600 dark:text-amber-400'
                      : y.category === 'dosha'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {!y.on
                  ? tx(lang, 'లేనిది', 'Inactive', 'निष्क्रिय')
                  : y.cancelled
                    ? tx(lang, 'పరిహృత / రద్దు', 'Mitigated / Cancelled', 'निवारित')
                    : tx(lang, 'ప్రస్తుతం ఉంది', 'Present', 'सक्रिय')}
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-300">{isTe ? y.why : y.whyEn}</p>
            {y.cancelNote && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                {tx(lang, 'మినహాయింపు:', 'Exception:')} {y.cancelNote}
              </p>
            )}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
              {y.c.map(([cond, ok], idx) => (
                <span key={idx}>
                  {ok ? '✓' : '○'} {cond}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NakshatraPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, lang } = useApp();
  const isTe = lang === 'te';
  const birthNk = ALL_NAKSHATRAS[chart.pan.nk];
  const birthMoon = chart.rows.find((r) => r.id === 1)!;
  const transits = useMemo(() => computeTransitReport(chart), [chart]);
  const transitMoon = transits.rows.find((r) => r.id === 1)!;
  const taraChandra = evaluateTaraChandraBala(chart.p[1], transitMoon.lon);
  const [selectedNk, setSelectedNk] = useState<number>(chart.pan.nk);
  const activeNk = ALL_NAKSHATRAS[selectedNk] || birthNk;

  return (
    <div className="space-y-6">
      {/* Birth Nakshatra + Today's Tara/Chandra Bala */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {tx(lang, 'జన్మ నక్షత్రం', 'Janma Nakshatra', 'जन्म नक्षत्र')} —{' '}
              {isTe ? birthNk.nameTe : birthNk.nameEn} ({tx(lang, 'పాదం', 'Pada', 'पद')} {birthMoon.pada})
            </h2>
            <span className="text-slate-500 font-mono">{subTab}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-slate-400">{tx(lang, 'అధిపతి:', 'Lord:')}</span> {pName(birthNk.lord, lang)}
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'అధిదేవత:', 'Deity:')}</span>{' '}
              {isTe ? NAK_DEITIES_TE[birthNk.index] : birthNk.deity}
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'గణ / నాడి:', 'Gana / Nadi:')}</span> {birthNk.gana} ·{' '}
              {birthNk.nadi}
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'యోని / తత్వం:', 'Yoni / Tatva:')}</span> {birthNk.yoni} ·{' '}
              {birthNk.tatva}
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'చిహ్నం:', 'Symbol:')}</span>{' '}
              {isTe ? birthNk.symbolTe : birthNk.symbolEn}
            </div>
            <div>
              <span className="text-slate-400">{tx(lang, 'నామాక్షరం:', 'Pada Syllable:')}</span>{' '}
              {birthNk.syllablesTe[birthMoon.pada - 1]} ({birthNk.syllablesEn[birthMoon.pada - 1]})
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx(
              lang,
              'నేటి గోచార తారాబలం & చంద్రబలం',
              "Current Transit Tara Bala & Chandra Bala",
              'वर्तमान गोचर ताराबल व चंद्रबल',
            )}
          </h2>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="text-slate-400">{tx(lang, 'నేటి నక్షత్రం', "Today's Transit Star")}</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {NAK_NAMES[lang]?.[taraChandra.targetNk]}
              </div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'తారాబలం', 'Tara Bala')}</div>
              <div
                className={`font-semibold mt-0.5 ${
                  taraChandra.taraFavorable ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                #{taraChandra.taraNumber} {isTe ? taraChandra.taraNameTe : taraChandra.taraNameEn} (
                {taraChandra.taraFavorable ? tx(lang, 'శుభం', 'Favorable') : tx(lang, 'జాగ్రత్త', 'Caution')})
              </div>
            </div>
            <div>
              <div className="text-slate-400">
                {tx(lang, 'చంద్రబలం (జన్మ రాశి నుండి)', 'Chandra Bala (House from Natal Moon)')}
              </div>
              <div
                className={`font-semibold mt-0.5 ${
                  taraChandra.chandraFavorable ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {tx(lang, `${taraChandra.chandraHouse}వ స్థానం`, `House ${taraChandra.chandraHouse}`)} (
                {taraChandra.chandraFavorable ? tx(lang, 'బలమైనది', 'Strong') : tx(lang, 'మిశ్రమం', 'Mixed')})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Nakshatra 4 Padas Inspector */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold">
            {activeNk.index + 1}. {isTe ? activeNk.nameTe : activeNk.nameEn} ({isTe ? activeNk.nameEn : activeNk.nameTe}) —{' '}
            {tx(lang, '4 పాదాలు', '4 Padas', '4 चरण')}
          </h3>
          <select
            value={selectedNk}
            onChange={(e) => setSelectedNk(Number(e.target.value))}
            className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs"
          >
            {ALL_NAKSHATRAS.map((n) => (
              <option key={n.index} value={n.index}>
                {n.index + 1}. {isTe ? `${n.nameTe} (${n.nameEn})` : `${n.nameEn} (${n.nameTe})`}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {activeNk.padas.map((pd) => (
            <div key={pd.pada} className="p-3 rounded border border-slate-200 dark:border-slate-800">
              <div className="font-semibold">
                {tx(lang, 'పాదం', 'Pada', 'पद')} {pd.pada}
              </div>
              <div className="text-slate-500 mt-0.5">
                {tx(lang, 'నవాంశ:', 'Navamsha:')} {sName(pd.navamshaSign, lang)}
              </div>
              <div className="text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                {tx(lang, 'అక్షరం:', 'Syllable:')} {pd.syllableTe} ({pd.syllableEn})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete 27 Nakshatra Reference Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{tr(lang, 'nakshatra')}</th>
              <th className="px-3 py-2">{tx(lang, 'అధిపతి', 'Lord')}</th>
              <th className="px-3 py-2">{tx(lang, 'దేవత', 'Deity')}</th>
              <th className="px-3 py-2">{tx(lang, 'గణ / నాడి / యోని', 'Gana / Nadi / Yoni')}</th>
              <th className="px-3 py-2">{tx(lang, 'నామాక్షరాలు', 'Syllables')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {ALL_NAKSHATRAS.map((n) => (
              <tr
                key={n.index}
                onClick={() => setSelectedNk(n.index)}
                className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                  n.index === chart.pan.nk ? 'bg-amber-50/60 dark:bg-amber-950/20 font-medium' : ''
                }`}
              >
                <td className="px-3 py-2 font-mono">{n.index + 1}</td>
                <td className="px-3 py-2">
                  {isTe ? `${n.nameTe} (${n.nameEn})` : `${n.nameEn} (${n.nameTe})`}
                </td>
                <td className="px-3 py-2">{pName(n.lord, lang)}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                  {isTe ? NAK_DEITIES_TE[n.index] : n.deity}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {n.gana} · {n.nadi} · {n.yoni}
                </td>
                <td className="px-3 py-2 font-mono">
                  {isTe ? n.syllablesTe.join(', ') : n.syllablesEn.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
