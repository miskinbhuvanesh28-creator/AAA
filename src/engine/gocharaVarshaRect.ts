import { ORDER, PLANET_NAMES, SEVEN, SIGN_LORDS, SIGN_NAMES, VARA_LORDS } from './constants.ts';
import { computeVimshottari } from './dasha.ts';
import { CU, Jd, N, P, dayInfo, jdToLocalString, signedDiff } from './ephemeris.ts';
import { computeChart } from './parashari.ts';
import { computeShadbala } from './strength.ts';
import type { CalcConfig, ComputedChart, LifeEvent, PlanetId } from './types.ts';
import { VG } from './vargas.ts';

const FAV_FROM_MOON: Record<number, number[]> = {
  0: [3, 6, 10, 11],
  1: [1, 3, 6, 7, 10, 11],
  2: [3, 6, 11],
  6: [2, 4, 6, 8, 10, 11],
  4: [2, 5, 7, 9, 11],
  8: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  5: [3, 6, 11],
  3: [3, 6, 10, 11],
  7: [3, 6, 11],
};

export function findTransitSegments(id: PlanetId, jStart: number, jEnd: number, ay: number, sidereal = true, useTrue = false) {
  const signAt = (j: number) => Math.floor(P(j, ay, sidereal, useTrue)[id] / 30);
  const out: { sign: number; startJd: number; endJd: number }[] = [];
  let s = signAt(jStart);
  let st = jStart;
  const step = id === 1 ? 0.5 : 4;
  for (let j = jStart + step; j <= jEnd; j += step) {
    const c = signAt(j);
    if (c !== s) {
      let a = j - step;
      let b = j;
      for (let i = 0; i < 14; i++) {
        const m = (a + b) / 2;
        if (signAt(m) === s) a = m;
        else b = m;
      }
      out.push({ sign: s, startJd: st, endJd: b });
      s = c;
      st = b;
    }
  }
  out.push({ sign: s, startJd: st, endJd: jEnd });
  return out;
}

