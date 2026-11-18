import { SIGN_LORDS, VARA_LORDS } from './constants.ts';
import { KO, YR, kpSub } from './ephemeris.ts';
import { computeChart } from './parashari.ts';
import type { BirthInput, CalcConfig, ComputedChart, PlanetId } from './types.ts';

export interface Horary249Entry {
  number: number; // 1..249
  startLon: number;
  endLon: number;
  sign: number;
  starLord: PlanetId;
  subLord: PlanetId;
}

// Generate canonical 1..249 KP Horary Longitude Table (27*9=243 subs + 6 sign boundary splits = 249)
let _horaryTableCache: Horary249Entry[] | null = null;

export function getKpHoraryTable(): Horary249Entry[] {
  if (_horaryTableCache) return _horaryTableCache;
  const entries: Horary249Entry[] = [];
  // Each Vimshottari year in a 13°20' Nakshatra equals exactly 1/9 degree (120/9 deg total per star; 270 units = 30° sign)
  let unitCursor = 0;
  let num = 1;
  for (let n = 0; n < 27; n++) {
    const starLord = KO[n % 9];
    const startIdx = KO.indexOf(starLord);
    for (let k = 0; k < 9; k++) {
      const subLord = KO[(startIdx + k) % 9];
      const spanUnits = YR[subLord];
      const endUnits = unitCursor + spanUnits;
      const sStart = Math.floor(unitCursor / 270);
      const sEnd = Math.floor((endUnits - 1) / 270);
      if (sStart !== sEnd) {
        const boundaryUnits = sEnd * 270;
        entries.push({
          number: num++,
          startLon: unitCursor / 9,
          endLon: boundaryUnits / 9,
          sign: sStart,
          starLord,
          subLord,
        });
        entries.push({
          number: num++,
          startLon: boundaryUnits / 9,
          endLon: endUnits / 9,
          sign: sEnd,
          starLord,
          subLord,
        });
      } else {
        entries.push({
          number: num++,
          startLon: unitCursor / 9,
          endLon: endUnits / 9,
          sign: sStart,
          starLord,
          subLord,
        });
      }
      unitCursor = endUnits;
    }
  }
  _horaryTableCache = entries;
  return entries;
}

export function getRulingPlanets(inp: BirthInput, config?: Partial<CalcConfig>) {
  const now = new Date(Date.now() + inp.tz * 36e5);
  const nowInp: BirthInput = {
    ...inp,
    y: now.getUTCFullYear(),
    m: now.getUTCMonth() + 1,
    d: now.getUTCDate(),
    hh: now.getUTCHours(),
    mi: now.getUTCMinutes(),
    ss: 0,
  };
  const c = computeChart(nowInp, config);
  const mo = c.rows.find((r) => r.id === 1)!;
  const ascSub = kpSub(c.lag);
  return {
    chart: c,
    localTimeStr: now.toISOString().slice(0, 16).replace('T', ' '),
    dayLord: VARA_LORDS[now.getUTCDay()],
    lagnaSignLord: SIGN_LORDS[c.lagS],
    lagnaStarLord: ascSub[0],
    lagnaSubLord: ascSub[1],
    moonSignLord: SIGN_LORDS[mo.sign],
    moonStarLord: mo.sub[0],
    moonSubLord: mo.sub[1],
  };
}

export interface KpEventRule {
  id: string;
  titleEn: string;
  titleTe: string;
  primaryCusp: number;
  supportingHouses: number[];
  negatingHouses: number[];
}

export const KP_EVENTS: KpEventRule[] = [
  { id: 'marriage', titleEn: 'Marriage & Partnership', titleTe: 'వివాహం', primaryCusp: 7, supportingHouses: [2, 7, 11], negatingHouses: [1, 6, 10] },
  { id: 'career', titleEn: 'Career & Employment', titleTe: 'ఉద్యోగం / వృత్తి', primaryCusp: 6, supportingHouses: [2, 6, 10, 11], negatingHouses: [5, 8, 12] },
  { id: 'business', titleEn: 'Business & Self-Enterprise', titleTe: 'వ్యాపారం', primaryCusp: 7, supportingHouses: [2, 7, 10, 11], negatingHouses: [6, 8, 12] },
  { id: 'property', titleEn: 'Property & Vehicle', titleTe: 'భూమి / గృహం / వాహనం', primaryCusp: 4, supportingHouses: [4, 11, 12], negatingHouses: [3, 5, 8] },
  { id: 'education', titleEn: 'Education & Degrees', titleTe: 'విద్య / ఉన్నత చదువులు', primaryCusp: 4, supportingHouses: [4, 9, 11], negatingHouses: [3, 6, 8] },
  { id: 'children', titleEn: 'Children & Progeny', titleTe: 'సంతానం', primaryCusp: 5, supportingHouses: [2, 5, 11], negatingHouses: [1, 4, 10] },
  { id: 'foreign', titleEn: 'Foreign Travel & Settlement', titleTe: 'విదేశ ప్రయాణం / స్థిరనివాసం', primaryCusp: 12, supportingHouses: [3, 9, 12], negatingHouses: [2, 4, 11] },
  { id: 'finance', titleEn: 'Wealth & Financial Gains', titleTe: 'ధన లాభం', primaryCusp: 2, supportingHouses: [2, 6, 11], negatingHouses: [5, 8, 12] },
];

export function evaluateKpEvent(chart: ComputedChart, rule: KpEventRule) {
  const cusp = chart.kp.cuspSubs.find((c) => c.house === rule.primaryCusp)!;
  const subLord = cusp.subLord;
  const subLordSigs = chart.kp.sig[subLord] || [];
  const supHits = subLordSigs.filter((h) => rule.supportingHouses.includes(h));
  const negHits = subLordSigs.filter((h) => rule.negatingHouses.includes(h));

  let verdict: 'Promised' | 'Conditional / Mixed' | 'Weak / Delayed' = 'Conditional / Mixed';
  if (supHits.length > 0 && supHits.length >= negHits.length) {
    verdict = negHits.length === 0 ? 'Promised' : 'Conditional / Mixed';
  } else if (supHits.length === 0) {
    verdict = 'Weak / Delayed';
  }

  // Significator planets ranked for the supporting houses
  const bestSignificators = (Object.entries(chart.kp.sig) as [string, number[]][])
    .map(([pid, hs]) => {
      const id = Number(pid) as PlanetId;
      const matches = hs.filter((h) => rule.supportingHouses.includes(h));
      return { id, matches, allHouses: hs };
    })
    .filter((x) => x.matches.length > 0)
    .sort((a, b) => b.matches.length - a.matches.length);

  return { rule, cusp, subLord, subLordSigs, supHits, negHits, verdict, bestSignificators };
}

export function computeKpHorary(num1to249: number, inp: BirthInput, config?: Partial<CalcConfig>) {
  const n = Math.max(1, Math.min(249, Math.round(num1to249)));
  const entry = getKpHoraryTable()[n - 1];
  const baseChart = computeChart(inp, config);
  // In KP Horary, the ascendant cusp is fixed to the chosen horary number's startLon, and subsequent cusps advance using Placidus/Equal offsets from that ascendant longitude
  const diff = entry.startLon - baseChart.lag;
  const cusps = baseChart.cu.map((c) => ((c + diff) % 360 + 360) % 360);
  const kpChart = computeChart(inp, config);
  kpChart.cu = cusps;
  kpChart.lag = entry.startLon;
  kpChart.lagS = Math.floor(entry.startLon / 30);
  return { number: n, entry, chart: kpChart };
}
