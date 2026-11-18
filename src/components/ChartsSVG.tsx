import React from 'react';
import { PLANET_SYMBOL_LEGEND, PLANETS, pName, pShort, planetSymbols, sName, sShort } from '../engine/constants.ts';
import type { ChartStyle, DignityKey, Language, OuterPlanetRow, PlanetId, PlanetRow } from '../engine/types.ts';

export interface ChartSignData {
  lagnaSign: number;
  signsByPlanet: number[]; // length 9 (0..8 -> sign 0..11)
  retroFlags?: boolean[];
  combustFlags?: boolean[];
  digKeys?: DignityKey[];
  vgtFlags?: boolean[];
  degrees?: number[];
}

function buildPlanetTitle(
  pid: PlanetId,
  lang: Language,
  opts: { digKey?: DignityKey; vgt?: boolean; retro?: boolean; combust?: boolean; deg?: number },
): string {
  const parts = [pName(pid, lang)];
  if (opts.deg !== undefined) parts.push(`${(opts.deg % 30).toFixed(1)}°`);
  const syms = planetSymbols(opts);
  if (syms) {
    const descs = PLANET_SYMBOL_LEGEND.filter((m) => syms.includes(m.symbol)).map((m) =>
      lang === 'te' ? `${m.symbol} ${m.te}` : `${m.symbol} ${m.en}`,
    );
    if (descs.length) parts.push(`(${descs.join(', ')})`);
  }
  return parts.join(' ');
}

// South Indian 4x4 grid sign layout: index 0..11 mapped to (row, col)
const SOUTH_POS: Record<number, { row: number; col: number }> = {
  11: { row: 0, col: 0 }, // Pisces
  0: { row: 0, col: 1 },  // Aries
  1: { row: 0, col: 2 },  // Taurus
  2: { row: 0, col: 3 },  // Gemini
  3: { row: 1, col: 3 },  // Cancer
  4: { row: 2, col: 3 },  // Leo
  5: { row: 3, col: 3 },  // Virgo
  6: { row: 3, col: 2 },  // Libra
  7: { row: 3, col: 1 },  // Scorpio
  8: { row: 3, col: 0 },  // Sagittarius
  9: { row: 2, col: 0 },  // Capricorn
  10: { row: 1, col: 0 }, // Aquarius
};

function planetsBySign(signsByPlanet: number[]): PlanetId[][] {
  const arr: PlanetId[][] = Array.from({ length: 12 }, () => []);
  signsByPlanet.forEach((s, idx) => {
    const sign = ((s % 12) + 12) % 12;
    arr[sign].push(idx as PlanetId);
  });
  return arr;
}

