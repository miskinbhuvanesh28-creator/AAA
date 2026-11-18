import React, { useMemo, useState } from 'react';
import { ChartRenderer, NorthIndianChart, SouthIndianChart } from '../components/ChartsSVG.tsx';
import { useApp } from '../context/AppContext.tsx';
import {
  HOUSE_SIGNIFICANCE,
  NAK_NAMES,
  RASHI_TRAITS,
  SEVEN,
  SIGN_LORDS,
  pName,
  pShort,
  sName,
  sShort,
} from '../engine/constants.ts';
import { formatDms } from '../engine/ephemeris.ts';
import { tr } from '../engine/i18n.ts';
import {
  computeAspectMatrix,
  computeAvasthas,
  computeDispositorChains,
  computeGrahaYuddha,
  computeIntegratedInterpretation,
  computeSpecialPointsAndUpagrahas,
  getFunctionalNature,
} from '../engine/parashari.ts';
import { computeBhavaBala, computeShadbala, computeVimsopaka } from '../engine/strength.ts';
import type { Language, PlanetId } from '../engine/types.ts';
import { ALL_VARGAS, EXTENDED_VARGA_NOTE, buildAllVargas, buildVargaChart, vargottamaSummary } from '../engine/vargas.ts';

function tx(lang: Language, te: string, en: string, hi?: string): string {
  if (lang === 'te') return te;
  if (lang === 'hi' && hi) return hi;
  return en;
}

const ROLE_LABELS: Record<string, { te: string; en: string; hi: string }> = {
  Yogakaraka: { te: 'యోగకారకుడు', en: 'Yogakaraka', hi: 'योगकारक' },
  Benefic: { te: 'శుభగ్రహం', en: 'Benefic', hi: 'शुभ' },
  Malefic: { te: 'పాపగ్రహం', en: 'Malefic', hi: 'पाप' },
  Neutral: { te: 'సమగ్రహం', en: 'Neutral', hi: 'सम' },
  Maraka: { te: 'మారకుడు', en: 'Maraka', hi: 'मारक' },
  Node: { te: 'ఛాయాగ్రహం', en: 'Lunar Node', hi: 'छाया ग्रह' },
};

