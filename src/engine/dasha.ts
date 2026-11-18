import { HOUSE_SIGNIFICANCE, PLANET_NAMES, SIGN_LORDS, SIGN_NAMES } from './constants.ts';
import { KO, YR } from './ephemeris.ts';
import { getFunctionalNature } from './parashari.ts';
import type { ComputedChart, PlanetId } from './types.ts';

export const YEAR_MS = 365.2425 * 864e5;

export interface DashaPeriod {
  lord: string | number;
  start: number;
  end: number;
  dur: number;
  years: number;
  index: number;
}

const VIM_SEQ: [PlanetId, number][] = KO.map((i) => [i, YR[i]]);

const YOGINI_SEQ: [string, number, PlanetId | null][] = [
  ['Mangala (మంగళ)', 1, 1],
  ['Pingala (పింగళ)', 2, 0],
  ['Dhanya (ధాన్య)', 3, 4],
  ['Bhramari (భ్రామరి)', 4, 2],
  ['Bhadrika (భద్రిక)', 5, 6],
  ['Ulka (ఉల్క)', 6, 5],
  ['Siddha (సిద్ధ)', 7, 8],
  ['Sankata (సంకట)', 8, 3],
];

// Ashtottari Dasha: 108 years (8 lords: Su 6, Mo 15, Ma 8, Me 17, Sa 10, Ju 19, Ra 12, Ve 21)
const ASHT_SEQ: [PlanetId, number][] = [
  [0, 6], [1, 15], [2, 8], [6, 17], [5, 10], [4, 19], [3, 12], [8, 21],
];

function buildSubPeriods(seq: [string | number, number][], total: number, startIdx: number, startMs: number, durMs: number): DashaPeriod[] {
  const out: DashaPeriod[] = [];
  let cur = startMs;
  for (let k = 0; k < seq.length; k++) {
    const j = (startIdx + k) % seq.length;
    const d = (durMs * seq[j][1]) / total;
    out.push({ lord: seq[j][0], start: cur, end: cur + d, dur: d, years: d / YEAR_MS, index: j });
    cur += d;
  }
  return out;
}

export function computeVimshottari(moonLon: number, birthMs: number) {
  const span = 40 / 3;
  const nk = Math.floor(moonLon / span);
  const f = (moonLon % span) / span;
  const idx = nk % 9;
  const startLordYears = VIM_SEQ[idx][1];
  const st = birthMs - f * startLordYears * YEAR_MS;
  const mahas = buildSubPeriods(VIM_SEQ, 120, idx, st, 120 * YEAR_MS);
  return {
    balanceYears: (1 - f) * startLordYears,
    birthLord: VIM_SEQ[idx][0],
    mahas,
    getSub: (parent: DashaPeriod) => buildSubPeriods(VIM_SEQ, 120, parent.index, parent.start, parent.dur),
  };
}

export function findActiveVimshottari(moonLon: number, birthMs: number, targetMs = Date.now()) {
  const vim = computeVimshottari(moonLon, birthMs);
  const clamp = Math.max(birthMs, Math.min(vim.mahas[vim.mahas.length - 1].end - 1, targetMs));
  const pick = (list: DashaPeriod[]) => list.find((p) => clamp >= p.start && clamp < p.end) || list[0];
  const maha = pick(vim.mahas);
  const antar = pick(vim.getSub(maha));
  const pratyantar = pick(vim.getSub(antar));
  const sookshma = pick(vim.getSub(pratyantar));
  const prana = pick(vim.getSub(sookshma));
  return { maha, antar, pratyantar, sookshma, prana, tree: vim };
}

export function computeYogini(moonLon: number, birthMs: number) {
  const span = 40 / 3;
  const nk = Math.floor(moonLon / span); // 0..26 (1-based nk+1)
  const f = (moonLon % span) / span;
  const idx = (((nk + 1 + 3) % 8) + 7) % 8;
  const startYears = YOGINI_SEQ[idx][1];
  const st = birthMs - f * startYears * YEAR_MS;
  const seq: [string, number][] = YOGINI_SEQ.map(([n, y]) => [n, y]);
  const mahas = buildSubPeriods(seq, 36, idx, st, 36 * YEAR_MS);
  return {
    balanceYears: (1 - f) * startYears,
    mahas,
    getSub: (parent: DashaPeriod) => buildSubPeriods(seq, 36, parent.index, parent.start, parent.dur),
  };
}

