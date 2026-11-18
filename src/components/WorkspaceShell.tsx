import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, Circle, Edit3, FileText, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { NAK_NAMES, PLANET_SYMBOL_LEGEND, sName } from '../engine/constants.ts';
import { AYN } from '../engine/data/coreData.ts';
import { formatDms } from '../engine/ephemeris.ts';
import { tr } from '../engine/i18n.ts';
import type { ChartStyle, HouseSystem, NodeType } from '../engine/types.ts';
import { navLabel } from '../navigation/navConfig.ts';
import { LocationSearchInput } from './LocationSearchInput.tsx';

const SYMBOL_PAGES = new Set([
  'horoscope',
  'parashari',
  'relationships',
  'vargas',
  'strength',
  'analysis',
  'insights',
  'gochara',
  'varshaphala',
  'western',
  'dashboard',
]);

export const WorkspaceShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    lang,
    activeCat,
    activeSub,
    navigate,
    activeProfile,
    updateActiveProfileLive,
    workflowProgress,
    toggleStepStatus,
    chart,
    calcConfig,
    updateCalcConfig,
    chartStyle,
    setChartStyle,
    openProfileModal,
  } = useApp();

  const [showCalcBar, setShowCalcBar] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);

  const dobDate = `${activeProfile.y}-${String(activeProfile.m).padStart(2, '0')}-${String(activeProfile.d).padStart(2, '0')}`;
  const dobTime = `${String(activeProfile.hh).padStart(2, '0')}:${String(activeProfile.mi).padStart(2, '0')}:${String(activeProfile.ss ?? 0).padStart(2, '0')}`;
  const dobStr = `${dobDate} ${String(activeProfile.hh).padStart(2, '0')}:${String(activeProfile.mi).padStart(2, '0')}`;
  const ayName = AYN[calcConfig.ay] || 'Lahiri';
  const isWorkflowStep = activeCat.group === 'workflow';
  const isStepDone = isWorkflowStep && workflowProgress[activeCat.code] === 'completed';

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Contextual Sub-header / Breadcrumbs / Active Profile Metadata */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-4 lg:px-6 py-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => navigate('dashboard', 'overview')}
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {lang === 'te' ? 'హోమ్' : lang === 'hi' ? 'होम' : 'Home'}
              </button>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <button
                type="button"
                onClick={() => navigate(activeCat.catSlug, activeCat.defaultSubSlug)}
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {activeCat.code}. {navLabel(activeCat, lang)}
              </button>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                {navLabel(activeSub, lang)}
              </span>
            </div>

            <h1 className="mt-1 text-lg lg:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {navLabel(activeSub, lang)}
            </h1>

            {/* Zero-Pill Clean Metadata Strip */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span className="font-medium text-slate-700 dark:text-slate-300">{activeProfile.name}</span>
              <span aria-hidden="true">·</span>
              <span>{dobStr}</span>
              <span aria-hidden="true">·</span>
              <span>{activeProfile.place}</span>
              <span aria-hidden="true">·</span>
              <span>
                {tr(lang, 'lagna')}: {sName(chart.lagS, lang)} {formatDms(chart.lag % 30)}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {lang === 'te' ? 'చంద్రుడు' : lang === 'hi' ? 'चंद्र' : 'Moon'}: {sName(chart.s[1], lang)} · {NAK_NAMES[lang]?.[chart.pan.nk] || NAK_NAMES.en[chart.pan.nk]} {lang === 'te' ? 'పా' : 'P'}{chart.rows[1].pada}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {ayName} ({chart.ayVal.toFixed(2)}°)
              </span>
            </div>

            {SYMBOL_PAGES.has(activeCat.pageKey) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {lang === 'te' ? 'సంకేతాలు:' : 'Symbols:'}
                </span>
                {PLANET_SYMBOL_LEGEND.map((sym) => (
                  <span key={sym.key} title={lang === 'te' ? sym.meaningTe : sym.meaningEn}>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">{sym.symbol}</span>{' '}
                    {lang === 'te' ? sym.te : sym.en}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isWorkflowStep && (
              <button
                type="button"
                onClick={() => void toggleStepStatus(activeCat.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${
                  isStepDone
                    ? 'border-emerald-500/60 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {isStepDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                <span>
                  {isStepDone
                    ? lang === 'te' ? 'పూర్తయింది' : 'Completed'
                    : lang === 'te' ? 'పూర్తయినట్లు గుర్తుపెట్టు' : 'Mark Completed'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowQuickEdit((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${
                showQuickEdit
                  ? 'border-amber-600 text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{lang === 'te' ? 'లైవ్ సవరణ' : 'Live Birth Edit'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCalcBar((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${
                showCalcBar
                  ? 'border-amber-600 text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{lang === 'te' ? 'గణిత సెట్టింగ్స్' : lang === 'hi' ? 'गणना विकल्प' : 'Calc Options'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('reports', 'complete-horoscope')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 whitespace-nowrap shrink-0"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{tr(lang, 'generateReport')}</span>
            </button>
          </div>
        </div>

        {/* Inline Live Birth Data Editor Strip — propagates immediately to all 21+ modules with zero re-prompt */}
        {showQuickEdit && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                {lang === 'te'
                  ? 'ఇక్కడ మార్చిన వివరాలు తక్షణమే అన్ని 21 మాడ్యూల్స్, చార్టులు & నివేదికలకు వర్తిస్తాయి (సేవ్ ఆటోమేటిక్).'
                  : 'Changes made here propagate live across all 21 modules, charts, dashas & reports immediately (auto-saved).'}
              </span>
              <button
                type="button"
                onClick={() => openProfileModal('edit', activeProfile)}
                className="text-[11px] text-slate-500 hover:text-amber-700 dark:hover:text-amber-300 underline"
              >
                {lang === 'te' ? 'పూర్తి ప్రొఫైల్ ఫారమ్ తెరువు' : 'Open Full Profile Dialog'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 items-end">
              <label className="block">
                <span className="text-[11px] text-slate-500">{lang === 'te' ? 'పేరు' : 'Name'}</span>
                <input
                  type="text"
                  value={activeProfile.name}
                  onChange={(e) => updateActiveProfileLive({ name: e.target.value })}
                  className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                />
              </label>

              <label className="block">
                <span className="text-[11px] text-slate-500">{tr(lang, 'birthDate')}</span>
                <input
                  type="date"
                  value={dobDate}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    if (y && m && d) updateActiveProfileLive({ y, m, d });
                  }}
                  className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs tabular-nums"
                />
              </label>

              <label className="block">
                <span className="text-[11px] text-slate-500">{tr(lang, 'birthTime')}</span>
                <input
                  type="time"
                  step="1"
                  disabled={activeProfile.birthTimeKnown === false}
                  value={dobTime}
                  onChange={(e) => {
                    const [hh, mi, ss = 0] = e.target.value.split(':').map(Number);
                    if (!Number.isNaN(hh) && !Number.isNaN(mi)) {
                      updateActiveProfileLive({ hh, mi, ss });
                    }
                  }}
                  className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs tabular-nums disabled:opacity-50"
                />
              </label>

              <div className="lg:col-span-2">
                <span className="block text-[11px] text-slate-500 mb-0.5">
                  {tr(lang, 'birthPlace')} (Nominatim)
                </span>
                <LocationSearchInput
                  compact
                  lang={lang}
                  value={activeProfile.place}
                  onSelect={(loc) =>
                    updateActiveProfileLive({
                      place: loc.place,
                      lat: loc.lat,
                      lon: loc.lon,
                      tz: loc.tz,
                      timezoneId: loc.timezoneId,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <label className="block">
                  <span className="text-[11px] text-slate-500">Lat</span>
                  <input
                    type="number"
                    step="0.001"
                    value={activeProfile.lat}
                    onChange={(e) => updateActiveProfileLive({ lat: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-1 text-xs tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500">Lon</span>
                  <input
                    type="number"
                    step="0.001"
                    value={activeProfile.lon}
                    onChange={(e) => updateActiveProfileLive({ lon: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-1 text-xs tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-500">TZ</span>
                  <input
                    type="number"
                    step="0.25"
                    value={activeProfile.tz}
                    onChange={(e) => updateActiveProfileLive({ tz: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-1 text-xs tabular-nums"
                  />
                </label>
              </div>

              <label className="flex items-center gap-1.5 pb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeProfile.birthTimeKnown !== false}
                  onChange={(e) =>
                    updateActiveProfileLive({
                      birthTimeKnown: e.target.checked,
                      ...(e.target.checked ? {} : { hh: 12, mi: 0, ss: 0 }),
                    })
                  }
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  {lang === 'te' ? 'సమయం తెలుసు' : 'Time Known'}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Collapsible Live Calculation Settings Strip */}
        {showCalcBar && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <label className="block">
              <span className="text-[11px] text-slate-500">{tr(lang, 'ayanamsha')}</span>
              <select
                value={calcConfig.ay}
                onChange={(e) => updateCalcConfig({ ay: Number(e.target.value) })}
                className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              >
                {AYN.map((name, id) =>
                  name ? (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ) : null,
                )}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] text-slate-500">{tr(lang, 'houseSystem')}</span>
              <select
                value={calcConfig.houseSystem}
                onChange={(e) => updateCalcConfig({ houseSystem: e.target.value as HouseSystem })}
                className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              >
                <option value="placidus">{lang === 'te' ? 'ప్లాసిడస్ (KP)' : 'Placidus (KP)'}</option>
                <option value="whole">{lang === 'te' ? 'సంపూర్ణ రాశి' : 'Whole Sign'}</option>
                <option value="equal">{lang === 'te' ? 'సమ భావ' : 'Equal House'}</option>
                <option value="sripati">{lang === 'te' ? 'శ్రీపతి' : 'Sripati (Porphyry)'}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] text-slate-500">{tr(lang, 'nodeType')}</span>
              <select
                value={calcConfig.nodeType}
                onChange={(e) => updateCalcConfig({ nodeType: e.target.value as NodeType })}
                className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              >
                <option value="mean">{lang === 'te' ? 'సగటు (Mean)' : 'Mean Node'}</option>
                <option value="true">{lang === 'te' ? 'స్పష్ట (True)' : 'True Node'}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] text-slate-500">{lang === 'te' ? 'రాశి చక్రం' : 'Zodiac'}</span>
              <select
                value={calcConfig.sidereal ? 'sidereal' : 'tropical'}
                onChange={(e) => updateCalcConfig({ sidereal: e.target.value === 'sidereal' })}
                className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              >
                <option value="sidereal">{tr(lang, 'sidereal')}</option>
                <option value="tropical">{tr(lang, 'tropical')}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] text-slate-500">{tr(lang, 'chartStyle')}</span>
              <select
                value={chartStyle}
                onChange={(e) => setChartStyle(e.target.value as ChartStyle)}
                className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              >
                <option value="south">{tr(lang, 'southIndian')}</option>
                <option value="north">{tr(lang, 'northIndian')}</option>
                <option value="western">{tr(lang, 'westernWheel')}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] text-slate-500">{lang === 'te' ? 'KP / కారక సంఖ్య' : 'KP / Karaka'}</span>
              <select
                value={`${calcConfig.kpMode}-${calcConfig.karakaMode}`}
                onChange={(e) => {
                  const [kpMode, karakaMode] = e.target.value.split('-') as ['new' | 'old', '7' | '8'];
                  updateCalcConfig({ kpMode, karakaMode });
                }}
                className="mt-0.5 w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              >
                <option value="new-7">{lang === 'te' ? 'KP న్యూ · 7 కారకులు' : 'KP New · 7 Karakas'}</option>
                <option value="old-7">{lang === 'te' ? 'KP ఓల్డ్ · 7 కారకులు' : 'KP Old · 7 Karakas'}</option>
                <option value="new-8">{lang === 'te' ? 'KP న్యూ · 8 కారకులు' : 'KP New · 8 Karakas'}</option>
                <option value="old-8">{lang === 'te' ? 'KP ఓల్డ్ · 8 కారకులు' : 'KP Old · 8 Karakas'}</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto">{children}</main>
    </div>
  );
};