export const HoroscopePage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, chartStyle, lang, activeProfile } = useApp();
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId>(0);
  const [selectedHouse, setSelectedHouse] = useState<number>(1);
  const isTe = lang === 'te';

  const displayStyle =
    subTab === 'north-indian' ? 'north' : subTab === 'south-indian' ? 'south' : chartStyle;
  const activeLagna =
    subTab === 'moon-chart' ? chart.s[1] : subTab === 'sun-chart' ? chart.s[0] : chart.lagS;
  const chartTitle =
    subTab === 'moon-chart'
      ? tx(lang, 'చంద్ర లగ్నం', 'Chandra Lagna', 'चंद्र लग्न')
      : subTab === 'sun-chart'
        ? tx(lang, 'సూర్య లగ్నం', 'Surya Lagna', 'सूर्य लग्न')
        : subTab === 'bhava-chalit'
          ? tx(lang, 'భావ చలిత చక్రం', 'Bhava Chalit', 'भाव चलित')
          : tx(lang, 'D1 రాశి చక్రం', 'D1 Rashi', 'D1 राशि');

  const signsForChart = useMemo(() => {
    if (subTab === 'bhava-chalit') {
      return chart.rows.map((r) => (chart.lagS + r.bhava - 1) % 12);
    }
    return chart.s;
  }, [subTab, chart]);

  const aspects = useMemo(() => computeAspectMatrix(chart), [chart]);
  const dispositors = useMemo(() => computeDispositorChains(chart), [chart]);
  const fnNature = useMemo(() => getFunctionalNature(chart.lagS), [chart.lagS]);
  const avasthas = useMemo(() => computeAvasthas(chart), [chart]);
  const shadbala = useMemo(() => computeShadbala(chart), [chart]);
  const bhavaBala = useMemo(() => computeBhavaBala(chart, shadbala), [chart, shadbala]);
  const vimsopaka = useMemo(() => computeVimsopaka(chart), [chart]);

  const aspectsByPlanet = useMemo(() => {
    const map = new Map<PlanetId, typeof aspects>();
    for (const a of aspects) {
      const list = map.get(a.from) || [];
      list.push(a);
      map.set(a.from, list);
    }
    return Array.from(map.entries());
  }, [aspects]);

  // Selected Planet inspection data
  const inspectedRow = chart.rows.find((r) => r.id === selectedPlanet) || chart.rows[0];
  const inspectedAvastha = avasthas.find((a) => a.id === selectedPlanet);
  const inspectedShadbala = shadbala.find((s) => s.id === selectedPlanet);
  const inspectedVim = vimsopaka.find((v) => v.id === selectedPlanet);
  const inspectedRole = fnNature.byPlanet[selectedPlanet];

  // Selected House inspection data
  const houseIdx = Math.max(1, Math.min(12, selectedHouse));
  const inspectedHouseSign = (activeLagna + houseIdx - 1) % 12;
  const inspectedHouseLord = SIGN_LORDS[inspectedHouseSign];
  const inspectedHouseOccupants = chart.rows.filter(
    (r) => ((signsForChart[r.id] - activeLagna + 12) % 12) + 1 === houseIdx,
  );
  const inspectedHouseSig = HOUSE_SIGNIFICANCE[houseIdx - 1];
  const inspectedRashiTrait = RASHI_TRAITS[inspectedHouseSign];
  const inspectedBhavaBala = bhavaBala.find((b) => b.house === houseIdx);
  const inspectedSav = chart.asht.sav[inspectedHouseSign] ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Dual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{chartTitle}</h2>
            <span className="text-[11px] text-slate-500 text-right">{tr(lang, 'clickToInspect')}</span>
          </div>
          <ChartRenderer
            style={displayStyle}
            data={{
              lagnaSign: activeLagna,
              signsByPlanet: signsForChart,
              retroFlags: chart.rows.map((r) => r.retro),
              combustFlags: chart.rows.map((r) => r.combust),
            }}
            title={chartTitle}
            subtitle={activeProfile.name}
            lang={lang}
            cusps={chart.cu}
            rows={chart.rows}
            outerPlanets={chart.outerPlanets}
            onSelectPlanet={setSelectedPlanet}
            onSelectHouse={(h) => setSelectedHouse(h)}
          />
        </div>

        <div className="lg:col-span-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {tx(lang, 'గ్రహ స్థితి పట్టిక', 'Planetary Positions (Graha Sthiti)', 'ग्रह स्थिति तालिका')}
            </h2>
            <span className="text-xs text-slate-500">
              {chart.config.sidereal ? tr(lang, 'sidereal') : tr(lang, 'tropical')} ·{' '}
              {chart.config.nodeType === 'true'
                ? tx(lang, 'నిజ రాహు-కేతు', 'True Node', 'सत्य राहु-केतु')
                : tx(lang, 'సగటు రాహు-కేతు', 'Mean Node', 'मध्यम राहु-केतु')}
            </span>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tr(lang, 'planet')}</th>
                <th className="px-3 py-2">{tx(lang, 'రాశి & డిగ్రీ', 'Sign & Degree', 'राशि व अंश')}</th>
                <th className="px-3 py-2">{tr(lang, 'nakshatra')}</th>
                <th className="px-3 py-2">{tr(lang, 'subLord')}</th>
                <th className="px-3 py-2 text-right">{tr(lang, 'house')}</th>
                <th className="px-3 py-2">{tr(lang, 'dignity')}</th>
                <th className="px-3 py-2 text-right">{tr(lang, 'speed')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              <tr
                onClick={() => setSelectedHouse(1)}
                className="cursor-pointer bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 dark:hover:bg-amber-950/40"
              >
                <td className="px-3 py-2 font-semibold">{tr(lang, 'lagna')}</td>
                <td className="px-3 py-2 font-mono">
                  {sName(chart.lagS, lang)} {formatDms(chart.lag % 30)}
                </td>
                <td className="px-3 py-2">{NAK_NAMES[lang]?.[Math.floor(chart.lag / (360 / 27))]}</td>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2 text-right font-mono">1</td>
                <td className="px-3 py-2">{tx(lang, 'లగ్నం', 'Ascendant', 'लग्न')}</td>
                <td className="px-3 py-2 text-right">—</td>
              </tr>
              {chart.rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => {
                    setSelectedPlanet(r.id);
                    setSelectedHouse(r.house);
                  }}
                  className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    selectedPlanet === r.id ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                    {pName(r.id, lang)} {r.retro ? `(${tr(lang, 'retrograde')})` : ''} {r.combust ? '*' : ''}{' '}
                    {r.vgt ? 'V' : ''}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {sName(r.sign, lang)} {formatDms(r.degInSign)}
                  </td>
                  <td className="px-3 py-2">
                    {NAK_NAMES[lang]?.[r.nk] || NAK_NAMES.en[r.nk]} P{r.pada}
                  </td>
                  <td className="px-3 py-2">{pShort(r.sub[1], lang)}</td>
                  <td className="px-3 py-2 text-right font-mono">{r.house}</td>
                  <td className="px-3 py-2">{isTe ? r.dig : r.digKey}</td>
                  <td className="px-3 py-2 text-right font-mono">{r.spd.toFixed(2)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Planet Inspector + House & Rashi Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{tr(lang, 'inspectorPlanet')}</div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {pName(inspectedRow.id, lang)} — {sName(inspectedRow.sign, lang)} {formatDms(inspectedRow.degInSign)}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1">
              {chart.rows.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedPlanet(r.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    selectedPlanet === r.id
                      ? 'bg-amber-600 text-white'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {pShort(r.id, lang)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 tabular-nums">
            <div>
              <div className="text-slate-400">{tr(lang, 'nakshatra')}</div>
              <div className="font-medium mt-0.5">
                {NAK_NAMES[lang]?.[inspectedRow.nk]} · P{inspectedRow.pada}
              </div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'KP నక్షత్ర/సబ్', 'KP Star / Sub', 'KP नक्षत्र/सब')}</div>
              <div className="font-medium mt-0.5">
                {pShort(inspectedRow.sub[0], lang)} / {pShort(inspectedRow.sub[1], lang)} /{' '}
                {pShort(inspectedRow.sub[2], lang)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'రాశి / భావ స్థానం', 'Rashi / Bhava House', 'राशि / भाव')}</div>
              <div className="font-mono font-medium mt-0.5">
                H{inspectedRow.house} · {tx(lang, 'భావం', 'Bhava', 'भाव')} {inspectedRow.bhava}
              </div>
            </div>
            <div>
              <div className="text-slate-400">{tr(lang, 'dignity')}</div>
              <div className="font-medium mt-0.5">
                {isTe ? inspectedRow.dig : inspectedRow.digKey} · D9 {sName(inspectedRow.d9, lang)}
              </div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'కారక స్వభావం', 'Functional Role', 'कारक प्रकृति')}</div>
              <div className="font-medium mt-0.5 text-amber-700 dark:text-amber-300">
                {inspectedRole
                  ? `${ROLE_LABELS[inspectedRole.role]?.[lang === 'te' ? 'te' : lang === 'hi' ? 'hi' : 'en'] || inspectedRole.role}${
                      inspectedRole.badhaka ? ` (${tx(lang, 'బాధక', 'Badhaka')})` : ''
                    }`
                  : ROLE_LABELS.Node[lang === 'te' ? 'te' : lang === 'hi' ? 'hi' : 'en']}
              </div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'షడ్బల / వింశోపక', 'Shadbala / Vimsopaka', 'षड्बल / विंशोपक')}</div>
              <div className="font-mono font-medium mt-0.5">
                {inspectedShadbala
                  ? `${inspectedShadbala.totalRupas.toFixed(2)} (${inspectedShadbala.ratioPct.toFixed(0)}%)`
                  : '—'}
                {inspectedVim ? ` · ${inspectedVim.shodashavarga.toFixed(1)}/20` : ''}
              </div>
            </div>
          </div>

          {inspectedAvastha && (
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">{tx(lang, 'బాలాది:', 'Baladi:')}</span>{' '}
                <span className="font-medium">{isTe ? inspectedAvastha.baladiTe : inspectedAvastha.baladi}</span>
              </div>
              <div>
                <span className="text-slate-400">{tx(lang, 'దీప్తాది:', 'Deeptadi:')}</span>{' '}
                <span className="font-medium">{isTe ? inspectedAvastha.deeptadiTe : inspectedAvastha.deeptadi}</span>
              </div>
              <div>
                <span className="text-slate-400">{tx(lang, 'జాగ్రదాది:', 'Jagradadi:')}</span>{' '}
                <span className="font-medium">{isTe ? inspectedAvastha.jagradadiTe : inspectedAvastha.jagradadi}</span>
              </div>
              <div>
                <span className="text-slate-400">{tx(lang, 'లజ్జితాది:', 'Lajjitadi:')}</span>{' '}
                <span className="font-medium">{isTe ? inspectedAvastha.lajjitadiTe : inspectedAvastha.lajjitadiEn}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">{tx(lang, 'శయనాది:', 'Shayanadi:')}</span>{' '}
                <span className="font-medium">{isTe ? inspectedAvastha.shayanadiTe : inspectedAvastha.shayanadiEn}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">{tr(lang, 'inspectorHouse')}</div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                H{houseIdx} — {sName(inspectedHouseSign, lang)} ({pName(inspectedHouseLord, lang)})
              </h3>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelectedHouse(h)}
                  className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                    houseIdx === h
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-slate-400">{tx(lang, 'భావ కారకత్వాలు:', 'Significations:', 'भाव कारकत्व:')}</span>{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {isTe ? inspectedHouseSig.te : inspectedHouseSig.en}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 tabular-nums">
              <div>
                <div className="text-slate-400">{tx(lang, 'కస్ప్ డిగ్రీ', 'House Cusp')}</div>
                <div className="font-mono font-medium mt-0.5">{formatDms(chart.cu[houseIdx - 1] % 30)}</div>
              </div>
              <div>
                <div className="text-slate-400">{tx(lang, 'భావ బలం', 'Bhava Bala')}</div>
                <div className="font-mono font-medium mt-0.5">
                  {inspectedBhavaBala ? `${inspectedBhavaBala.totalRupas.toFixed(2)} (#${inspectedBhavaBala.rank})` : '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-400">{tx(lang, 'SAV బిందువులు', 'SAV Bindus')}</div>
                <div className="font-mono font-medium text-amber-700 dark:text-amber-300 mt-0.5">{inspectedSav}</div>
              </div>
              <div>
                <div className="text-slate-400">{tx(lang, 'స్థిత గ్రహాలు', 'Occupants')}</div>
                <div className="font-medium mt-0.5">
                  {inspectedHouseOccupants.length
                    ? inspectedHouseOccupants.map((o) => pShort(o.id, lang)).join(', ')
                    : tx(lang, 'ఖాళీ', 'Empty')}
                </div>
              </div>
            </div>
            {inspectedRashiTrait && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-400">{tx(lang, 'రాశి స్వభావం:', 'Rashi Traits:')}</span>{' '}
                  {isTe
                    ? `${inspectedRashiTrait.elementTe} · ${inspectedRashiTrait.modalityTe} · ${inspectedRashiTrait.directionTe}`
                    : `${inspectedRashiTrait.elementEn} · ${inspectedRashiTrait.modalityEn} · ${inspectedRashiTrait.directionEn}`}
                </div>
                <div>{isTe ? inspectedRashiTrait.natureTe : inspectedRashiTrait.natureEn}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-view Tabs: House Analysis / Aspects / Dispositors */}
      {(subTab === 'house-analysis' || subTab === 'ascendant-analysis' || subTab === 'complete-chart') && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {tx(lang, 'ద్వాదశ భావ విశ్లేషణ (12 భావాలు)', 'Twelve Bhavas (House Analysis)', 'द्वादश भाव विश्लेषण')}
            </h3>
            <span className="text-xs text-slate-500">
              {tx(lang, 'భావంపై క్లిక్ చేసి పరిశీలించండి', 'Click a row to inspect', 'विवरण के लिए पंक्ति पर क्लिक करें')}
            </span>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tr(lang, 'house')}</th>
                <th className="px-3 py-2">{tx(lang, 'రాశి & కస్ప్', 'Sign & Cusp', 'राशि व कस्प')}</th>
                <th className="px-3 py-2">{tx(lang, 'అధిపతి', 'Lord', 'स्वामी')}</th>
                <th className="px-3 py-2">{tx(lang, 'గ్రహాలు', 'Occupants', 'स्थित ग्रह')}</th>
                <th className="px-3 py-2">{tx(lang, 'కారకత్వాలు', 'Significations', 'कारकत्व')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {Array.from({ length: 12 }, (_, i) => {
                const signIdx = (activeLagna + i) % 12;
                const lord = SIGN_LORDS[signIdx];
                const occ = chart.rows
                  .filter((r) => ((signsForChart[r.id] - activeLagna + 12) % 12) + 1 === i + 1)
                  .map((r) => pName(r.id, lang));
                const sig = HOUSE_SIGNIFICANCE[i];
                return (
                  <tr
                    key={i}
                    onClick={() => setSelectedHouse(i + 1)}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      houseIdx === i + 1 ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-mono font-semibold">H{i + 1}</td>
                    <td className="px-3 py-2 font-mono">
                      {sName(signIdx, lang)} · {formatDms(chart.cu[i] % 30)}
                    </td>
                    <td className="px-3 py-2">{pName(lord, lang)}</td>
                    <td className="px-3 py-2">{occ.length ? occ.join(', ') : '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{isTe ? sig.te : sig.en}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(subTab === 'planetary-aspects' || subTab === 'planetary-relationships') && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            {tx(
              lang,
              'పరాశరీ గ్రహ దృష్టి (భావ–గ్రహ దృష్టులు)',
              'Parashari Graha Drishti (House-to-House Aspects)',
              'पाराशरी ग्रह दृष्टि',
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {aspectsByPlanet.map(([from, list]) => {
              const targetHits = Array.from(new Set(list.flatMap((x) => x.planetsHit)));
              return (
                <div key={from} className="p-3 rounded border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {pName(from, lang)} ({sName(chart.s[from], lang)})
                  </div>
                  <div className="text-slate-500 mt-1">
                    {tx(lang, 'దృష్టి రాశులు:', 'Aspects signs:', 'दृष्टि राशियाँ:')}{' '}
                    {list.map((a) => `${sName(a.toSign, lang)} (H${a.toHouse})`).join(', ')}
                  </div>
                  <div className="text-amber-700 dark:text-amber-400 mt-0.5">
                    {tx(lang, 'దృష్టి పడే గ్రహాలు:', 'Touches planets:', 'प्रभावित ग्रह:')}{' '}
                    {targetHits.length ? targetHits.map((tp) => pName(tp, lang)).join(', ') : tx(lang, 'లేవు', 'None')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'dispositor-analysis' && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            {tx(lang, 'రాశ్యాధిపతి శృంఖల & అంతిమ అధిపతి', 'Dispositor Chains & Final Dispositors', 'राशीश श्रृंखला')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {dispositors.map((dc) => (
              <div key={dc.start} className="p-3 rounded border border-slate-200 dark:border-slate-800">
                <div className="font-semibold">{pName(dc.start, lang)}</div>
                <div className="text-slate-500 mt-1">{dc.chain.map((pid) => pShort(pid, lang)).join(' → ')}</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                  {dc.loop
                    ? tx(lang, 'పరస్పర పరివర్తన / చక్రం', 'Mutual Reception / Cycle', 'परिवर्तन योग / चक्र')
                    : `${tx(lang, 'అంతిమ అధిపతి:', 'Final Dispositor:', 'अंतिम स्वामी:')} ${
                        dc.finalDispositor !== null ? pName(dc.finalDispositor, lang) : tx(lang, 'స్వక్షేత్రం', 'Self')
                      }`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const ParashariPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, lang } = useApp();
  const isTe = lang === 'te';
  const fnNature = useMemo(() => getFunctionalNature(chart.lagS), [chart.lagS]);
  const avasthas = useMemo(() => computeAvasthas(chart), [chart]);
  const special = useMemo(() => computeSpecialPointsAndUpagrahas(chart), [chart]);
  const grahaYuddha = useMemo(() => computeGrahaYuddha(chart), [chart]);
  const shadbala = useMemo(() => computeShadbala(chart), [chart]);
  const bhavaBala = useMemo(() => computeBhavaBala(chart, shadbala), [chart, shadbala]);
  const integrated = useMemo(
    () => computeIntegratedInterpretation(chart, shadbala, bhavaBala),
    [chart, shadbala, bhavaBala],
  );

  return (
    <div className="space-y-6">
      {/* Integrated Parashari Interpretation */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              {tx(lang, 'సమగ్ర పరాశరీ ఫలిత సారాంశం', 'Integrated Parashari Synthesis', 'समग्र पाराशरी विश्लेषण')}
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {isTe ? integrated.headlineTe : integrated.headlineEn}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">{subTab}</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {integrated.factors.map((f, idx) => (
            <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {isTe ? f.pillarTe : f.pillarEn}:{' '}
                </span>
                <span className="text-slate-600 dark:text-slate-300">{isTe ? f.summaryTe : f.summaryEn}</span>
              </div>
              <span
                className={`text-[11px] font-medium shrink-0 ${
                  f.polarity === 'supportive'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : f.polarity === 'caution'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {f.polarity === 'supportive'
                  ? tx(lang, 'అనుకూలం', 'Supportive')
                  : f.polarity === 'caution'
                    ? tx(lang, 'శ్రద్ధ అవసరం', 'Caution')
                    : tx(lang, 'మిశ్రమం', 'Mixed')}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 leading-relaxed">
          {isTe ? integrated.caveatTe : integrated.caveatEn}
        </div>
      </div>

      {/* Functional Nature */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          {sName(chart.lagS, lang)}{' '}
          {tx(lang, 'లగ్నానికి గ్రహాల శుభాశుభత్వం', 'Lagna Functional Classification', 'लग्न कार्यात्मक वर्गीकरण')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
          {SEVEN.map((pid) => {
            const nature = fnNature.byPlanet[pid];
            return (
              <div key={pid} className="p-3 rounded border border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{pName(pid, lang)}</div>
                <div className="text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                  {nature ? ROLE_LABELS[nature.role]?.[isTe ? 'te' : 'en'] || nature.role : '—'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {nature
                    ? `${tx(lang, 'అధిపతి:', 'Lords:')} ${nature.houses.map((h) => `H${h}`).join(', ')}${
                        nature.badhaka ? ` · ${tx(lang, 'బాధక', 'Badhaka')}` : ''
                      }`
                    : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Avasthas & Planetary Conditions */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx(
              lang,
              'గ్రహ అవస్థలు (బాలాది, దీప్తాది, జాగ్రదాది, లజ్జితాది, శయనాది), అస్తంగతం & వక్రం',
              'Planetary Avasthas (Baladi, Deeptadi, Lajjitadi, Shayanadi), Combustion & Retrograde',
              'ग्रह अवस्थाएँ (बालादि, दीप्तादि, लज्जितादि, शयनादि)',
            )}
          </h3>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="px-3 py-2">{tr(lang, 'planet')}</th>
              <th className="px-3 py-2">{tx(lang, 'బాలాది', 'Baladi', 'बालादि')}</th>
              <th className="px-3 py-2">{tx(lang, 'జాగ్రదాది', 'Jagradadi', 'जाग्रदादि')}</th>
              <th className="px-3 py-2">{tx(lang, 'దీప్తాది', 'Deeptadi', 'दीप्तादि')}</th>
              <th className="px-3 py-2">{tx(lang, 'లజ్జితాది', 'Lajjitadi', 'लज्जितादि')}</th>
              <th className="px-3 py-2">{tx(lang, 'శయనాది', 'Shayanadi', 'शयनादि')}</th>
              <th className="px-3 py-2">{tr(lang, 'combust')}</th>
              <th className="px-3 py-2">{tx(lang, 'వక్ర / వర్గోత్తమ', 'Retro / Vargottama', 'वक्री / वर्गोत्तम')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {chart.rows.map((r) => {
              const av = avasthas.find((a) => a.id === r.id);
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium">{pName(r.id, lang)}</td>
                  <td className="px-3 py-2">{av ? (isTe ? av.baladiTe : av.baladi) : '—'}</td>
                  <td className="px-3 py-2">{av ? (isTe ? av.jagradadiTe : av.jagradadi) : '—'}</td>
                  <td className="px-3 py-2">{av ? (isTe ? av.deeptadiTe : av.deeptadi) : '—'}</td>
                  <td className="px-3 py-2">{av ? (isTe ? av.lajjitadiTe : av.lajjitadiEn) : '—'}</td>
                  <td className="px-3 py-2">{av ? (isTe ? av.shayanadiTe : av.shayanadiEn) : '—'}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">
                    {r.combust
                      ? `${tx(lang, 'అస్తంగతం', 'Combust')} (${r.combustOrb?.toFixed(2)}°)`
                      : tx(lang, 'స్పష్టం', 'Clear')}
                  </td>
                  <td className="px-3 py-2">
                    {[
                      r.retro ? tx(lang, 'వక్రం', 'Retrograde') : '',
                      r.vgt ? tx(lang, 'వర్గోత్తమ', 'Vargottama') : '',
                    ]
                      .filter(Boolean)
                      .join(', ') || tx(lang, 'మార్గి', 'Direct')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Graha Yuddha (Planetary War) */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx(lang, 'గ్రహ యుద్ధం (≤ 1° సమీప కలయిక)', 'Graha Yuddha (Planetary War ≤ 1° orb)', 'ग्रह युद्ध')}
          </h3>
          <span className="text-slate-500 font-mono">{grahaYuddha.length}</span>
        </div>
        {grahaYuddha.length === 0 ? (
          <p className="text-slate-500">
            {tx(
              lang,
              'ఈ జాతకంలో పంచతారా గ్రహాల (కుజ, బుధ, గురు, శుక్ర, శని) మధ్య 1° లోపు గ్రహ యుద్ధం లేదు.',
              'No planetary war pairs detected within 1° orb among Mars, Mercury, Jupiter, Venus, and Saturn.',
              'इस कुंडली में 1° के भीतर कोई ग्रह युद्ध नहीं है।',
            )}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {grahaYuddha.map((gw, idx) => (
              <div key={idx} className="py-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {pName(gw.p1, lang)} vs {pName(gw.p2, lang)}
                  </span>{' '}
                  <span className="text-slate-500">
                    ({sName(gw.sign, lang)}, H{gw.house} · Δ{gw.diffDeg.toFixed(2)}°)
                  </span>
                </div>
                <span className="text-amber-700 dark:text-amber-300 font-medium">
                  {isTe ? gw.noteTe : gw.noteEn}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Special Points & Upagrahas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            {tx(
              lang,
              'సున్నిత అంశలు (పుష్కర నవాంశ, గండంత, మృత్యుభాగం)',
              'Sensitive Degrees (Pushkara, Gandanta, Mrityu Bhaga)',
              'संवेदनशील अंश (पुष्कर, गंडांत, मृत्युभाग)',
            )}
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {special.points.map((sp) => (
              <div key={sp.id} className="py-2 flex items-center justify-between gap-2">
                <span className="font-medium">{pName(sp.id, lang)}</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {[
                    sp.isPushkaraNav ? tx(lang, 'పుష్కర నవాంశ', 'Pushkara Navamsha') : '',
                    sp.isPushkaraBhaga ? tx(lang, 'పుష్కర భాగం', 'Pushkara Bhaga') : '',
                    sp.isGandanta ? tx(lang, 'గండంతం', 'Gandanta') : '',
                    sp.nearMrityuBhaga ? tx(lang, 'మృత్యు భాగం', 'Mrityu Bhaga') : '',
                    sp.isSandhi ? tx(lang, 'రాశి సంధి', 'Rashi Sandhi') : '',
                  ]
                    .filter(Boolean)
                    .join(' · ') || tx(lang, 'సాధారణ డిగ్రీ', 'Standard degree')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            {tx(lang, 'ఉపగ్రహాలు (ధూమాది గులిక)', 'Upagrahas (Dhuma to Gulika)', 'उपग्रह (धूम से गुलिक)')}
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs tabular-nums">
            {special.upagrahas.map((u) => (
              <div key={u.name} className="py-2 flex items-center justify-between">
                <span className="font-medium">{u.name}</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {sName(u.sign, lang)} {formatDms(u.lon % 30)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

type VargaGroupFilter = 'all' | 'shodasha' | 'traditional' | 'extended';

export const DivisionalChartsPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, chartStyle, lang } = useApp();
  const isTe = lang === 'te';
  const subUpper = subTab.toUpperCase();
  const matchedVarga = ALL_VARGAS.find((v) => v.code === subUpper);

  const [groupFilter, setGroupFilter] = useState<VargaGroupFilter>(
    matchedVarga?.group === 'extended' ? 'extended' : 'all',
  );
  const [selectedVarga, setSelectedVarga] = useState(matchedVarga?.code || 'D9');

  const effectiveCode = matchedVarga ? matchedVarga.code : selectedVarga;
  const effectiveMeta = ALL_VARGAS.find((v) => v.code === effectiveCode) || ALL_VARGAS[8];

  const allVargas = useMemo(() => buildAllVargas(chart), [chart]);
  const vargaChart = useMemo(() => buildVargaChart(chart, effectiveMeta.v), [chart, effectiveMeta.v]);
  const vgt = useMemo(() => vargottamaSummary(chart), [chart]);
  const vimsopaka = useMemo(() => computeVimsopaka(chart), [chart]);

  const filteredMetaList = useMemo(
    () => (groupFilter === 'all' ? ALL_VARGAS : ALL_VARGAS.filter((v) => v.group === groupFilter)),
    [groupFilter],
  );
  const filteredBuiltVargas = useMemo(
    () => (groupFilter === 'all' ? allVargas : allVargas.filter((vc) => vc.meta.group === groupFilter)),
    [allVargas, groupFilter],
  );

  const toArray = (rec: Record<PlanetId, number>) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((id) => rec[id as PlanetId]);

  const showExtendedNote = groupFilter === 'extended' || effectiveMeta.v >= 81;

  return (
    <div className="space-y-6">
      {/* Group Filter Tabs + Varga Selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs">
            {(
              [
                ['all', tx(lang, 'అన్నీ (23)', 'All (23)', 'सभी (23)')],
                ['shodasha', tx(lang, 'షోడశ వర్గ (16)', 'Shodasha (16)', 'षोडश वर्ग (16)')],
                ['traditional', tx(lang, 'సాంప్రదాయ (D5–D11)', 'Traditional (4)', 'पारंपरिक (4)')],
                ['extended', tx(lang, 'అతిసూక్ష్మ (D81/D108/D144)', 'Extended (D81–D144)', 'विस्तारित (D81–D144)')],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setGroupFilter(k);
                  if (k === 'extended') setSelectedVarga('D81');
                  else if (k === 'traditional') setSelectedVarga('D5');
                }}
                className={`px-3 py-1 rounded-md font-medium ${
                  groupFilter === k
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            {tx(lang, 'మొత్తం 23 విభాగ చక్రాలు (D1–D144)', '23 Divisional Charts (D1–D144)', '23 वर्ग कुंडलियां')}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filteredMetaList.map((v) => (
            <button
              key={v.code}
              type="button"
              onClick={() => setSelectedVarga(v.code)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                effectiveCode === v.code
                  ? 'bg-amber-600 text-white'
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-amber-500'
              }`}
            >
              {v.code}
            </button>
          ))}
        </div>
      </div>

      {showExtendedNote && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200">
          {isTe ? EXTENDED_VARGA_NOTE.te : EXTENDED_VARGA_NOTE.en}
        </div>
      )}

      {subTab === 'overview' || subTab === 'varga-overview' || subTab === 'comparison' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {['D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12'].map((vk) => {
            const vc = allVargas.find((x) => x.meta.code === vk)!;
            return (
              <div
                key={vk}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-col items-center"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  {vc.meta.code} · {isTe ? vc.meta.nameTe : vc.meta.nameEn}
                </div>
                {chartStyle === 'north' ? (
                  <NorthIndianChart
                    data={{ lagnaSign: vc.lagnaSign, signsByPlanet: toArray(vc.planetSigns) }}
                    title={vc.meta.code}
                    lang={lang}
                  />
                ) : (
                  <SouthIndianChart
                    data={{ lagnaSign: vc.lagnaSign, signsByPlanet: toArray(vc.planetSigns) }}
                    title={vc.meta.code}
                    subtitle={isTe ? vc.meta.nameTe : vc.meta.nameEn}
                    lang={lang}
                    compact
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col items-center">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {vargaChart.meta.code} — {isTe ? vargaChart.meta.nameTe : vargaChart.meta.nameEn}
            </h2>
            <p className="text-xs text-slate-500 mb-3 text-center">
              {isTe ? vargaChart.meta.domainTe : vargaChart.meta.domainEn}
            </p>
            <ChartRenderer
              style={chartStyle === 'western' ? 'south' : chartStyle}
              data={{
                lagnaSign: vargaChart.lagnaSign,
                signsByPlanet: toArray(vargaChart.planetSigns),
                retroFlags: chart.rows.map((r) => r.retro),
              }}
              title={vargaChart.meta.code}
              subtitle={isTe ? vargaChart.meta.nameTe : vargaChart.meta.nameEn}
              lang={lang}
            />
          </div>

          <div className="lg:col-span-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {vargaChart.meta.code}{' '}
                {tx(lang, 'గ్రహ స్థానాలు & వింశోపక బలం', 'Planetary Placements & Vimsopaka', 'ग्रह स्थिति व विंशोपक')}
              </h3>
              <span className="text-xs text-slate-500">
                {tx(lang, 'D1=D9 వర్గోత్తమ:', 'D1=D9 Vargottama:')}{' '}
                {vgt.filter((x) => x.d1Sign === x.d9Sign).length
                  ? vgt
                      .filter((x) => x.d1Sign === x.d9Sign)
                      .map((x) => pShort(x.planet, lang))
                      .join(', ')
                  : tx(lang, 'లేవు', 'None')}
              </span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="px-3 py-2">{tr(lang, 'planet')}</th>
                  <th className="px-3 py-2">{tx(lang, 'D1 రాశి', 'D1 Sign', 'D1 राशि')}</th>
                  <th className="px-3 py-2">
                    {vargaChart.meta.code} {tr(lang, 'sign')}
                  </th>
                  <th className="px-3 py-2">{tx(lang, 'వర్గ భావం', 'Varga House', 'वर्ग भाव')}</th>
                  <th className="px-3 py-2 text-right">{tx(lang, 'షోడశ వింశోపక', 'Shodasha Vimsopaka', 'षोडश विंशोपक')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                {chart.rows.map((row) => {
                  const vim = vimsopaka.find((x) => x.id === row.id);
                  return (
                    <tr key={row.id}>
                      <td className="px-3 py-2 font-medium">{pName(row.id, lang)}</td>
                      <td className="px-3 py-2">{sName(row.sign, lang)}</td>
                      <td className="px-3 py-2 font-medium text-amber-700 dark:text-amber-300">
                        {sName(vargaChart.planetSigns[row.id], lang)}
                      </td>
                      <td className="px-3 py-2 font-mono">{vargaChart.planetHouses[row.id]}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {vim ? `${vim.shodashavarga.toFixed(1)} / 20` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 23-Varga Summary Matrix (D1–D144) */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx(lang, '23-వర్గ పట్టిక (D1–D144)', '23-Varga Matrix (D1–D144)', '23-वर्ग सारणी (D1–D144)')}
          </h3>
        </div>
        <table className="w-full text-[11px] text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="px-2.5 py-2">{tx(lang, 'వర్గం', 'Varga', 'वर्ग')}</th>
              <th className="px-2.5 py-2">{tx(lang, 'లగ్నం', 'Lag', 'लग्न')}</th>
              {SEVEN.map((pid) => (
                <th key={pid} className="px-2 py-2">
                  {pShort(pid, lang)}
                </th>
              ))}
              <th className="px-2 py-2">{pShort(3, lang)}</th>
              <th className="px-2 py-2">{pShort(7, lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredBuiltVargas.map((vc) => (
              <tr
                key={vc.meta.code}
                onClick={() => setSelectedVarga(vc.meta.code)}
                className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  effectiveCode === vc.meta.code ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                }`}
              >
                <td className="px-2.5 py-1.5 font-mono font-semibold">{vc.meta.code}</td>
                <td className="px-2.5 py-1.5">{sShort(vc.lagnaSign, lang)}</td>
                {([...SEVEN, 3, 7] as PlanetId[]).map((pid) => (
                  <td key={pid} className="px-2 py-1.5">
                    {sShort(vc.planetSigns[pid], lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