export function computeAshtottari(moonLon: number, birthMs: number) {
  // Traditional 28-nakshatra (incl Abhijit) or 27-nakshatra cycle starting from Ardra (index 5)
  const span = 40 / 3;
  const nk = Math.floor(moonLon / span);
  const f = (moonLon % span) / span;
  // Standard mapping of 27 nakshatras into 8 lords (Ardra..Ashlesha=Su(3/4), etc.)
  const mapFromArdra = [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7];
  const offsetFromArdra = (nk - 5 + 27) % 27;
  const idx = mapFromArdra[offsetFromArdra];
  const startYears = ASHT_SEQ[idx][1];
  const st = birthMs - f * startYears * YEAR_MS;
  const mahas = buildSubPeriods(ASHT_SEQ, 108, idx, st, 108 * YEAR_MS);
  return {
    balanceYears: (1 - f) * startYears,
    mahas,
    getSub: (parent: DashaPeriod) => buildSubPeriods(ASHT_SEQ, 108, parent.index, parent.start, parent.dur),
  };
}

export interface SignDashaRow {
  sign: number;
  lord: PlanetId;
  lordSign: number;
  years: number;
  start: number;
  end: number;
  direction: 'Forward' | 'Reverse';
}

export function computeCharaDasha(chart: ComputedChart): SignDashaRow[] {
  const start = chart.lagS;
  // K.N. Rao style: 9th sign odd/even decides progression direction of Lagna
  const ninthSign = (start + 8) % 12;
  const oddSigns = [0, 2, 4, 6, 8, 10]; // Aries..Aquarius are odd
  const progDir = oddSigns.includes(ninthSign) ? 1 : -1;
  let cur = chart.t0;
  const out: SignDashaRow[] = [];

  for (let i = 0; i < 12; i++) {
    const s = ((start + progDir * i) % 12 + 12) % 12;
    const lord = SIGN_LORDS[s];
    const lordSign = chart.s[lord];
    const signDir = oddSigns.includes(s) ? 1 : -1;
    let count = ((lordSign - s) * signDir % 12 + 12) % 12;
    if (count === 0) count = 12;
    const dur = count * YEAR_MS;
    out.push({
      sign: s,
      lord,
      lordSign,
      years: count,
      start: cur,
      end: cur + dur,
      direction: signDir === 1 ? 'Forward' : 'Reverse',
    });
    cur += dur;
  }
  return out;
}

export function computeNarayanaDasha(chart: ComputedChart): SignDashaRow[] {
  // Stronger of Lagna vs 7th house (counted by number of planets occupying)
  const lagCount = chart.rows.filter((r) => r.sign === chart.lagS).length;
  const sevSign = (chart.lagS + 6) % 12;
  const sevCount = chart.rows.filter((r) => r.sign === sevSign).length;
  const start = sevCount > lagCount ? sevSign : chart.lagS;
  const oddSigns = [0, 2, 4, 6, 8, 10];
  const step = oddSigns.includes(start) ? 1 : -1;
  let cur = chart.t0;
  const out: SignDashaRow[] = [];
  // Standard Kendra-Panaphara-Apoklima progression every 3 signs, simplified zodiacal/reverse here with clear note
  for (let i = 0; i < 12; i++) {
    const s = ((start + step * i) % 12 + 12) % 12;
    const lord = SIGN_LORDS[s];
    const lordSign = chart.s[lord];
    const signDir = oddSigns.includes(s) ? 1 : -1;
    let count = ((lordSign - s) * signDir % 12 + 12) % 12;
    if (count === 0) count = 12;
    const dur = count * YEAR_MS;
    out.push({
      sign: s,
      lord,
      lordSign,
      years: count,
      start: cur,
      end: cur + dur,
      direction: signDir === 1 ? 'Forward' : 'Reverse',
    });
    cur += dur;
  }
  return out;
}

