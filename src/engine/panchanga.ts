import {
  MASA_EN,
  MASA_TE,
  NAK_NAMES,
  SAMVATSARA_60,
  SAMVATSARA_60_TE,
  SIGN_NAMES,
  TITHI_EN,
  TITHI_TE,
  VARA_EN,
  VARA_LORDS,
  VARA_TE,
} from './constants.ts';
import { Jd, N, P, getMoonriseMoonset, jdToLocalTime } from './ephemeris.ts';
import { computeChart } from './parashari.ts';
import type { BirthInput, CalcConfig, PlanetId } from './types.ts';
import { evaluateTaraChandraBala } from './yogasNakshatra.ts';

const CHOGHADIYA_DAY_SEQ: Record<number, string[]> = {
  0: ['Udveg', 'Chal', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg'],
  1: ['Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Chal', 'Labh', 'Amrit'],
  2: ['Rog', 'Udveg', 'Chal', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'],
  3: ['Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Chal', 'Labh'],
  4: ['Shubh', 'Rog', 'Udveg', 'Chal', 'Labh', 'Amrit', 'Kaal', 'Shubh'],
  5: ['Chal', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Chal'],
  6: ['Kaal', 'Shubh', 'Rog', 'Udveg', 'Chal', 'Labh', 'Amrit', 'Kaal'],
};

const CHOGHADIYA_TE: Record<string, string> = {
  Udveg: 'ఉద్వేగ',
  Chal: 'చల (సామాన్య)',
  Labh: 'లాభ (శుభం)',
  Amrit: 'అమృత (అత్యుత్తమ)',
  Kaal: 'కాల (అశుభం)',
  Shubh: 'శుభ',
  Rog: 'రోగ (అశుభం)',
};

const CH_GOOD = new Set(['Amrit', 'Shubh', 'Labh', 'Chal']);
const CHORA_ORDER: PlanetId[] = [0, 8, 6, 1, 5, 4, 2];

const RITU_LIST = [
  { en: 'Vasanta (Spring)', te: 'వసంత ఋతువు' },
  { en: 'Grishma (Summer)', te: 'గ్రీష్మ ఋతువు' },
  { en: 'Varsha (Monsoon)', te: 'వర్ష ఋతువు' },
  { en: 'Sharad (Autumn)', te: 'శరదృతువు' },
  { en: 'Hemanta (Pre-winter)', te: 'హేమంత ఋతువు' },
  { en: 'Shishira (Winter)', te: 'శిశిర ఋతువు' },
];

// Standard Durmuhurta indices (out of 15 Muhurtas of daytime) by weekday 0=Sun..6=Sat
const DUR_MUHURTA_INDICES: Record<number, number[]> = {
  0: [13],       // Sun: 14th
  1: [8, 11],    // Mon: 9th, 12th
  2: [3],        // Tue: 4th (+ night)
  3: [7],        // Wed: 8th
  4: [5, 11],    // Thu: 6th, 12th
  5: [3, 8],     // Fri: 4th, 9th
  6: [0, 1],     // Sat: 1st, 2nd
};

// Varjyam start offset in Ghatis (out of 60) per Nakshatra 0..26 (duration = 4 Ghatis = 1/15 of nakshatra span)
const VARJYAM_GHATI_START = [50, 24, 30, 40, 14, 21, 30, 20, 32, 30, 20, 18, 21, 20, 14, 14, 10, 14, 56, 24, 20, 10, 10, 18, 16, 24, 30];

export function computeFullPanchanga(inp: BirthInput, config?: Partial<CalcConfig>) {
  const chart = computeChart(inp, config);
  const { pan, jd, p } = chart;
  const tz = inp.tz;
  const calSys = config?.calendarSystem ?? chart.config.calendarSystem;

  // Approximate Lunar Month: Sun sign + Paksha rules (Amanta vs Purnimanta)
  const sunSign = Math.floor(p[0] / 30); // 0=Mesha (Vaisakha/Chaitra)
  const baseMasaIdx = (sunSign + 1) % 12; // Aries Sun ~= Vaisakha (index 1)
  const masaIdx = calSys === 'purnimanta' && pan.tn > 15 ? (baseMasaIdx + 1) % 12 : baseMasaIdx;

  // Adhika Masa astronomical check: find previous & next Amavasya (Moon-Sun elongation=0) and see if Sun stays in same sidereal sign
  const ay = chart.config.ay;
  const sid = chart.config.sidereal;
  const tNode = chart.config.nodeType === 'true';
  const lunarAgeDeg = N(p[1] - p[0]);
  const prevNewJd = jd - lunarAgeDeg / 12.19075;
  const nextNewJd = jd + (360 - lunarAgeDeg) / 12.19075;
  const prevNewSunSign = Math.floor(P(prevNewJd, ay, sid, tNode)[0] / 30);
  const nextNewSunSign = Math.floor(P(nextNewJd, ay, sid, tNode)[0] / 30);
  const isAdhikaMasa = prevNewSunSign === nextNewSunSign;
  const adhikaMasaNoteTe = isAdhikaMasa ? `అధిక ${MASA_TE[masaIdx]} (సంక్రాంతి లేని చాంద్రమాసం)` : '';
  const adhikaMasaNoteEn = isAdhikaMasa ? `Adhika ${MASA_EN[masaIdx]} (No solar Sankranti in lunar month)` : '';

  // 60-year Prabhavadi Samvatsara (South Indian cycle: 1987=Prabhava(0), e.g., 2026 -> index 39 Parabhava)
  const approxShaka = inp.y - (inp.m < 4 ? 79 : 78);
  const samvatIdx = ((approxShaka + 11) % 60 + 60) % 60;
  const samvatsara = SAMVATSARA_60[samvatIdx];
  const samvatsaraTe = SAMVATSARA_60_TE[samvatIdx];

  // Ayana & Ritu based on tropical sun longitude
  const tropSun = chart.ptrop[0];
  const ayana = tropSun >= 270 || tropSun < 90
    ? { en: 'Uttarayana', te: 'ఉత్తరాయణం' }
    : { en: 'Dakshinayana', te: 'దక్షిణాయణం' };
  const rituIdx = Math.floor(((tropSun + 30) % 360) / 60); // ~Pisces/Aries = Vasanta
  const ritu = RITU_LIST[rituIdx];

  // Solve approximate end time of current Tithi and Nakshatra by binary search over +36 hours
  const findTransition = (fn: (j: number) => number, curVal: number) => {
    let lo = jd;
    let hi = jd + 1.5;
    if (fn(hi) === curVal) hi = jd + 2.2;
    for (let k = 0; k < 16; k++) {
      const mid = (lo + hi) / 2;
      if (fn(mid) === curVal) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const curTithiIdx = Math.floor(N(p[1] - p[0]) / 12);
  const tithiEndJd = findTransition((jx) => {
    const px = P(jx, ay, sid, tNode);
    return Math.floor(N(px[1] - px[0]) / 12);
  }, curTithiIdx);
  const nkEndJd = findTransition((jx) => {
    const px = P(jx, ay, sid, tNode);
    return Math.floor(px[1] / (40 / 3));
  }, pan.nk);
  const nkStartJd = jd - (pan.nkPct / 100) * (nkEndJd - jd) / Math.max(0.01, 1 - pan.nkPct / 100);
  const nkDur = Math.max(0.5, nkEndJd - nkStartJd);
  const vStartGhati = VARJYAM_GHATI_START[pan.nk];
  const varjyamStartJd = nkStartJd + (vStartGhati / 60) * nkDur;
  const varjyamEndJd = nkStartJd + ((vStartGhati + 4) / 60) * nkDur;

  const dayLen = pan.ss - pan.sr;
  const nightLen = pan.sn - pan.ss;
  const durMuhurtas = (DUR_MUHURTA_INDICES[pan.wd] || []).map((idx) => ({
    start: pan.sr + (idx * dayLen) / 15,
    end: pan.sr + ((idx + 1) * dayLen) / 15,
  }));

  const brahmaMuhurta: [number, number] = [pan.sr - 96 / 1440, pan.sr - 48 / 1440];

  const choghadiyaDay = CHOGHADIYA_DAY_SEQ[pan.wd].map((name, i) => ({
    name,
    nameTe: CHOGHADIYA_TE[name] || name,
    good: CH_GOOD.has(name),
    start: jdToLocalTime(pan.sr + (i * dayLen) / 8, tz),
    end: jdToLocalTime(pan.sr + ((i + 1) * dayLen) / 8, tz),
  }));

  const startLord = VARA_LORDS[pan.wd];
  const startIdx = CHORA_ORDER.indexOf(startLord);
  const horas = Array.from({ length: 24 }, (_, k) => {
    const isD = k < 12;
    const hStart = isD ? pan.sr + (k * dayLen) / 12 : pan.ss + ((k - 12) * nightLen) / 12;
    const hEnd = isD ? pan.sr + ((k + 1) * dayLen) / 12 : pan.ss + ((k - 11) * nightLen) / 12;
    return {
      index: k + 1,
      period: isD ? 'Day' : 'Night',
      lord: CHORA_ORDER[(startIdx + k) % 7],
      start: jdToLocalTime(hStart, tz),
      end: jdToLocalTime(hEnd, tz),
    };
  });

  const moonEvents = getMoonriseMoonset(jd, inp.lat, inp.lon, tz);

  return {
    chart,
    varaEn: VARA_EN[pan.wd],
    varaTe: VARA_TE[pan.wd],
    masaEn: MASA_EN[masaIdx],
    masaTe: MASA_TE[masaIdx],
    isAdhikaMasa,
    adhikaMasaNoteTe,
    adhikaMasaNoteEn,
    calendarSystem: calSys,
    samvatsara,
    samvatsaraTe,
    ayana,
    ritu,
    sunrise: jdToLocalTime(pan.sr, tz),
    sunset: jdToLocalTime(pan.ss, tz),
    moonrise: moonEvents.find((e) => e.type === 'rise')?.localTime ?? '—',
    moonset: moonEvents.find((e) => e.type === 'set')?.localTime ?? '—',
    tithiEnd: jdToLocalTime(tithiEndJd, tz),
    nakshatraEnd: jdToLocalTime(nkEndJd, tz),
    rahuKalam: `${jdToLocalTime(pan.rahu[0], tz)} – ${jdToLocalTime(pan.rahu[1], tz)}`,
    yamagandam: `${jdToLocalTime(pan.yama[0], tz)} – ${jdToLocalTime(pan.yama[1], tz)}`,
    gulikaKalam: `${jdToLocalTime(pan.gulika[0], tz)} – ${jdToLocalTime(pan.gulika[1], tz)}`,
    abhijitMuhurta: `${jdToLocalTime(pan.abhijit[0], tz)} – ${jdToLocalTime(pan.abhijit[1], tz)}`,
    brahmaMuhurta: `${jdToLocalTime(brahmaMuhurta[0], tz)} – ${jdToLocalTime(brahmaMuhurta[1], tz)}`,
    durMuhurtas: durMuhurtas.map((d) => `${jdToLocalTime(d.start, tz)} – ${jdToLocalTime(d.end, tz)}`),
    varjyam: `${jdToLocalTime(varjyamStartJd, tz)} – ${jdToLocalTime(varjyamEndJd, tz)}`,
    choghadiyaDay,
    horas,
  };
}

export function scanFestivals(inp: BirthInput, days = 90, config?: Partial<CalcConfig>) {
  const baseJd = Jd(inp.y, inp.m, inp.d, 8 - inp.tz);
  const EV: Record<number, { te: string; en: string }> = {
    4: { te: 'వినాయక చతుర్థి', en: 'Vinayaka Chaturthi' },
    11: { te: 'శుక్ల ఏకాదశి', en: 'Shukla Ekadashi' },
    13: { te: 'శుక్ల ప్రదోష వ్రతం', en: 'Shukla Pradosham' },
    15: { te: 'పౌర్ణమి', en: 'Purnima' },
    19: { te: 'సంకష్టహర చతుర్థి', en: 'Sankashtahara Chaturthi' },
    26: { te: 'కృష్ణ ఏకాదశి', en: 'Krishna Ekadashi' },
    28: { te: 'కృష్ణ ప్రదోష వ్రతం', en: 'Krishna Pradosham' },
    29: { te: 'మాస శివరాత్రి', en: 'Masa Shivaratri' },
    30: { te: 'అమావాస్య', en: 'Amavasya' },
  };
  const out: { date: string; titleEn: string; titleTe: string; tithi: string; tithiTe: string }[] = [];
  let prevT = -1;
  let prevSign = -1;
  for (let k = 0; k < days; k++) {
    const j = baseJd + k;
    const p = P(j, config?.ay ?? inp.ay, config?.sidereal ?? true, config?.nodeType === 'true');
    const tn = Math.floor(N(p[1] - p[0]) / 12) + 1;
    const sunSign = Math.floor(p[0] / 30);
    const dt = new Date((j - 2440587.5) * 864e5 + inp.tz * 36e5).toISOString().slice(0, 10);
    if (prevSign >= 0 && sunSign !== prevSign) {
      out.push({
        date: dt,
        titleEn: `${SIGN_NAMES.en[sunSign]} Sankranti`,
        titleTe: `${SIGN_NAMES.te[sunSign]} సంక్రాంతి`,
        tithi: tn <= 15 ? TITHI_EN[tn - 1] : tn === 30 ? 'Amavasya' : TITHI_EN[tn - 16],
        tithiTe: tn <= 15 ? TITHI_TE[tn - 1] : tn === 30 ? 'అమావాస్య' : TITHI_TE[tn - 16],
      });
    }
    prevSign = sunSign;
    if (EV[tn] && tn !== prevT) {
      const tLabel = tn <= 15 ? `Shukla ${TITHI_EN[tn - 1]}` : tn === 30 ? 'Amavasya' : `Krishna ${TITHI_EN[tn - 16]}`;
      const tLabelTe = tn <= 15 ? `శుక్ల ${TITHI_TE[tn - 1]}` : tn === 30 ? 'అమావాస్య' : `కృష్ణ ${TITHI_TE[tn - 16]}`;
      out.push({ date: dt, titleEn: EV[tn].en, titleTe: EV[tn].te, tithi: tLabel, tithiTe: tLabelTe });
    }
    prevT = tn;
  }
  return out;
}

export type MuhurtaEventType = 'marriage' | 'grihapravesha' | 'business' | 'travel' | 'vehicle' | 'education';

const GOOD_VARAS_BY_EVENT: Record<MuhurtaEventType, number[]> = {
  marriage: [1, 3, 4, 5],       // Mon, Wed, Thu, Fri
  grihapravesha: [1, 3, 4, 5],
  business: [0, 1, 3, 4, 5],
  travel: [1, 3, 4, 5],
  vehicle: [1, 3, 4, 5],
  education: [1, 3, 4, 5],
};
const GOOD_NAKS_BY_EVENT: Record<MuhurtaEventType, number[]> = {
  marriage: [3, 4, 11, 12, 14, 16, 18, 20, 21, 25, 26],
  grihapravesha: [3, 4, 11, 16, 20, 21, 22, 25, 26],
  business: [0, 3, 7, 11, 12, 14, 16, 20, 21, 22, 26],
  travel: [0, 4, 6, 7, 12, 14, 16, 21, 22, 26],
  vehicle: [0, 3, 6, 7, 12, 14, 21, 22, 26],
  education: [0, 4, 6, 7, 12, 13, 14, 21, 26],
};
const BAD_TITHIS = new Set([4, 9, 14, 19, 24, 29, 30]); // Rikta (4,9,14) + Amavasya

export function searchMuhurtaWindows(
  natalMoonLon: number | null,
  startDateStr: string,
  days: number,
  eventType: MuhurtaEventType,
  loc: { lat: number; lon: number; tz: number; ay: number },
  config?: Partial<CalcConfig>,
) {
  const [y, m, d] = startDateStr.split('-').map(Number);
  const startDt = new Date(Date.UTC(y, m - 1, d, 9, 0, 0));
  const results: {
    date: string;
    vara: string;
    varaTe: string;
    tithi: string;
    tithiTe: string;
    nakshatra: string;
    nakshatraTe: string;
    abhijit: string;
    rahuAvoid: string;
    taraStatus: string;
    taraStatusTe: string;
    chandraStatus: string;
    chandraStatusTe: string;
    score: number;
  }[] = [];

  for (let k = 0; k < Math.min(45, Math.max(1, days)); k++) {
    const dt = new Date(startDt.getTime() + k * 864e5);
    const inp: BirthInput = {
      y: dt.getUTCFullYear(),
      m: dt.getUTCMonth() + 1,
      d: dt.getUTCDate(),
      hh: 10,
      mi: 0,
      ss: 0,
      lat: loc.lat,
      lon: loc.lon,
      tz: loc.tz,
      ay: loc.ay,
    };
    const fp = computeFullPanchanga(inp, config);
    const pan = fp.chart.pan;
    let score = 0;
    if (GOOD_VARAS_BY_EVENT[eventType].includes(pan.wd)) score += 25;
    if (!BAD_TITHIS.has(pan.tn)) score += 25;
    if (GOOD_NAKS_BY_EVENT[eventType].includes(pan.nk)) score += 25;

    let taraStatus = '—';
    let taraStatusTe = '—';
    let chandraStatus = '—';
    let chandraStatusTe = '—';
    if (natalMoonLon !== null) {
      const tc = evaluateTaraChandraBala(natalMoonLon, fp.chart.p[1]);
      taraStatus = `${tc.taraNameEn} (${tc.taraFavorable ? 'Good' : 'Caution'})`;
      taraStatusTe = `${tc.taraNameTe} (${tc.taraFavorable ? 'శుభం' : 'జాగ్రత్త'})`;
      chandraStatus = `H${tc.chandraHouse} (${tc.chandraFavorable ? 'Good' : 'Caution'})`;
      chandraStatusTe = `${tc.chandraHouse}వ స్థానం (${tc.chandraFavorable ? 'శుభం' : 'జాగ్రత్త'})`;
      if (tc.taraFavorable) score += 15;
      if (tc.chandraFavorable) score += 10;
    } else {
      score += 20;
    }

    if (score >= 60) {
      results.push({
        date: dt.toISOString().slice(0, 10),
        vara: fp.varaEn,
        varaTe: fp.varaTe,
        tithi: `${pan.pakshaEn} ${pan.tithiEn}`,
        tithiTe: `${pan.paksha} ${pan.tithi}`,
        nakshatra: NAK_NAMES.en[pan.nk],
        nakshatraTe: NAK_NAMES.te[pan.nk],
        abhijit: fp.abhijitMuhurta,
        rahuAvoid: fp.rahuKalam,
        taraStatus,
        taraStatusTe,
        chandraStatus,
        chandraStatusTe,
        score,
      });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

