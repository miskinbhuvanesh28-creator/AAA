import React, { useEffect, useMemo, useState } from 'react';
import { ChartRenderer } from '../components/ChartsSVG.tsx';
import { useApp } from '../context/AppContext.tsx';
import { NAK_NAMES, pName, pShort, sName, sShort } from '../engine/constants.ts';
import { CITIES } from '../engine/data/coreData.ts';
import { formatDms } from '../engine/ephemeris.ts';
import {
  computeTransitReport,
  computeVarshaphala,
  evaluateRectification,
  findTransitSegments,
} from '../engine/gocharaVarshaRect.ts';
import { tr } from '../engine/i18n.ts';
import { computeFullPanchanga, scanFestivals } from '../engine/panchanga.ts';
import type { CalendarSystem, Language, LifeEvent } from '../engine/types.ts';

function tx(lang: Language, te: string, en: string, hi?: string): string {
  if (lang === 'te') return te;
  if (lang === 'hi' && hi) return hi;
  return en;
}

export const PanchangaPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { activeProfile, calcConfig, updateCalcConfig, lang } = useApp();
  const isTe = lang === 'te';
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [locIdx, setLocIdx] = useState(0);
  const cityTuple = locIdx > 0 ? CITIES[locIdx - 1] : null;

  const calSystem: CalendarSystem =
    subTab === 'amanta' ? 'amanta' : subTab === 'purnimanta' ? 'purnimanta' : calcConfig.calendarSystem;

  const panData = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return computeFullPanchanga(
      {
        y: y || 2026,
        m: m || 1,
        d: d || 1,
        hh: 8,
        mi: 0,
        ss: 0,
        lat: cityTuple ? cityTuple[2] : activeProfile.lat,
        lon: cityTuple ? cityTuple[3] : activeProfile.lon,
        tz: cityTuple ? cityTuple[4] : activeProfile.tz,
        ay: calcConfig.ay,
      },
      { ...calcConfig, calendarSystem: calSystem },
    );
  }, [dateStr, cityTuple, activeProfile, calcConfig, calSystem]);

  const festivals = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const all = scanFestivals(
      {
        y: y || 2026,
        m: m || 1,
        d: d || 1,
        hh: 8,
        mi: 0,
        ss: 0,
        lat: activeProfile.lat,
        lon: activeProfile.lon,
        tz: activeProfile.tz,
        ay: calcConfig.ay,
      },
      90,
      calcConfig,
    );
    if (subTab === 'festivals-ekadashi') return all.filter((f) => f.titleEn.includes('Ekadashi'));
    if (subTab === 'festivals-pradosham') return all.filter((f) => f.titleEn.includes('Pradosham'));
    if (subTab === 'festivals-purnima') return all.filter((f) => f.titleEn.includes('Purnima'));
    if (subTab === 'festivals-amavasya') return all.filter((f) => f.titleEn.includes('Amavasya'));
    if (subTab === 'festivals-sankranti') return all.filter((f) => f.titleEn.includes('Sankranti'));
    return all;
  }, [dateStr, activeProfile, calcConfig, subTab]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5">
            <span className="text-slate-500">{tr(lang, 'date')}</span>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 tabular-nums"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-slate-500">{tx(lang, 'ప్రాంతం', 'Location', 'स्थान')}</span>
            <select
              value={locIdx}
              onChange={(e) => setLocIdx(Number(e.target.value))}
              className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 max-w-[220px]"
            >
              <option value={0}>
                {tx(lang, 'ప్రొఫైల్ స్థలం', 'Profile Location', 'प्रोफ़ाइल स्थान')} ({activeProfile.place})
              </option>
              {CITIES.slice(0, 35).map((c, idx) => (
                <option key={`${c[0]}-${idx}`} value={idx + 1}>
                  {c[0]} ({c[1]})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950">
          {(
            [
              ['amanta', tx(lang, 'అమాంతం (తెలుగు)', 'Amanta', 'अमांत')],
              ['purnimanta', tx(lang, 'పూర్ణిమాంతం', 'Purnimanta', 'पूर्णिमांत')],
            ] as const
          ).map(([cs, label]) => (
            <button
              key={cs}
              type="button"
              onClick={() => updateCalcConfig({ calendarSystem: cs })}
              className={`px-3 py-1 rounded font-medium ${
                calSystem === cs ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {panData.isAdhikaMasa && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200">
          {isTe ? panData.adhikaMasaNoteTe : panData.adhikaMasaNoteEn}
        </div>
      )}

      {/* 5 Limbs + Sun/Moon/Inauspicious/Auspicious Timings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx(lang, 'పంచాంగ పంచాంగాలు (5 అంగాలు)', 'Panchanga Five Limbs', 'पंचांग के पांच अंग')}
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <div className="py-1.5 flex justify-between">
              <span className="text-slate-500">{tx(lang, 'సంవత్సరం', 'Samvatsara')}</span>
              <span className="font-medium">{isTe ? panData.samvatsaraTe : panData.samvatsara}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-slate-500">
                {tx(lang, 'మాసం', 'Masa')} ({calSystem === 'amanta' ? tx(lang, 'అమాంతం', 'Amanta') : tx(lang, 'పూర్ణిమాంతం', 'Purnimanta')})
              </span>
              <span className="font-medium">{isTe ? panData.masaTe : panData.masaEn}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-slate-500">{tx(lang, 'ఆయనం / ఋతువు', 'Ayana / Ritu')}</span>
              <span className="font-medium">
                {isTe ? `${panData.ayana.te} · ${panData.ritu.te}` : `${panData.ayana.en} · ${panData.ritu.en}`}
              </span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-slate-500">{tx(lang, 'వారం', 'Vara')}</span>
              <span className="font-medium">{isTe ? panData.varaTe : panData.varaEn}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-slate-500">
                {tx(lang, 'తిథి', 'Tithi')} ({tx(lang, 'వరకు', 'ends')} {panData.tithiEnd})
              </span>
              <span className="font-medium">
                {isTe
                  ? `${panData.chart.pan.paksha} ${panData.chart.pan.tithi}`
                  : `${panData.chart.pan.pakshaEn} ${panData.chart.pan.tithiEn}`}
              </span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-slate-500">
                {tr(lang, 'nakshatra')} ({tx(lang, 'వరకు', 'ends')} {panData.nakshatraEnd})
              </span>
              <span className="font-medium">{NAK_NAMES[lang]?.[panData.chart.pan.nk]}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-slate-500">{tx(lang, 'నిత్య యోగం', 'Yoga')}</span>
              <span className="font-medium">{isTe ? panData.chart.pan.yoga : panData.chart.pan.yogaEn}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-slate-500">{tx(lang, 'కరణం', 'Karana')}</span>
              <span className="font-medium">{isTe ? panData.chart.pan.karana : panData.chart.pan.karanaEn}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx(lang, 'సూర్య-చంద్ర ఉదయ అస్తమయ & ముహూర్తాలు', 'Sun, Moon & Muhurta Timings', 'सूर्य, चंद्र व मुहूर्त समय')}
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums font-mono">
            <div className="py-1.5 flex justify-between">
              <span className="font-sans text-slate-500">{tx(lang, 'సూర్యోదయం / సూర్యాస్తమయం', 'Sunrise / Sunset')}</span>
              <span>{panData.sunrise} / {panData.sunset}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans text-slate-500">{tx(lang, 'చంద్రోదయం / చంద్రాస్తమయం', 'Moonrise / Moonset')}</span>
              <span>{panData.moonrise} / {panData.moonset}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans text-slate-500">{tx(lang, 'బ్రహ్మ ముహూర్తం', 'Brahma Muhurta')}</span>
              <span className="text-emerald-700 dark:text-emerald-400">{panData.brahmaMuhurta}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans text-slate-500">{tx(lang, 'అభిజిత్ ముహూర్తం', 'Abhijit Muhurta')}</span>
              <span className="text-emerald-700 dark:text-emerald-400">{panData.abhijitMuhurta}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans text-slate-500">{tx(lang, 'రాహు కాలం', 'Rahu Kalam')}</span>
              <span className="text-red-600 dark:text-red-400">{panData.rahuKalam}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans text-slate-500">{tx(lang, 'యమగండం', 'Yamagandam')}</span>
              <span className="text-amber-700 dark:text-amber-400">{panData.yamagandam}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans text-slate-500">{tx(lang, 'గులిక కాలం', 'Gulika Kalam')}</span>
              <span>{panData.gulikaKalam}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans text-slate-500">{tx(lang, 'వర్జ్యం', 'Varjyam')}</span>
              <span className="text-red-600 dark:text-red-400">{panData.varjyam}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans text-slate-500">{tx(lang, 'దుర్ముహూర్తం', 'Durmuhurta')}</span>
              <span>{panData.durMuhurtas.join(', ') || '—'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tx(lang, 'పగటి చోఘడియా (శుభాశుభ వేళలు)', 'Daytime Choghadiya', 'दिन का चौघड़िया')}
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
            {panData.choghadiyaDay.map((ch, idx) => (
              <div key={idx} className="py-1.5 flex items-center justify-between">
                <span className={ch.good ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}>
                  {isTe ? ch.nameTe : ch.name} ({ch.good ? tx(lang, 'శుభం', 'Shubh') : tx(lang, 'అశుభం', 'Ashubh')})
                </span>
                <span className="font-mono text-[11px]">
                  {ch.start} – {ch.end}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 24 Horas & 90-Day Festival Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto max-h-80">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
            <h3 className="text-sm font-semibold">{tx(lang, '24 గ్రహ హోరలు', '24 Planetary Horas', '24 ग्रह होरा')}</h3>
          </div>
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {panData.horas.map((h) => (
                <tr key={h.index}>
                  <td className="px-3 py-1.5 font-mono">
                    #{h.index} ({h.period === 'Day' ? tx(lang, 'పగలు', 'Day') : tx(lang, 'రాత్రి', 'Night')})
                  </td>
                  <td className="px-3 py-1.5 font-medium">{pName(h.lord, lang)}</td>
                  <td className="px-3 py-1.5 font-mono text-right">
                    {h.start} – {h.end}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto max-h-80">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
            <h3 className="text-sm font-semibold">
              {tx(
                lang,
                'రాబోయే పండుగలు, ఏకాదశి, ప్రదోషం & సంక్రాంతి (90 రోజులు)',
                'Upcoming Festivals, Ekadashi, Pradosham & Sankranti (90d)',
                'आगामी पर्व, एकादशी, प्रदोष व संक्रांति (90 दिन)',
              )}
            </h3>
          </div>
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {festivals.map((f, idx) => (
                <tr key={`${f.date}-${idx}`}>
                  <td className="px-3 py-1.5 font-mono text-slate-500">{f.date}</td>
                  <td className="px-3 py-1.5 font-medium">{isTe ? f.titleTe : f.titleEn}</td>
                  <td className="px-3 py-1.5 text-slate-500">{isTe ? f.tithiTe : f.tithi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const GocharaPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, lang, calcConfig } = useApp();
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().slice(0, 10));
  const report = useMemo(() => computeTransitReport(chart, targetDate), [chart, targetDate]);
  const jupSegments = useMemo(
    () => findTransitSegments(4, report.targetJd, report.targetJd + 365.25 * 5, calcConfig.ay, calcConfig.sidereal, calcConfig.nodeType === 'true'),
    [report.targetJd, calcConfig],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          {tx(lang, 'గోచార తేదీ:', 'Transit Snapshot for', 'गोचर तिथि:')}{' '}
          <span className="font-semibold font-mono">{report.targetDate}</span> ·{' '}
          {tx(lang, 'ద్వంద్వ గోచార భావాలు:', 'Double Transit Houses:')}{' '}
          <span className="font-semibold font-mono text-amber-700 dark:text-amber-300">
            {report.doubleTransitHouses.map((h) => `H${h}`).join(', ') || tx(lang, 'లేవు', 'None')}
          </span>{' '}
          ({subTab})
        </div>
        <label className="flex items-center gap-2">
          <span className="text-slate-500">{tx(lang, 'గోచార తేదీ', 'Transit Date')}</span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 tabular-nums"
          />
        </label>
      </div>

      {/* Transit Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
            <tr>
              <th className="px-3 py-2">{tr(lang, 'planet')}</th>
              <th className="px-3 py-2">{tx(lang, 'గోచార రాశి & డిగ్రీ', 'Transit Sign & Degree')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'లగ్నం నుండి', 'From Lagna')}</th>
              <th className="px-3 py-2 text-right">{tx(lang, 'చంద్ర రాశి నుండి (వేధ/గోచారం)', 'From Moon (Vedha/Gochara)')}</th>
              <th className="px-3 py-2 text-right">BAV / SAV</th>
              <th className="px-3 py-2">{tx(lang, 'అంచనా', 'Assessment')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
            {report.rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-semibold">
                  {pName(r.id, lang)} {r.retro ? `(${tr(lang, 'retrograde')})` : ''}
                </td>
                <td className="px-3 py-2 font-mono">
                  {sName(r.sign, lang)} {formatDms(r.lon % 30)}
                </td>
                <td className="px-3 py-2 text-right font-mono">H{r.fromLagna}</td>
                <td className="px-3 py-2 text-right font-mono">H{r.fromMoon}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {r.bavBindus !== null ? `${r.bavBindus}/8` : '—'} · SAV {r.savBindus}
                </td>
                <td
                  className={`px-3 py-2 font-medium ${
                    r.favorable ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {r.favorable ? tx(lang, 'శుభ గోచారం', 'Favorable Transit') : tx(lang, 'మిశ్రమం / జాగ్రత్త', 'Challenging / Neutral')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 7-Day Forecast & Lifetime Shani Sade Sati */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="text-sm font-semibold">
            {tx(lang, '7 రోజుల దైనందిన చంద్ర గోచార బలం', '7-Day Daily Transit Momentum', '7 दिवसीय दैनिक गोचर')}
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs tabular-nums">
            {report.forecast7d.map((f) => (
              <div key={f.date} className="py-2 flex items-center justify-between gap-4">
                <span className="font-mono">{f.date}</span>
                <span className="text-slate-500">
                  {tx(lang, `జన్మ చంద్రుని నుండి ${f.moonHouseFromNatal}వ స్థానం`, `Moon in H${f.moonHouseFromNatal} from natal Moon`)}
                </span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">{f.scorePct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto max-h-80">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
            <h3 className="text-sm font-semibold">
              {tx(lang, 'ఏలినాటి శని, అష్టమ & అర్ధాష్టమ శని కాలాలు', 'Sade Sati, Ashtama & Ardhashtama Shani Windows', 'साढ़ेसाती, अष्टम व अर्धाष्टम शनि')}
            </h3>
          </div>
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {report.shaniPhases.map((sp, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 font-medium">{sp.type}</td>
                  <td className="px-3 py-2">{sName(sp.sign, lang)}</td>
                  <td className="px-3 py-2 font-mono text-right">
                    {sp.from} → {sp.to}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs">
        <div className="font-semibold mb-2">
          {tx(lang, 'బృహస్పతి (గురు) రాశి పరివర్తన కాలక్రమం (రాబోయే 5 ఏళ్లు)', 'Jupiter Sign Ingression Timeline (Next 5 Years)', 'बृहस्पति राशि गोचर (अगले 5 वर्ष)')}
        </div>
        <div className="flex flex-wrap gap-3 tabular-nums">
          {jupSegments.map((js, i) => (
            <div key={i} className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800">
              <span className="font-semibold">{sName(js.sign, lang)}</span>{' '}
              <span className="font-mono text-slate-500">
                {new Date((js.startJd - 2440587.5) * 864e5).toISOString().slice(0, 10)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const VarshaphalaPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { chart, chartStyle, lang } = useApp();
  const [targetYear, setTargetYear] = useState(() => new Date().getFullYear());
  const varsha = useMemo(() => computeVarshaphala(chart, targetYear), [chart, targetYear]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          {tx(lang, 'వార్షిక సూర్య పునరాగమన సంవత్సరం', 'Solar Return Year', 'वर्षफल वर्ष')}{' '}
          <span className="font-semibold font-mono">{varsha.targetYear}</span> ({tx(lang, 'వయసు', 'Age')} {varsha.age}) ·{' '}
          {tx(lang, 'ఖచ్చిత సమయం:', 'Exact Return:')} <span className="font-mono">{varsha.returnTimeLocal}</span> · {subTab}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-slate-500">{tx(lang, 'లక్ష్య సంవత్సరం', 'Target Year')}</span>
          <input
            type="number"
            min={chart.inp.y}
            max={chart.inp.y + 110}
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value) || new Date().getFullYear())}
            className="w-24 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 font-mono"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col items-center">
          <h2 className="text-sm font-semibold mb-3">
            {tx(lang, 'వర్ష కుండలి', 'Varsha Kundali', 'वर्ष कुंडली')} ({varsha.targetYear})
          </h2>
          <ChartRenderer
            style={chartStyle === 'western' ? 'south' : chartStyle}
            data={{
              lagnaSign: varsha.returnChart.lagS,
              signsByPlanet: varsha.returnChart.s,
              retroFlags: varsha.returnChart.rows.map((r) => r.retro),
            }}
            title={`${tx(lang, 'వర్ష', 'Varsha')} ${varsha.targetYear}`}
            subtitle={`${tx(lang, 'ముంథా:', 'Muntha:')} ${sName(varsha.munthaSign, lang)}`}
            lang={lang}
          />
        </div>

        <div className="lg:col-span-7 space-y-5 text-xs">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-slate-400">{tx(lang, 'వర్ష లగ్నం', 'Varsha Lagna')}</div>
              <div className="font-semibold mt-0.5">{sName(varsha.returnChart.lagS, lang)}</div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'వర్షేశుడు (సంవత్సరాధిపతి)', 'Varshesha (Year Lord)')}</div>
              <div className="font-semibold text-amber-700 dark:text-amber-300 mt-0.5">{pName(varsha.varshesha, lang)}</div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'ముంథా రాశి & భావం', 'Muntha Sign & House')}</div>
              <div className="font-semibold mt-0.5">
                {sName(varsha.munthaSign, lang)} (H{varsha.munthaHouse})
              </div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'ముంథా అధిపతి', 'Muntha Lord')}</div>
              <div className="font-semibold mt-0.5">{pName(varsha.munthaLord, lang)}</div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'పునరాగమన సమయం', 'Return Timing')}</div>
              <div className="font-semibold mt-0.5">
                {varsha.isDayReturn ? tx(lang, 'పగటి పునరాగమనం', 'Day Return') : tx(lang, 'రాత్రి పునరాగమనం', 'Night Return')}
              </div>
            </div>
            <div>
              <div className="text-slate-400">{tx(lang, 'వారాధిపతి', 'Vara Lord')}</div>
              <div className="font-semibold mt-0.5">{pName(varsha.varaLord, lang)}</div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-sm font-semibold mb-2">
              {tx(lang, 'వార్షిక సహములు & తాజిక యోగాలు', 'Annual Sahams & Tajika Yogas', 'वार्षिक सहम व ताजिक योग')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {varsha.sahams.map((sh) => (
                <div key={sh.name} className="p-2 rounded border border-slate-200 dark:border-slate-800 flex justify-between">
                  <span>{sh.name}</span>
                  <span className="font-mono font-medium">
                    {sName(sh.sign, lang)} {formatDms(sh.lon % 30)}
                  </span>
                </div>
              ))}
            </div>
            {varsha.tajikaYogas.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                {varsha.tajikaYogas.slice(0, 6).map((ty, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {pShort(ty.p1, lang)} – {pShort(ty.p2, lang)}: <span className="font-medium">{ty.yoga}</span>
                    </span>
                    <span className="font-mono text-slate-500">
                      {tx(lang, 'వ్యత్యాసం', 'Orb')} {ty.orb.toFixed(1)}°
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-sm font-semibold mb-2">
              {tx(lang, 'వార్షిక ముద్దా దశ', 'Annual Mudda Dasha', 'वार्षिक मुद्दा दशा')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 tabular-nums">
              {varsha.muddaDasha.map((m, idx) => (
                <div key={idx} className="p-2 rounded border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold">
                    {pName(m.lord, lang)} ({m.days.toFixed(1)}
                    {tx(lang, 'రో.', 'd')})
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {m.start} → {m.end}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RectificationPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { activeProfile, chart, lang } = useApp();
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LifeEvent['category']>('marriage');
  const [eventDate, setEventDate] = useState('2018-11-24');
  const [windowMin, setWindowMin] = useState(20);
  const [stepMin, setStepMin] = useState(2);

  const loadEvents = () => {
    void fetch(`/api/life-events/${activeProfile.id}`)
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d: { events?: Record<string, unknown>[] }) => {
        const mapped: LifeEvent[] = (d.events || []).map((e) => ({
          id: String(e.id),
          profileId: String(e.profile_id),
          title: String(e.title),
          category: e.category as LifeEvent['category'],
          eventDate: String(e.event_date),
          notes: String(e.notes || ''),
        }));
        setEvents(mapped);
      });
  };

  useEffect(() => {
    loadEvents();
  }, [activeProfile.id]);

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch('/api/life-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: activeProfile.id, title, category, eventDate }),
    });
    setTitle('');
    loadEvents();
  };

  const removeEvent = async (id: string) => {
    await fetch(`/api/life-events/${id}`, { method: 'DELETE' });
    loadEvents();
  };

  const result = useMemo(
    () => evaluateRectification(chart, events, windowMin, stepMin),
    [chart, events, windowMin, stepMin],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          {tx(lang, 'ఖచ్చితత్వ విశ్వాసం:', 'Confidence:')}{' '}
          <span className="font-semibold text-amber-700 dark:text-amber-300">{result.confidence}</span> ·{' '}
          {tx(lang, '±10ని. లగ్న స్థిరత్వం:', '±10m Lagna Stable:')}{' '}
          <span className="font-semibold">
            {result.d1StableWithin10m ? tx(lang, 'స్థిరం', 'Yes') : tx(lang, 'రాశి మారుతుంది', 'Sign Changes')}
          </span>{' '}
          · D9:{' '}
          <span className="font-semibold">
            {result.d9StableWithin10m ? tx(lang, 'స్థిరం', 'Yes') : tx(lang, 'నవాంశ మారుతుంది', 'Navamsha Changes')}
          </span>{' '}
          ({subTab})
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5">
            <span>{tx(lang, '±నిమిషాలు', '±Window (m)')}</span>
            <input
              type="number"
              min={5}
              max={60}
              value={windowMin}
              onChange={(e) => setWindowMin(Number(e.target.value) || 20)}
              className="w-16 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 font-mono"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span>{tx(lang, 'అంతరం (ని.)', 'Step (m)')}</span>
            <input
              type="number"
              min={1}
              max={10}
              value={stepMin}
              onChange={(e) => setStepMin(Math.max(1, Number(e.target.value) || 2))}
              className="w-16 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 font-mono"
            />
          </label>
        </div>
      </div>

      {/* Life Events Form & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 text-xs">
          <h2 className="text-sm font-semibold">
            {tx(lang, 'నమోదు చేసిన జీవిత సంఘటనలు', 'Anchored Life Events', 'प्रमुख जीवन घटनाएं')} ({events.length})
          </h2>
          <form onSubmit={addEvent} className="space-y-2.5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tx(
                lang,
                'సంఘటన పేరు (ఉదా: మొదటి ఉద్యోగం, వివాహం, గృహప్రవేశం)',
                'Event title (e.g. First Job, Wedding, Home Purchase)',
                'घटना का नाम (उदा. विवाह, पहली नौकरी)',
              )}
              className="w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LifeEvent['category'])}
                className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5"
              >
                <option value="marriage">{tx(lang, 'వివాహం', 'Marriage')}</option>
                <option value="career">{tx(lang, 'వృత్తి / ఉద్యోగం', 'Career')}</option>
                <option value="education">{tx(lang, 'విద్య', 'Education')}</option>
                <option value="childbirth">{tx(lang, 'సంతానం', 'Childbirth')}</option>
                <option value="property">{tx(lang, 'గృహం / ఆస్తి', 'Property')}</option>
                <option value="travel">{tx(lang, 'విదేశ ప్రయాణం', 'Foreign Travel')}</option>
                <option value="health">{tx(lang, 'ఆరోగ్యం', 'Health')}</option>
              </select>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 tabular-nums"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded bg-amber-600 text-white font-medium hover:bg-amber-700"
            >
              {tx(lang, 'జీవిత సంఘటన జోడించు', 'Add Anchor Event', 'घटना जोड़ें')}
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((ev) => (
              <div key={ev.id} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{ev.title}</div>
                  <div className="text-slate-500 font-mono">
                    {ev.eventDate} · {ev.category}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void removeEvent(ev.id)}
                  className="text-red-600 hover:underline"
                >
                  {tr(lang, 'delete')}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold">
              {tx(
                lang,
                'సంభావ్య జన్మ సమయాల ర్యాంకింగ్ (దశ + KP సూచికల స్కోరు)',
                'Ranked Candidate Birth Times (Dasha + KP Significator Score)',
                'संभावित जन्म समय रैंकिंग',
              )}
            </h3>
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">{tx(lang, 'సంభావ్య సమయం', 'Candidate Time')}</th>
                <th className="px-3 py-2">{tx(lang, 'వ్యత్యాసం', 'Offset')}</th>
                <th className="px-3 py-2">{tx(lang, 'D1 లగ్నం', 'D1 Lagna')}</th>
                <th className="px-3 py-2">D9 / D10</th>
                <th className="px-3 py-2 text-right">{tr(lang, 'score')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
              {result.candidates.slice(0, 12).map((c, idx) => (
                <tr key={c.offsetMin} className={idx === 0 ? 'bg-amber-50/50 dark:bg-amber-950/20 font-medium' : ''}>
                  <td className="px-3 py-2 font-mono">{c.timeStr}</td>
                  <td className="px-3 py-2 font-mono">{c.offsetMin >= 0 ? `+${c.offsetMin}m` : `${c.offsetMin}m`}</td>
                  <td className="px-3 py-2">
                    {sName(c.lagnaSign, lang)} {c.lagnaDeg.toFixed(2)}°
                  </td>
                  <td className="px-3 py-2">
                    {sShort(c.d9LagnaSign, lang)} / {sShort(c.d10LagnaSign, lang)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-amber-700 dark:text-amber-300">
                    {c.score}
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