// Kalachakra Dasha (Savya vs Apasavya Pada Cycle)
const SAVYA_RASHIS = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 7, 6, 5, 3, 4, 2],
  [1, 0, 11, 10, 9, 8, 0, 1, 2],
  [3, 4, 5, 6, 7, 8, 9, 10, 11],
];
const APASAVYA_RASHIS = [
  [7, 6, 5, 3, 4, 2, 1, 0, 11],
  [10, 9, 8, 0, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 7, 6, 5],
  [3, 4, 2, 1, 0, 11, 10, 9, 8],
];
const KALA_SIGN_YEARS = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10]; // Ar..Pi
const SAVYA_NAKS = new Set([0, 1, 2, 6, 7, 8, 12, 13, 14, 18, 19, 20, 24, 25, 26]); // Groups A & C (Savya)

export function computeKalachakra(moonLon: number, birthMs: number) {
  const span = 40 / 3;
  const nk = Math.floor(moonLon / span);
  const pada = Math.floor((moonLon % span) / (10 / 3)); // 0..3
  const f = (moonLon % (10 / 3)) / (10 / 3);
  const isSavya = SAVYA_NAKS.has(nk);
  const seq = isSavya ? SAVYA_RASHIS[pada] : APASAVYA_RASHIS[pada];
  const deha = seq[0];
  const jeeva = seq[seq.length - 1];
  const totalYears = seq.reduce((a, s) => a + KALA_SIGN_YEARS[s], 0);
  const firstYears = KALA_SIGN_YEARS[seq[0]];
  let cur = birthMs - f * firstYears * YEAR_MS;
  const periods = seq.map((sign) => {
    const yrs = KALA_SIGN_YEARS[sign];
    const dur = yrs * YEAR_MS;
    const item = { sign, years: yrs, start: cur, end: cur + dur };
    cur += dur;
    return item;
  });
  return { isSavya, deha, jeeva, pada: pada + 1, totalYears, periods };
}

export function computeShoolaDasha(chart: ComputedChart): SignDashaRow[] {
  // Shoola Dasha (Jaimini): fixed 9 years per Rashi, starting from stronger of Lagna vs 7th house
  const lagCount = chart.rows.filter((r) => r.sign === chart.lagS).length;
  const sevSign = (chart.lagS + 6) % 12;
  const sevCount = chart.rows.filter((r) => r.sign === sevSign).length;
  const start = sevCount > lagCount ? sevSign : chart.lagS;
  const oddSigns = [0, 2, 4, 6, 8, 10];
  const step = oddSigns.includes(start) ? 1 : -1;
  let cur = chart.t0;
  const out: SignDashaRow[] = [];
  for (let i = 0; i < 12; i++) {
    const s = ((start + step * i) % 12 + 12) % 12;
    const lord = SIGN_LORDS[s];
    const lordSign = chart.s[lord];
    const dur = 9 * YEAR_MS;
    out.push({
      sign: s,
      lord,
      lordSign,
      years: 9,
      start: cur,
      end: cur + dur,
      direction: step === 1 ? 'Forward' : 'Reverse',
    });
    cur += dur;
  }
  return out;
}