export function computeTransitReport(chart: ComputedChart, targetDateStr?: string) {
  const { config, inp, lagS, s, asht } = chart;
  const targetJd = targetDateStr
    ? (() => {
        const [y, m, d] = targetDateStr.split('-').map(Number);
        return Jd(y, m, d, 12 - inp.tz);
      })()
    : Date.now() / 864e5 + 2440587.5;
  const p = P(targetJd, config.ay, config.sidereal, config.nodeType === 'true');
  const pNext = P(targetJd + 0.5, config.ay, config.sidereal, config.nodeType === 'true');
  const pPrev = P(targetJd - 0.5, config.ay, config.sidereal, config.nodeType === 'true');
  const moonSign = s[1];

  const rows = ORDER.map((id) => {
    const tSign = Math.floor(p[id] / 30);
    const fromLagna = ((tSign - lagS + 12) % 12) + 1;
    const fromMoon = ((tSign - moonSign + 12) % 12) + 1;
    const favorable = FAV_FROM_MOON[id]?.includes(fromMoon) ?? false;
    const bavBindus = id <= 6 || id === 8 ? asht.bav[id]?.[tSign] ?? null : null;
    const spd = signedDiff(pNext[id], pPrev[id]);
    return {
      id,
      lon: p[id],
      sign: tSign,
      fromLagna,
      fromMoon,
      favorable,
      bavBindus,
      savBindus: asht.sav[tSign],
      retro: id === 3 || id === 7 || (id > 1 && spd < 0),
    };
  });

  // Double Transit (Jupiter 1,5,7,9 & Saturn 1,3,7,10 from their transit sign)
  const jupSign = Math.floor(p[4] / 30);
  const satSign = Math.floor(p[5] / 30);
  const jupHits = [0, 4, 6, 8].map((o) => ((jupSign + o) % 12 - lagS + 12) % 12 + 1);
  const satHits = [0, 2, 6, 9].map((o) => ((satSign + o) % 12 - lagS + 12) % 12 + 1);
  const doubleTransitHouses = [...new Set(jupHits.filter((h) => satHits.includes(h)))].sort((a, b) => a - b);

  // Saturn Lifetime Sade Sati / Ashtama / Ardhashtama
  const satLife = findTransitSegments(5, chart.jd, chart.jd + 365.25 * 90, config.ay, config.sidereal, config.nodeType === 'true');
  const shaniPhases = satLife
    .map((seg) => {
      const dist = (seg.sign - moonSign + 12) % 12;
      const type =
        dist === 11 ? 'Sade Sati — Rising (12th)' :
        dist === 0 ? 'Sade Sati — Peak (1st)' :
        dist === 1 ? 'Sade Sati — Setting (2nd)' :
        dist === 3 ? 'Ardhashtama Shani (4th)' :
        dist === 7 ? 'Ashtama Shani (8th)' : null;
      return type ? { sign: seg.sign, type, from: jdToLocalString(seg.startJd, inp.tz).slice(0, 10), to: jdToLocalString(seg.endJd, inp.tz).slice(0, 10) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // 7-day forecast
  const forecast7d = Array.from({ length: 7 }, (_, dayOff) => {
    const j = targetJd + dayOff;
    const px = P(j, config.ay, config.sidereal, config.nodeType === 'true');
    let favW = 0, totW = 0;
    for (const id of ORDER) {
      const h = ((Math.floor(px[id] / 30) - moonSign + 12) % 12) + 1;
      const w = id === 1 ? 3 : id === 4 || id === 5 ? 2 : 1;
      if (FAV_FROM_MOON[id].includes(h)) favW += w;
      totW += w;
    }
    const moonH = ((Math.floor(px[1] / 30) - moonSign + 12) % 12) + 1;
    const dateStr = new Date((j - 2440587.5) * 864e5 + inp.tz * 36e5).toISOString().slice(0, 10);
    return { date: dateStr, scorePct: Math.round((100 * favW) / totW), moonHouseFromNatal: moonH };
  });

  return {
    targetJd,
    targetDate: jdToLocalString(targetJd, inp.tz).slice(0, 10),
    rows,
    jupHits,
    satHits,
    doubleTransitHouses,
    shaniPhases,
    forecast7d,
  };
}

// ---- Varshaphala (Annual Solar Return) ----
export function computeVarshaphala(chart: ComputedChart, targetYear: number) {
  const { inp, config } = chart;
  const age = targetYear - inp.y;
  let j = chart.jd + 365.2425 * age;
  for (let k = 0; k < 10; k++) {
    const sunNow = P(j, config.ay, config.sidereal, config.nodeType === 'true')[0];
    const diff = signedDiff(chart.p[0], sunNow);
    j += diff / 0.985647;
  }

  const returnDate = new Date((j - 2440587.5) * 864e5 + inp.tz * 36e5);
  const returnChart = computeChart(
    {
      ...inp,
      y: returnDate.getUTCFullYear(),
      m: returnDate.getUTCMonth() + 1,
      d: returnDate.getUTCDate(),
      hh: returnDate.getUTCHours(),
      mi: returnDate.getUTCMinutes(),
      ss: returnDate.getUTCSeconds(),
    },
    config,
  );

  const munthaSign = (chart.lagS + age) % 12;
  const munthaHouse = ((munthaSign - returnChart.lagS + 12) % 12) + 1;
  const munthaLord = SIGN_LORDS[munthaSign];
  const varshaLagnaLord = SIGN_LORDS[returnChart.lagS];
  const natalLagnaLord = SIGN_LORDS[chart.lagS];
  const di = dayInfo(j, inp.lat, inp.lon, inp.tz);
  const isDayReturn = j >= di.sr && j < di.ss;
  const dinaRatriLord = isDayReturn ? SIGN_LORDS[Math.floor(returnChart.p[0] / 30)] : SIGN_LORDS[Math.floor(returnChart.p[1] / 30)];

  // Panchadhikari & Varshesha (highest Shadbala among Panchadhikari candidates who aspect Varsha Lagna or hold top score)
  const sb = computeShadbala(returnChart);
  const candidates = [munthaLord, varshaLagnaLord, natalLagnaLord, dinaRatriLord];
  const varshesha = candidates.sort((a, b) => {
    const sa = sb.find((x) => x.id === a)?.totalVirupas ?? 0;
    const sbVal = sb.find((x) => x.id === b)?.totalVirupas ?? 0;
    return sbVal - sa;
  })[0];

  // Additional Tajika Yogas: Nakta (fast planet transfers light between 2 planets), Yamaya (slow planet), Kamboola (Moon joins Ithasala)
  const moonReturnRow = returnChart.rows.find((x) => x.id === 1)!;
  const extendedTajika: { type: 'Nakta' | 'Yamaya' | 'Kamboola'; p1: PlanetId; p2: PlanetId; mediator: PlanetId; noteTe: string; noteEn: string }[] = [];
  for (const ty of tajikaYogas.filter((t) => t.yoga.startsWith('Ithasala'))) {
    const r1 = returnChart.rows.find((x) => x.id === ty.p1)!;
    const r2 = returnChart.rows.find((x) => x.id === ty.p2)!;
    if (moonReturnRow.id !== ty.p1 && moonReturnRow.id !== ty.p2) {
      const mDiff = Math.min(Math.abs(moonReturnRow.degInSign - r1.degInSign), Math.abs(moonReturnRow.degInSign - r2.degInSign));
      if (mDiff <= 12) {
        extendedTajika.push({
          type: 'Kamboola',
          p1: ty.p1,
          p2: ty.p2,
          mediator: 1,
          noteTe: `${PLANET_NAMES.te[ty.p1]}–${PLANET_NAMES.te[ty.p2]} ఇతసాలలో చంద్రుడు కలిసిన కంబూల యోగం`,
          noteEn: `Kamboola Yoga: Moon joins Ithasala of ${PLANET_NAMES.en[ty.p1]} & ${PLANET_NAMES.en[ty.p2]}`,
        });
      }
    }
  }
  // Check Nakta/Yamaya when no direct Ithasala between Lagna Lord & Varshesha
  if (varshaLagnaLord !== varshesha) {
    const rL = returnChart.rows.find((x) => x.id === varshaLagnaLord)!;
    const rV = returnChart.rows.find((x) => x.id === varshesha)!;
    const direct = tajikaYogas.some((t) => (t.p1 === varshaLagnaLord && t.p2 === varshesha) || (t.p2 === varshaLagnaLord && t.p1 === varshesha));
    if (!direct) {
      for (const medId of SEVEN) {
        if (medId === varshaLagnaLord || medId === varshesha) continue;
        const rM = returnChart.rows.find((x) => x.id === medId)!;
        const d1 = Math.abs(rM.degInSign - rL.degInSign);
        const d2 = Math.abs(rM.degInSign - rV.degInSign);
        if (d1 <= 12 && d2 <= 12) {
          const isFastest = Math.abs(rM.spd) >= Math.abs(rL.spd) && Math.abs(rM.spd) >= Math.abs(rV.spd);
          const isSlowest = Math.abs(rM.spd) <= Math.abs(rL.spd) && Math.abs(rM.spd) <= Math.abs(rV.spd);
          if (isFastest || isSlowest) {
            extendedTajika.push({
              type: isFastest ? 'Nakta' : 'Yamaya',
              p1: varshaLagnaLord,
              p2: varshesha,
              mediator: medId,
              noteTe: `${isFastest ? 'నక్త' : 'యమయ'} యోగం: ${PLANET_NAMES.te[medId]} ద్వారా ${PLANET_NAMES.te[varshaLagnaLord]}–${PLANET_NAMES.te[varshesha]} అనుసంధానం`,
              noteEn: `${isFastest ? 'Nakta' : 'Yamaya'} Yoga: ${PLANET_NAMES.en[medId]} bridges ${PLANET_NAMES.en[varshaLagnaLord]} & ${PLANET_NAMES.en[varshesha]}`,
            });
            break;
          }
        }
      }
    }
  }

  // Key Sahams (day vs night formula flip)
  const p = returnChart.p;
  const saham = (a: number, b: number, c: number) => N((isDayReturn ? a - b : b - a) + c);
  const sahams = [
    { name: 'Punya Saham (Fortune)', lon: saham(p[1], p[0], returnChart.lag) },
    { name: 'Vidya Saham (Education)', lon: saham(p[0], p[1], returnChart.lag) },
    { name: 'Yasas Saham (Fame)', lon: saham(p[4], p[1], returnChart.lag) },
    { name: 'Vivaha Saham (Marriage)', lon: saham(p[8], p[5], returnChart.lag) },
    { name: 'Karma Saham (Career)', lon: saham(p[2], p[6], returnChart.lag) },
    { name: 'Raja Saham (Authority)', lon: saham(p[5], p[0], returnChart.lag) },
  ].map((s) => ({ ...s, sign: Math.floor(s.lon / 30) }));

  // Mudda Dasha (365.2425 days divided proportionally to Vimshottari years / 120)
  const startVim = computeVimshottari(returnChart.p[1], returnChart.t0);
  const yearMs = 365.2425 * 864e5;
  let muddaCur = returnChart.t0;
  const muddaDasha = startVim.mahas.map((m) => {
    const durDays = (365.2425 * m.years) / 120;
    const durMs = durDays * 864e5;
    const item = {
      lord: m.lord as PlanetId,
      days: durDays,
      start: new Date(muddaCur).toISOString().slice(0, 10),
      end: new Date(muddaCur + durMs).toISOString().slice(0, 10),
    };
    muddaCur += durMs;
    return item;
  });

  // 12 Monthly Muntha Periods across the Solar Year
  const monthlyPeriods = Array.from({ length: 12 }, (_, mIdx) => {
    const mStart = returnChart.t0 + (mIdx * yearMs) / 12;
    const mEnd = returnChart.t0 + ((mIdx + 1) * yearMs) / 12;
    const mSign = (munthaSign + mIdx) % 12;
    const mHouse = ((mSign - returnChart.lagS + 12) % 12) + 1;
    const mLord = SIGN_LORDS[mSign];
    const isGood = [1, 2, 3, 5, 9, 10, 11].includes(mHouse);
    return {
      monthIndex: mIdx + 1,
      from: new Date(mStart).toISOString().slice(0, 10),
      to: new Date(mEnd).toISOString().slice(0, 10),
      munthaSign: mSign,
      munthaHouse: mHouse,
      lord: mLord,
      favorable: isGood,
      summaryTe: `${mIdx + 1}వ మాసం (${SIGN_NAMES.te[mSign]}, H${mHouse}, అధిపతి ${PLANET_NAMES.te[mLord]}): ${isGood ? 'వృత్తి/లాభ అనుకూలం' : 'మిశ్రమం — సంయమనం అవసరం'}`,
      summaryEn: `Month ${mIdx + 1} (${SIGN_NAMES.en[mSign]}, H${mHouse}, Lord ${PLANET_NAMES.en[mLord]}): ${isGood ? 'Supportive for progress & efforts' : 'Mixed — exercise patience'}`,
    };
  });

  return {
    targetYear,
    age,
    returnJd: j,
    returnTimeLocal: jdToLocalString(j, inp.tz),
    returnChart,
    munthaSign,
    munthaHouse,
    munthaLord,
    varshaLagnaLord,
    natalLagnaLord,
    dinaRatriLord,
    varshesha,
    varaLord: VARA_LORDS[di.wd],
    isDayReturn,
    tajikaYogas: tajikaYogas.slice(0, 15),
    extendedTajika,
    sahams,
    muddaDasha,
    monthlyPeriods,
  };
}

// ---- Birth-Time Rectification Engine ----
export function evaluateRectification(
  baseChart: ComputedChart,
  events: LifeEvent[],
  windowMinutes = 20,
  stepMinutes = 2,
) {
  const { inp, config } = baseChart;
  const candidates: {
    offsetMin: number;
    timeStr: string;
    hh: number;
    mi: number;
    lagnaSign: number;
    lagnaDeg: number;
    d9LagnaSign: number;
    d10LagnaSign: number;
    score: number;
    eventNotes: string[];
  }[] = [];

  const vim = computeVimshottari(baseChart.p[1], baseChart.t0);
  const eventMapHouses: Record<LifeEvent['category'], number[]> = {
    marriage: [2, 7, 11],
    career: [2, 6, 10, 11],
    education: [4, 5, 9],
    childbirth: [2, 5, 9, 11],
    property: [4, 11],
    travel: [3, 9, 12],
    health: [1, 6, 8, 12],
    other: [1, 9, 10],
  };

  for (let off = -windowMinutes; off <= windowMinutes; off += stepMinutes) {
    const rawMin = inp.hh * 60 + inp.mi + off;
    const normMin = ((rawMin % 1440) + 1440) % 1440;
    const candHh = Math.floor(normMin / 60);
    const candMi = normMin % 60;
    const candChart = computeChart({ ...inp, hh: candHh, mi: candMi }, config);
    let score = 50;
    const eventNotes: string[] = [];

    for (const ev of events) {
      const evMs = new Date(`${ev.eventDate}T12:00:00Z`).getTime();
      const md = vim.mahas.find((m) => evMs >= m.start && evMs < m.end) || vim.mahas[0];
      const ad = vim.getSub(md).find((a) => evMs >= a.start && evMs < a.end) || vim.mahas[0];
      const mdLord = md.lord as PlanetId;
      const adLord = ad.lord as PlanetId;
      const targets = eventMapHouses[ev.category] || [1, 9, 10];
      const mdSigs = candChart.kp.sig[mdLord] || [];
      const adSigs = candChart.kp.sig[adLord] || [];
      const mdHits = targets.filter((h) => mdSigs.includes(h)).length;
      const adHits = targets.filter((h) => adSigs.includes(h)).length;
      const pts = mdHits * 8 + adHits * 10;
      score += pts;
      eventNotes.push(`${ev.title}: ${PLANET_NAMES.en[mdLord]}/${PLANET_NAMES.en[adLord]} → +${pts}`);
    }

    // Bonus when Lagna Sub-lord matches a Ruling Planet (Moon star lord / Lagna sign lord)
    const moonRow = candChart.rows.find((r) => r.id === 1)!;
    const lagSub = candChart.kp.cuspSubs[0]?.subLord;
    if (lagSub === moonRow.sub[0] || lagSub === SIGN_LORDS[candChart.lagS]) {
      score += 6;
    }

    const dt = new Date(Date.UTC(inp.y, inp.m - 1, inp.d, inp.hh, inp.mi + off, inp.ss));
    candidates.push({
      offsetMin: off,
      timeStr: dt.toISOString().slice(11, 16),
      hh: candHh,
      mi: candMi,
      lagnaSign: candChart.lagS,
      lagnaDeg: candChart.lag % 30,
      d9LagnaSign: VG(candChart.lag, 9),
      d10LagnaSign: VG(candChart.lag, 10),
      score,
      eventNotes,
    });
  }

  const sensitivityRows = [-10, -5, 0, 5, 10].map((off) => {
    const rawMin = inp.hh * 60 + inp.mi + off;
    const normMin = ((rawMin % 1440) + 1440) % 1440;
    const c = computeChart({ ...inp, hh: Math.floor(normMin / 60), mi: normMin % 60 }, config);
    const m = c.rows.find((x) => x.id === 1)!;
    return {
      offsetMin: off,
      lagnaSign: SIGN_NAMES.en[c.lagS],
      lagnaDeg: (c.lag % 30).toFixed(2),
      d9Lagna: SIGN_NAMES.en[VG(c.lag, 9)],
      moonNakPada: `${m.nk + 1}-${m.pada}`,
      moonD9: SIGN_NAMES.en[m.d9],
    };
  });

  const d1Changes = new Set(sensitivityRows.map((x) => x.lagnaSign)).size > 1;
  const d9Changes = new Set(sensitivityRows.map((x) => x.d9Lagna)).size > 1;
  const lmtOffsetMin = Math.round((inp.lon / 15 - inp.tz) * 60);

  return {
    candidates: candidates.sort((a, b) => b.score - a.score),
    sensitivityRows,
    d1StableWithin10m: !d1Changes,
    d9StableWithin10m: !d9Changes,
    lmtOffsetMin,
    tzSanityNoteTe: `స్థానిక సగటు సమయం (LMT) తేడా: ${lmtOffsetMin >= 0 ? '+' : ''}${lmtOffsetMin} నిమిషాలు (UTC${inp.tz >= 0 ? '+' : ''}${inp.tz}).${inp.y < 1950 ? ' చారిత్రక యుద్ధ/LMT సమయ మార్పులను తనిఖీ చేయండి.' : ''}`,
    tzSanityNoteEn: `LMT offset from standard zone UTC${inp.tz >= 0 ? '+' : ''}${inp.tz}: ${lmtOffsetMin >= 0 ? '+' : ''}${lmtOffsetMin} min.${inp.y < 1950 ? ' Verify pre-1950 historical war-time / LMT conventions.' : ''}`,
    confidence: events.length >= 3 ? 'High (Multi-event Dasha/KP tested)' : events.length >= 1 ? 'Moderate (Limited events)' : 'Baseline (±10m cusp sensitivity only)',
  };
}