export const SouthIndianChart: React.FC<{
  data: ChartSignData;
  title?: string;
  subtitle?: string;
  lang: Language;
  compact?: boolean;
  onSelectPlanet?: (id: PlanetId) => void;
  onSelectHouse?: (houseNum: number, signIdx: number) => void;
}> = ({ data, title = 'D1 రాశి', subtitle, lang, compact = false, onSelectPlanet, onSelectHouse }) => {
  const bySign = planetsBySign(data.signsByPlanet);
  const w = 360;
  const cell = w / 4;

  return (
    <svg
      viewBox={`0 0 ${w} ${w}`}
      className="w-full max-w-[380px] select-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
      role="img"
      aria-label={title}
    >
      {/* Center Title Box */}
      <rect
        x={cell}
        y={cell}
        width={cell * 2}
        height={cell * 2}
        className="fill-slate-50/70 dark:fill-slate-800/40 stroke-slate-300 dark:stroke-slate-700"
        strokeWidth={1}
      />
      <text
        x={w / 2}
        y={w / 2 - (subtitle ? 8 : 0)}
        textAnchor="middle"
        className="fill-slate-900 dark:fill-slate-100 font-semibold"
        fontSize={compact ? 12 : 14}
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={w / 2}
          y={w / 2 + 12}
          textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-400"
          fontSize={10}
        >
          {subtitle}
        </text>
      )}

      {Array.from({ length: 12 }, (_, signIdx) => {
        const pos = SOUTH_POS[signIdx];
        const x = pos.col * cell;
        const y = pos.row * cell;
        const lag = ((data.lagnaSign % 12) + 12) % 12;
        const isLagna = signIdx === lag;
        const houseNum = ((signIdx - lag + 12) % 12) + 1;
        const list = bySign[signIdx];

        return (
          <g key={signIdx}>
            <rect
              x={x}
              y={y}
              width={cell}
              height={cell}
              onClick={() => onSelectHouse?.(houseNum, signIdx)}
              className={`${
                isLagna
                  ? 'fill-amber-50/70 dark:fill-amber-950/30'
                  : 'fill-white dark:fill-slate-900'
              } stroke-slate-300 dark:stroke-slate-700 ${onSelectHouse ? 'cursor-pointer hover:fill-amber-50/40 dark:hover:fill-amber-950/20' : ''}`}
              strokeWidth={1}
            />
            {isLagna && (
              <line
                x1={x}
                y1={y + 18}
                x2={x + 18}
                y2={y}
                className="stroke-amber-600 dark:stroke-amber-400"
                strokeWidth={1.5}
              />
            )}
            <text
              x={x + cell - 4}
              y={y + 12}
              textAnchor="end"
              className="fill-slate-400 dark:fill-slate-500 font-mono"
              fontSize={9}
            >
              {sShort(signIdx, lang)}
            </text>
            {isLagna && (
              <text
                x={x + 5}
                y={y + 12}
                className="fill-amber-700 dark:fill-amber-400 font-semibold"
                fontSize={9}
              >
                {lang === 'te' ? 'లగ్న' : lang === 'hi' ? 'लग्न' : 'Asc'}
              </text>
            )}

            {list.map((pid, i) => {
              const colIdx = i % 2;
              const rowIdx = Math.floor(i / 2);
              const tx = x + 7 + colIdx * 42;
              const ty = y + 29 + rowIdx * 17;
              const retro = data.retroFlags?.[pid];
              const combust = data.combustFlags?.[pid];
              const digKey = data.digKeys?.[pid];
              const vgt = data.vgtFlags?.[pid];
              const syms = planetSymbols({ digKey, vgt, retro, combust });
              const label = pShort(pid, lang) + syms;
              const titleText = buildPlanetTitle(pid, lang, {
                digKey,
                vgt,
                retro,
                combust,
                deg: data.degrees?.[pid],
              });
              return (
                <text
                  key={pid}
                  x={tx}
                  y={ty}
                  fontSize={compact ? 9.5 : 10.5}
                  onClick={() => onSelectPlanet?.(pid)}
                  className={`font-medium ${
                    onSelectPlanet ? 'cursor-pointer hover:underline' : ''
                  } ${
                    pid === 0 || pid === 2 || pid === 5 || pid === 3 || pid === 7
                      ? 'fill-slate-800 dark:fill-slate-200'
                      : 'fill-amber-700 dark:fill-amber-300'
                  }`}
                >
                  <title>{titleText}</title>
                  {label}
                </text>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

// North Indian Diamond chart centers for houses 1..12
const NORTH_CENTERS: { x: number; y: number; signPos: { x: number; y: number } }[] = [
  { x: 180, y: 88, signPos: { x: 180, y: 145 } },   // H1 (Top diamond)
  { x: 90, y: 42, signPos: { x: 90, y: 74 } },      // H2
  { x: 38, y: 90, signPos: { x: 74, y: 94 } },      // H3
  { x: 92, y: 180, signPos: { x: 148, y: 184 } },   // H4 (Left diamond)
  { x: 38, y: 270, signPos: { x: 74, y: 270 } },    // H5
  { x: 90, y: 318, signPos: { x: 90, y: 292 } },    // H6
  { x: 180, y: 272, signPos: { x: 180, y: 222 } },  // H7 (Bottom diamond)
  { x: 270, y: 318, signPos: { x: 270, y: 292 } },  // H8
  { x: 322, y: 270, signPos: { x: 286, y: 270 } },  // H9
  { x: 268, y: 180, signPos: { x: 212, y: 184 } },  // H10 (Right diamond)
  { x: 322, y: 90, signPos: { x: 286, y: 94 } },    // H11
  { x: 270, y: 42, signPos: { x: 270, y: 74 } },    // H12
];

export const NorthIndianChart: React.FC<{
  data: ChartSignData;
  title?: string;
  lang: Language;
  onSelectPlanet?: (id: PlanetId) => void;
  onSelectHouse?: (houseNum: number, signIdx: number) => void;
}> = ({ data, title = 'ఉత్తర భారత చక్రం', lang, onSelectPlanet, onSelectHouse }) => {
  const bySign = planetsBySign(data.signsByPlanet);
  const w = 360;
  const lag = ((data.lagnaSign % 12) + 12) % 12;

  const renderPlanetChip = (pid: PlanetId, idx: number) => {
    const retro = data.retroFlags?.[pid];
    const combust = data.combustFlags?.[pid];
    const digKey = data.digKeys?.[pid];
    const vgt = data.vgtFlags?.[pid];
    const syms = planetSymbols({ digKey, vgt, retro, combust });
    const titleText = buildPlanetTitle(pid, lang, {
      digKey,
      vgt,
      retro,
      combust,
      deg: data.degrees?.[pid],
    });
    return (
      <tspan
        key={pid}
        onClick={() => onSelectPlanet?.(pid)}
        className={onSelectPlanet ? 'cursor-pointer hover:underline' : ''}
      >
        <title>{titleText}</title>
        {idx > 0 ? ' ' : ''}
        {pShort(pid, lang)}
        {syms}
      </tspan>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${w} ${w}`}
      className="w-full max-w-[380px] select-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
      role="img"
      aria-label={title}
    >
      <rect x={0} y={0} width={w} height={w} className="fill-white dark:fill-slate-900" />
      <line x1={0} y1={0} x2={w} y2={w} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth={1.1} />
      <line x1={w} y1={0} x2={0} y2={w} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth={1.1} />
      <polygon
        points={`180,0 360,180 180,360 0,180`}
        className="fill-none stroke-slate-400 dark:stroke-slate-600"
        strokeWidth={1.2}
      />

      {NORTH_CENTERS.map((c, houseIdx) => {
        const signIdx = (lag + houseIdx) % 12;
        const planets = bySign[signIdx];
        return (
          <g key={houseIdx}>
            <text
              x={c.signPos.x}
              y={c.signPos.y}
              textAnchor="middle"
              fontSize={9.5}
              onClick={() => onSelectHouse?.(houseIdx + 1, signIdx)}
              className={`fill-slate-400 dark:fill-slate-500 font-mono ${onSelectHouse ? 'cursor-pointer hover:fill-amber-600' : ''}`}
            >
              {signIdx + 1} · {sShort(signIdx, lang)}
            </text>
            {houseIdx === 0 && (
              <text
                x={c.x}
                y={c.y - 26}
                textAnchor="middle"
                fontSize={9}
                className="fill-amber-700 dark:fill-amber-400 font-semibold"
              >
                {title}
              </text>
            )}
            <text
              x={c.x}
              y={c.y}
              textAnchor="middle"
              fontSize={9.5}
              className="fill-slate-800 dark:fill-slate-200 font-medium"
            >
              {planets.slice(0, 3).map((pid, idx) => renderPlanetChip(pid, idx))}
            </text>
            {planets.length > 3 && (
              <text
                x={c.x}
                y={c.y + 14}
                textAnchor="middle"
                fontSize={9.5}
                className="fill-slate-800 dark:fill-slate-200 font-medium"
              >
                {planets.slice(3).map((pid, idx) => renderPlanetChip(pid, idx))}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export const WesternWheelChart: React.FC<{
  cusps: number[];
  rows: PlanetRow[];
  outerPlanets?: OuterPlanetRow[];
  useTropical?: boolean;
  lang: Language;
}> = ({ cusps, rows, outerPlanets = [], useTropical = true, lang }) => {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 172;
  const rSign = 142;
  const rPlanet = 112;
  const rAspect = 76;

  // Orient Ascendant at 180 deg (9 o'clock standard Western wheel)
  const asc = cusps[0] ?? 0;
  const toAngle = (lon: number) => ((180 - (lon - asc) + 720) % 360) * (Math.PI / 180);

  const pts = rows.map((r) => {
    const lon = useTropical ? r.tropicalLon : r.lon;
    const rad = toAngle(lon);
    return {
      id: r.id,
      key: pShort(r.id, lang),
      syms: planetSymbols(r),
      title: buildPlanetTitle(r.id, lang, { digKey: r.digKey, vgt: r.vgt, retro: r.retro, combust: r.combust, deg: lon }),
      lon,
      x: cx + rPlanet * Math.cos(rad),
      y: cy - rPlanet * Math.sin(rad),
      ax: cx + rAspect * Math.cos(rad),
      ay: cy - rAspect * Math.sin(rad),
    };
  });

  const outerPts = outerPlanets.map((o) => {
    const lon = useTropical ? o.tropicalLon : o.lon;
    const rad = toAngle(lon);
    return {
      key: o.key,
      retro: o.retro,
      x: cx + (rPlanet - 14) * Math.cos(rad),
      y: cy - (rPlanet - 14) * Math.sin(rad),
    };
  });

  // Major aspect lines
  const aspects: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      let diff = Math.abs(pts[i].lon - pts[j].lon);
      if (diff > 180) diff = 360 - diff;
      if (Math.abs(diff - 120) < 7) aspects.push({ x1: pts[i].ax, y1: pts[i].ay, x2: pts[j].ax, y2: pts[j].ay, color: '#16a34a' });
      else if (Math.abs(diff - 90) < 7) aspects.push({ x1: pts[i].ax, y1: pts[i].ay, x2: pts[j].ax, y2: pts[j].ay, color: '#dc2626' });
      else if (Math.abs(diff - 180) < 7) aspects.push({ x1: pts[i].ax, y1: pts[i].ay, x2: pts[j].ax, y2: pts[j].ay, color: '#ea580c' });
      else if (Math.abs(diff - 60) < 5) aspects.push({ x1: pts[i].ax, y1: pts[i].ay, x2: pts[j].ax, y2: pts[j].ay, color: '#2563eb' });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[390px] select-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
      role="img"
      aria-label={lang === 'te' ? 'పాశ్చాత్య సాయన చక్రం' : 'Western Natal Wheel'}
    >
      <circle cx={cx} cy={cy} r={rOuter} className="fill-none stroke-slate-300 dark:stroke-slate-700" strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={rSign} className="fill-none stroke-slate-300 dark:stroke-slate-700" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={rAspect} className="fill-none stroke-slate-200 dark:stroke-slate-800" strokeWidth={1} />

      {/* 12 Zodiac sign boundaries */}
      {Array.from({ length: 12 }, (_, s) => {
        const rad = toAngle(s * 30);
        const midRad = toAngle(s * 30 + 15);
        const x1 = cx + rSign * Math.cos(rad);
        const y1 = cy - rSign * Math.sin(rad);
        const x2 = cx + rOuter * Math.cos(rad);
        const y2 = cy - rOuter * Math.sin(rad);
        const lx = cx + ((rOuter + rSign) / 2) * Math.cos(midRad);
        const ly = cy - ((rOuter + rSign) / 2) * Math.sin(midRad);
        return (
          <g key={s}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth={1} />
            <text x={lx} y={ly + 3} textAnchor="middle" fontSize={9.5} className="fill-slate-600 dark:fill-slate-400 font-medium">
              {sShort(s, lang)}
            </text>
          </g>
        );
      })}

      {/* 12 House cusps */}
      {cusps.map((c, idx) => {
        const rad = toAngle(c);
        const x1 = cx + rAspect * Math.cos(rad);
        const y1 = cy - rAspect * Math.sin(rad);
        const x2 = cx + rSign * Math.cos(rad);
        const y2 = cy - rSign * Math.sin(rad);
        const isAngle = idx === 0 || idx === 3 || idx === 6 || idx === 9;
        return (
          <line
            key={idx}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={isAngle ? 'stroke-amber-600 dark:stroke-amber-400' : 'stroke-slate-200 dark:stroke-slate-700'}
            strokeWidth={isAngle ? 1.5 : 0.8}
          />
        );
      })}

      {/* Aspect chords */}
      {aspects.map((a, idx) => (
        <line key={idx} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke={a.color} strokeOpacity={0.45} strokeWidth={1} />
      ))}

      {/* Planets */}
      {pts.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.ax} cy={p.ay} r={2} className="fill-amber-600 dark:fill-amber-400" />
          <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize={9.5} className="fill-slate-900 dark:fill-slate-100 font-semibold">
            <title>{p.title}</title>
            {p.key}
            {p.syms}
          </text>
        </g>
      ))}

      {/* Outer Planets */}
      {outerPts.map((o) => (
        <text key={o.key} x={o.x} y={o.y + 3} textAnchor="middle" fontSize={8.5} className="fill-sky-700 dark:fill-sky-400 font-mono">
          {o.key}
          {o.retro ? '®️' : ''}
        </text>
      ))}
    </svg>
  );
};

export const ChartRenderer: React.FC<{
  style: ChartStyle;
  data: ChartSignData;
  title?: string;
  subtitle?: string;
  lang: Language;
  cusps?: number[];
  rows?: PlanetRow[];
  outerPlanets?: OuterPlanetRow[];
  onSelectPlanet?: (id: PlanetId) => void;
  onSelectHouse?: (houseNum: number, signIdx: number) => void;
}> = ({ style, data, title, subtitle, lang, cusps, rows, outerPlanets, onSelectPlanet, onSelectHouse }) => {
  const enrichedData: ChartSignData = rows
    ? {
        ...data,
        retroFlags: data.retroFlags || rows.map((r) => r.retro),
        combustFlags: data.combustFlags || rows.map((r) => r.combust),
        digKeys: data.digKeys || rows.map((r) => r.digKey),
        vgtFlags: data.vgtFlags || rows.map((r) => r.vgt),
        degrees: data.degrees || rows.map((r) => r.lon),
      }
    : data;

  if (style === 'north') {
    return <NorthIndianChart data={enrichedData} title={title} lang={lang} onSelectPlanet={onSelectPlanet} onSelectHouse={onSelectHouse} />;
  }
  if (style === 'western' && cusps && rows) {
    return <WesternWheelChart cusps={cusps} rows={rows} outerPlanets={outerPlanets} useTropical={false} lang={lang} />;
  }
  return <SouthIndianChart data={enrichedData} title={title} subtitle={subtitle} lang={lang} onSelectPlanet={onSelectPlanet} onSelectHouse={onSelectHouse} />;
};

export function chartDataFromComputed(c: {
  lagS: number;
  s: number[];
  rows: PlanetRow[];
}): ChartSignData {
  return {
    lagnaSign: c.lagS,
    signsByPlanet: c.s,
    retroFlags: c.rows.map((r) => r.retro),
    combustFlags: c.rows.map((r) => r.combust),
    digKeys: c.rows.map((r) => r.digKey),
    vgtFlags: c.rows.map((r) => r.vgt),
    degrees: c.rows.map((r) => r.lon),
  };
}