export function computeMandookaDasha(chart: ComputedChart): SignDashaRow[] {
  // Mandooka (Frog-jump) Dasha: leaps by 3rd sign (+2/-2 mod 12); Chara=7y, Sthira=8y, Dwiswabhava=9y
  const lagCount = chart.rows.filter((r) => r.sign === chart.lagS).length;
  const sevSign = (chart.lagS + 6) % 12;
  const sevCount = chart.rows.filter((r) => r.sign === sevSign).length;
  const start = sevCount > lagCount ? sevSign : chart.lagS;
  const oddSigns = [0, 2, 4, 6, 8, 10];
  const jump = oddSigns.includes(start) ? 2 : -2;
  let cur = chart.t0;
  const visited = new Set<number>();
  const out: SignDashaRow[] = [];
  let currentSign = start;
  for (let i = 0; i < 12; i++) {
    if (visited.has(currentSign)) {
      currentSign = ((currentSign + (oddSigns.includes(start) ? 1 : -1)) % 12 + 12) % 12;
    }
    visited.add(currentSign);
    const s = currentSign;
    const lord = SIGN_LORDS[s];
    const lordSign = chart.s[lord];
    const mod3 = s % 3; // 0=Chara(7), 1=Sthira(8), 2=Dwiswabhava(9)
    const years = mod3 === 0 ? 7 : mod3 === 1 ? 8 : 9;
    const dur = years * YEAR_MS;
    out.push({
      sign: s,
      lord,
      lordSign,
      years,
      start: cur,
      end: cur + dur,
      direction: jump > 0 ? 'Forward' : 'Reverse',
    });
    cur += dur;
    currentSign = ((currentSign + jump) % 12 + 12) % 12;
  }
  return out;
}

export function analyzeDashaPeriod(chart: ComputedChart, lordId: PlanetId) {
  const row = chart.rows.find((r) => r.id === lordId)!;
  const fn = getFunctionalNature(chart.lagS);
  const owned = fn.byPlanet[lordId]?.houses ?? [];
  const role = fn.byPlanet[lordId]?.role ?? 'Node';
  const badhaka = fn.byPlanet[lordId]?.badhaka ?? false;
  const activeYogas = chart.yogas.filter((y) => y.on && y.planets.includes(lordId));
  const kpSigs = chart.kp.sig[lordId] ?? [];

  const ownedThemesTe = owned
    .map((h) => `${h}వ (${HOUSE_SIGNIFICANCE[h - 1]?.te.split(',')[0] ?? ''})`)
    .join(', ');
  const ownedThemesEn = owned
    .map((h) => `H${h} (${HOUSE_SIGNIFICANCE[h - 1]?.en.split(',')[0] ?? ''})`)
    .join(', ');

  const phalaluTe =
    `${PLANET_NAMES.te[lordId]} దశలో ${row.house}వ భావ (${SIGN_NAMES.te[row.sign]}, ${row.dig}) ఫలితాలు ప్రధానంగా యాక్టివేట్ అవుతాయి. ` +
    `${owned.length ? `అధిపత్య భావాలు: ${ownedThemesTe}. ` : `ఛాయాగ్రహం కాబట్టి స్థిత భావం & రాశ్యాధిపతి (${PLANET_NAMES.te[SIGN_LORDS[row.sign]]}) ఫలాలు ఇస్తుంది. `}` +
    `KP సూచికలు: H${kpSigs.join(', H')}.` +
    `${activeYogas.length ? ` యోగాలు: ${activeYogas.map((y) => y.n).join(', ')}.` : ''}` +
    `${badhaka ? ' (బాధక స్థాన ప్రభావం వల్ల ప్రణాళికతో ముందుకు సాగడం శ్రేయస్కరం.)' : ''}`;

  const phalaluEn =
    `During ${PLANET_NAMES.en[lordId]} Dasha, House ${row.house} (${SIGN_NAMES.en[row.sign]}, ${row.digKey}) activates strongly. ` +
    `${owned.length ? `Lordships: ${ownedThemesEn}. ` : `As a Lunar Node, conveys results of its dispositor ${PLANET_NAMES.en[SIGN_LORDS[row.sign]]} and house occupied. `}` +
    `KP Significators: H${kpSigs.join(', H')}.` +
    `${activeYogas.length ? ` Participating Yogas: ${activeYogas.map((y) => y.nEn).join(', ')}.` : ''}` +
    `${badhaka ? ' (Badhaka role — apply patience & methodical execution.)' : ''}`;

  return {
    lordId,
    house: row.house,
    sign: row.sign,
    dignity: row.dig,
    dignityKey: row.digKey,
    role,
    badhaka,
    ownedHouses: owned,
    kpSigs,
    activeYogas,
    phalaluTe,
    phalaluEn,
  };
}

