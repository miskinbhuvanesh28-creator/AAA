import { EXA, MTR, NAT_ENEMIES, NAT_FRIENDS, OWN, SEVEN, SIGN_LORDS, VARA_LORDS } from './constants.ts';
import { N, eclipticToEquatorial } from './ephemeris.ts';
import type { AshtakavargaResult, ComputedChart, PlanetId } from './types.ts';
import { VG } from './vargas.ts';

const ang = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

const NAISARGIKA: Record<number, number> = { 0: 60, 1: 51.43, 8: 42.86, 4: 34.29, 6: 25.71, 2: 17.14, 5: 8.57 };
const DEB_POINT: Record<number, number> = { 0: 190, 1: 213, 2: 118, 6: 345, 4: 275, 8: 177, 5: 20 };
const DIG_HOUSE: Record<number, number> = { 0: 10, 2: 10, 1: 4, 8: 4, 6: 1, 4: 1, 5: 7 };
const CH_ORDER: PlanetId[] = [0, 8, 6, 1, 5, 4, 2];
const MEAN_SPEED: Record<number, number> = { 0: 0.9856, 1: 13.1764, 2: 0.524, 6: 0.9856, 4: 0.0831, 8: 0.9856, 5: 0.0335 };
export const MIN_SHADBALA_RUPAS: Record<number, number> = { 0: 6.5, 1: 6.0, 2: 5.0, 6: 7.0, 4: 6.5, 8: 5.5, 5: 5.0 };

function getRow(chart: ComputedChart, id: PlanetId) {
  return chart.rows.find((r) => r.id === id)!;
}

function panchadhaPts(a: PlanetId, b: PlanetId, chart: ComputedChart): number {
  const sa = getRow(chart, a).sign;
  const sb = getRow(chart, b).sign;
  const dist = ((sb - sa + 12) % 12) + 1;
  const temp = [2, 3, 4, 10, 11, 12].includes(dist) ? 1 : -1;
  const nat = NAT_FRIENDS[a]?.includes(b) ? 1 : NAT_ENEMIES[a]?.includes(b) ? -1 : 0;
  const s = nat + temp;
  if (s >= 2) return 22.5;
  if (s === 1) return 15;
  if (s === 0) return 7.5;
  if (s === -1) return 3.75;
  return 1.875;
}

function saptaVargaja(id: PlanetId, chart: ComputedChart): number {
  const x = getRow(chart, id);
  const vargas = [1, 2, 3, 7, 9, 12, 30];
  let tot = 0;
  for (const v of vargas) {
    const sg = v === 1 ? x.sign : VG(x.lon, v);
    const lord = SIGN_LORDS[sg];
    const m = MTR[id];
    if (v === 1 && m && m[0] === sg && x.degInSign >= m[1] && x.degInSign < m[2]) {
      tot += 45;
    } else if (lord === id || OWN[id]?.includes(sg)) {
      tot += 30;
    } else {
      tot += panchadhaPts(id, lord, chart);
    }
  }
  return tot;
}

// BPHS Ahargana based Abda (Varsha) and Masa lords
function abdaMasaLords(jd: number): { abdaLord: PlanetId; masaLord: PlanetId } {
  // Ahargana from Kaliyuga epoch JD 588465.5 (mean sidereal year 365.25636, 30-day civil/solar month block)
  const ahargana = Math.max(0, jd - 588465.5);
  const yearStartDay = Math.floor(ahargana / 360) * 360;
  const monthStartDay = Math.floor(ahargana / 30) * 30;
  const wdFromAhargana = (days: number): PlanetId => {
    // Kaliyuga epoch was Friday (index 5 in Sun=0..Sat=6)
    const wd = ((Math.floor(days) + 5) % 7 + 7) % 7;
    return VARA_LORDS[wd];
  };
  return {
    abdaLord: wdFromAhargana(yearStartDay),
    masaLord: wdFromAhargana(monthStartDay),
  };
}

export interface ShadbalaPlanet {
  id: PlanetId;
  sthana: { uchcha: number; saptavargaja: number; ojhayugma: number; kendradi: number; drekkana: number; total: number };
  dig: number;
  kala: {
    natonnata: number; paksha: number; tribhaga: number;
    abda: number; masa: number; vara: number; hora: number; ayana: number;
    total: number;
  };
  cheshta: number;
  naisargika: number;
  drik: number;
  totalVirupas: number;
  totalRupas: number;
  requiredRupas: number;
  ratioPct: number;
  ishtaPhala: number;
  kashtaPhala: number;
}

export interface BhavaBalaRow {
  house: number;
  sign: number;
  lord: PlanetId;
  bhavadhipatiBala: number;
  bhavaDigbala: number;
  bhavaDrishtiBala: number;
  totalVirupas: number;
  totalRupas: number;
  rank: number;
}

export interface VimsopakaRow {
  id: PlanetId;
  shadvarga: number;
  saptavarga: number;
  dashavarga: number;
  shodashavarga: number;
}

export function computeShadbala(chart: ComputedChart): ShadbalaPlanet[] {
  const { inp, jd, cu, pan } = chart;
  const lmtHour = (((inp.hh + inp.mi / 60 + inp.ss / 3600 - inp.tz + inp.lon / 15) % 24) + 24) % 24;
  const dn = Math.abs(lmtHour - 12);
  const dnn = Math.min(dn, 24 - dn);
  const el = ang(getRow(chart, 1).lon, getRow(chart, 0).lon);
  const pakVal = el / 3;

  // Tribhaga & Hora timing
  let segStart: number, segEnd: number, isDay: boolean;
  if (jd >= pan.sr && jd < pan.ss) {
    segStart = pan.sr; segEnd = pan.ss; isDay = true;
  } else if (jd >= pan.ss) {
    segStart = pan.ss; segEnd = pan.sn; isDay = false;
  } else {
    segStart = pan.ss - 1; segEnd = pan.sr; isDay = false;
  }
  const th = Math.min(2, Math.max(0, Math.floor((jd - segStart) / ((segEnd - segStart) / 3))));
  const tribLords = isDay ? [6, 0, 5] : [1, 8, 2];

  let refWd = pan.wd, refSr = pan.sr, refSs = pan.ss;
  if (jd < pan.sr) {
    refWd = (pan.wd + 6) % 7;
    refSr = pan.sr - 1;
    refSs = pan.ss - 1;
  }
  const dayLen = Math.max(0.1, refSs - refSr);
  const nightLen = Math.max(0.1, refSr + 1 - refSs);
  const horaIdx = jd < refSs
    ? Math.floor((jd - refSr) / (dayLen / 12))
    : 12 + Math.floor((jd - refSs) / (nightLen / 12));
  const horaLord = CH_ORDER[(CH_ORDER.indexOf(VARA_LORDS[refWd]) + Math.max(0, horaIdx)) % 7];
  const { abdaLord, masaLord } = abdaMasaLords(jd);

  // Compute BPHS Drik Bala between every target and source planet
  const calcAspectDrishti = (diff: number, src: PlanetId): number => {
    // diff = (targetLon - srcLon) mod 360 (0..360)
    let virupas = 0;
    if (diff >= 30 && diff < 60) virupas = (diff - 30) / 2;
    else if (diff >= 60 && diff < 90) virupas = 15 + (diff - 60);
    else if (diff >= 90 && diff < 120) virupas = 45 - (diff - 90) / 2;
    else if (diff >= 120 && diff < 150) virupas = 30 - (diff - 120);
    else if (diff >= 150 && diff < 180) virupas = (diff - 150) * 2;
    else if (diff >= 180 && diff < 300) virupas = 60 - (diff - 180) / 2;
    // Special aspect additions (Parashari)
    if (src === 5 && ((diff >= 60 && diff <= 90) || (diff >= 270 && diff <= 300))) virupas += 45;
    if (src === 2 && ((diff >= 90 && diff <= 120) || (diff >= 210 && diff <= 240))) virupas += 15;
    if (src === 4 && ((diff >= 120 && diff <= 150) || (diff >= 240 && diff <= 270))) virupas += 30;
    return Math.min(60, Math.max(0, virupas));
  };

  const sunLon = getRow(chart, 0).lon;
  const moonLon = getRow(chart, 1).lon;
  const isWaxingMoon = N(moonLon - sunLon) <= 180;
  const isNaturalBenefic = (id: PlanetId) =>
    id === 4 || id === 8 || id === 6 || (id === 1 && isWaxingMoon);

  return SEVEN.map((id) => {
    const x = getRow(chart, id);
    const uchcha = ang(x.lon, DEB_POINT[id]) / 3;
    const sv = saptaVargaja(id, chart);
    const even = (s: number) => s % 2 === 1;
    const oj = [1, 8].includes(id)
      ? (even(x.sign) ? 15 : 0) + (even(x.d9) ? 15 : 0)
      : (!even(x.sign) ? 15 : 0) + (!even(x.d9) ? 15 : 0);
    const kendradi = [1, 4, 7, 10].includes(x.house) ? 60 : [2, 5, 8, 11].includes(x.house) ? 30 : 15;
    const dk = Math.floor(x.degInSign / 10);
    const drekkana = ([0, 2, 4].includes(id) ? 0 : [6, 5].includes(id) ? 1 : 2) === dk ? 15 : 0;
    const sthanaTotal = uchcha + sv + oj + kendradi + drekkana;

    const dig = ang(x.lon, N(cu[DIG_HOUSE[id] - 1] + 180)) / 3;

    const natonnata = id === 6 ? 60 : [0, 4, 8].includes(id) ? (60 * (12 - dnn)) / 12 : (60 * dnn) / 12;
    const paksha = [1, 6, 4, 8].includes(id) ? pakVal : 60 - pakVal;
    const tribhaga = id === 4 ? 60 : tribLords[th] === id ? 60 : 0;
    const abda = abdaLord === id ? 15 : 0;
    const masa = masaLord === id ? 30 : 0;
    const vara = VARA_LORDS[pan.wd] === id ? 45 : 0;
    const hora = horaLord === id ? 60 : 0;

    const eq = eclipticToEquatorial(x.tropicalLon, x.lat, jd);
    let ayana = [1, 5].includes(id)
      ? ((24 - eq.dec) / 48) * 60
      : id === 6
        ? ((24 + Math.abs(eq.dec)) / 48) * 60
        : ((24 + eq.dec) / 48) * 60;
    if (id === 0) ayana *= 2;
    ayana = Math.max(0, Math.min(60, ayana));
    const kalaTotal = natonnata + paksha + tribhaga + abda + masa + vara + hora + ayana;

    // Cheshta Bala: Sun=Ayana, Moon=Paksha; Mars..Saturn derived from motional/synodic phase & retrogression
    let cheshta = 30;
    if (id === 0) {
      cheshta = Math.min(60, ayana);
    } else if (id === 1) {
      cheshta = paksha;
    } else {
      const ratio = x.spd / (MEAN_SPEED[id] || 1);
      if (x.retro) {
        cheshta = 60;
      } else if (Math.abs(x.spd) < 0.05) {
        cheshta = 15;
      } else if (ratio > 1.15) {
        cheshta = 45;
      } else {
        // Scaled between 15..52 via speed relative to Sun elongation for smooth motion curve
        const synodic = id === 6 || id === 8 ? ang(x.lon, sunLon) / 60 : ang(x.lon, sunLon) / 3;
        cheshta = Math.max(7.5, Math.min(55, (ratio * 25 + synodic) / 1.5));
      }
    }

    // Drik Bala (quarter of net benefic minus malefic aspects in virupas)
    let netDrik = 0;
    for (const src of SEVEN) {
      if (src === id) continue;
      const srcLon = getRow(chart, src).lon;
      const diff = N(x.lon - srcLon);
      const val = calcAspectDrishti(diff, src);
      netDrik += isNaturalBenefic(src) ? val / 4 : -val / 4;
    }

    const naisargika = NAISARGIKA[id];
    const totalVirupas = sthanaTotal + dig + kalaTotal + cheshta + naisargika + netDrik;
    const totalRupas = totalVirupas / 60;
    const requiredRupas = MIN_SHADBALA_RUPAS[id];
    const ratioPct = (totalRupas / requiredRupas) * 100;

    const ishtaPhala = Math.sqrt(Math.max(0, uchcha) * Math.max(0, cheshta));
    const kashtaPhala = Math.sqrt(Math.max(0, 60 - Math.min(60, uchcha)) * Math.max(0, 60 - Math.min(60, cheshta)));

    return {
      id,
      sthana: { uchcha, saptavargaja: sv, ojhayugma: oj, kendradi, drekkana, total: sthanaTotal },
      dig,
      kala: { natonnata, paksha, tribhaga, abda, masa, vara, hora, ayana, total: kalaTotal },
      cheshta,
      naisargika,
      drik: netDrik,
      totalVirupas,
      totalRupas,
      requiredRupas,
      ratioPct,
      ishtaPhala,
      kashtaPhala,
    };
  });
}

export function computeBhavaBala(chart: ComputedChart, shadbala: ShadbalaPlanet[]): BhavaBalaRow[] {
  const { cu, rows } = chart;
  const sunLon = getRow(chart, 0).lon;
  const moonLon = getRow(chart, 1).lon;
  const isWaxingMoon = N(moonLon - sunLon) <= 180;
  const isBen = (id: PlanetId) => id === 4 || id === 8 || id === 6 || (id === 1 && isWaxingMoon);

  // Bhava Digbala classification (BPHS): Nara (Gem, Vir, Lib, 1st half Sag, Aqu), Jalachara (Can, 2nd half Cap, Pis), Chatushpada (Ari, Tau, Leo, 2nd half Sag, 1st half Cap), Keeta (Sco)
  const signDigHouse = (sign: number, deg: number): number => {
    if ([2, 5, 6, 10].includes(sign) || (sign === 8 && deg < 15)) return 1; // Nara -> 1st
    if (sign === 3 || sign === 11 || (sign === 9 && deg >= 15)) return 4; // Jalachara -> 4th
    if (sign === 7) return 7; // Keeta -> 7th
    return 10; // Chatushpada -> 10th
  };

  const raw: Omit<BhavaBalaRow, 'rank'>[] = [];
  for (let h = 1; h <= 12; h++) {
    const cuspLon = cu[h - 1];
    const sign = Math.floor(cuspLon / 30);
    const deg = cuspLon % 30;
    const lord = SIGN_LORDS[sign];
    const lordSb = shadbala.find((s) => s.id === lord)?.totalVirupas ?? 300;
    const maxDigH = signDigHouse(sign, deg);
    const oppH = ((maxDigH + 5) % 12) + 1;
    const distHouses = Math.min(Math.abs(h - oppH), 12 - Math.abs(h - oppH));
    const bhavaDigbala = (distHouses / 6) * 60;

    let bhavaDrishtiBala = 0;
    for (const r of rows) {
      if (r.id === 3 || r.id === 7) continue;
      const diff = N(cuspLon - r.lon);
      let asp = 0;
      if (diff >= 165 && diff <= 195) asp = 60;
      else if (r.id === 4 && ((diff >= 105 && diff <= 135) || (diff >= 225 && diff <= 255))) asp = 60;
      else if (r.id === 2 && ((diff >= 75 && diff <= 105) || (diff >= 195 && diff <= 225))) asp = 60;
      else if (r.id === 5 && ((diff >= 45 && diff <= 75) || (diff >= 255 && diff <= 285))) asp = 60;
      if (asp > 0) {
        const w = r.id === 4 || r.id === 6 ? 1 : isBen(r.id) ? 0.25 : -0.25;
        bhavaDrishtiBala += asp * w;
      }
    }

    const totalVirupas = lordSb + bhavaDigbala + bhavaDrishtiBala;
    raw.push({
      house: h,
      sign,
      lord,
      bhavadhipatiBala: lordSb,
      bhavaDigbala,
      bhavaDrishtiBala,
      totalVirupas,
      totalRupas: totalVirupas / 60,
    });
  }

  const sorted = [...raw].sort((a, b) => b.totalVirupas - a.totalVirupas);
  return raw.map((item) => ({
    ...item,
    rank: sorted.findIndex((s) => s.house === item.house) + 1,
  }));
}

function vargaDignityScore(id: PlanetId, sign: number): number {
  if (EXA[id] === sign) return 20;
  if (EXA[id] !== undefined && (EXA[id] + 6) % 12 === sign) return 0;
  if (OWN[id]?.includes(sign)) return 20;
  const lord = SIGN_LORDS[sign];
  if (lord === id) return 20;
  if (NAT_FRIENDS[id]?.includes(lord)) return 15;
  if (NAT_ENEMIES[id]?.includes(lord)) return 5;
  return 10;
}

export function computeVimsopaka(chart: ComputedChart): VimsopakaRow[] {
  const shad: [number, number][] = [[1, 6], [2, 2], [3, 4], [9, 5], [12, 2], [30, 1]];
  const sapta: [number, number][] = [[1, 5], [2, 2], [3, 3], [7, 2.5], [9, 4.5], [12, 2], [30, 1]];
  const dasha: [number, number][] = [[1, 3], [2, 1.5], [3, 1.5], [7, 1.5], [9, 1.5], [10, 1.5], [12, 1.5], [16, 1.5], [30, 1.5], [60, 5]];
  const shodasha: [number, number][] = [
    [1, 3.5], [2, 1], [3, 1], [4, 0.5], [7, 0.5], [9, 3], [10, 0.5], [12, 0.5],
    [16, 2], [20, 0.5], [24, 0.5], [27, 0.5], [30, 1], [40, 0.5], [45, 0.5], [60, 4],
  ];
  const scoreScheme = (id: PlanetId, lon: number, scheme: [number, number][]) =>
    scheme.reduce((acc, [v, w]) => acc + vargaDignityScore(id, VG(lon, v)) * w, 0) / 20;

  return SEVEN.map((id) => {
    const lon = getRow(chart, id).lon;
    return {
      id,
      shadvarga: scoreScheme(id, lon, shad),
      saptavarga: scoreScheme(id, lon, sapta),
      dashavarga: scoreScheme(id, lon, dasha),
      shodashavarga: scoreScheme(id, lon, shodasha),
    };
  });
}

// Parashari Ashtakavarga Tables (houses counted from each source)
export const AVT: Record<number, Record<string, number[]>> = {
  0: { 0: [1, 2, 4, 7, 8, 9, 10, 11], 1: [3, 6, 10, 11], 2: [1, 2, 4, 7, 8, 9, 10, 11], 6: [3, 5, 6, 9, 10, 11, 12], 4: [5, 6, 9, 11], 8: [6, 7, 12], 5: [1, 2, 4, 7, 8, 9, 10, 11], L: [3, 4, 6, 10, 11, 12] },
  1: { 0: [3, 6, 7, 8, 10, 11], 1: [1, 3, 6, 7, 10, 11], 2: [2, 3, 5, 6, 9, 10, 11], 6: [1, 3, 4, 5, 7, 8, 10, 11], 4: [1, 4, 7, 8, 10, 11, 12], 8: [3, 4, 5, 7, 9, 10, 11], 5: [3, 5, 6, 11], L: [3, 6, 10, 11] },
  2: { 0: [3, 5, 6, 10, 11], 1: [3, 6, 11], 2: [1, 2, 4, 7, 8, 10, 11], 6: [3, 5, 6, 11], 4: [6, 10, 11, 12], 8: [6, 8, 11, 12], 5: [1, 4, 7, 8, 9, 10, 11], L: [1, 3, 6, 10, 11] },
  6: { 0: [5, 6, 9, 11, 12], 1: [2, 4, 6, 8, 10, 11], 2: [1, 2, 4, 7, 8, 9, 10, 11], 6: [1, 3, 5, 6, 9, 10, 11, 12], 4: [6, 8, 11, 12], 8: [1, 2, 3, 4, 5, 8, 9, 11], 5: [1, 2, 4, 7, 8, 9, 10, 11], L: [1, 2, 4, 6, 8, 10, 11] },
  4: { 0: [1, 2, 3, 4, 7, 8, 9, 10, 11], 1: [2, 5, 7, 9, 11], 2: [1, 2, 4, 7, 8, 10, 11], 6: [1, 2, 4, 5, 6, 9, 10, 11], 4: [1, 2, 3, 4, 7, 8, 10, 11], 8: [2, 5, 6, 9, 10, 11], 5: [3, 5, 6, 12], L: [1, 2, 4, 5, 6, 7, 9, 10, 11] },
  8: { 0: [8, 11, 12], 1: [1, 2, 3, 4, 5, 8, 9, 11, 12], 2: [3, 5, 6, 9, 11, 12], 6: [3, 5, 6, 9, 11], 4: [5, 8, 9, 10, 11], 8: [1, 2, 3, 4, 5, 8, 9, 10, 11], 5: [3, 4, 5, 8, 9, 10, 11], L: [1, 2, 3, 4, 5, 8, 9, 11] },
  5: { 0: [1, 2, 4, 7, 8, 10, 11], 1: [3, 6, 11], 2: [3, 5, 6, 10, 11, 12], 6: [6, 8, 9, 10, 11, 12], 4: [5, 6, 11, 12], 8: [6, 11, 12], 5: [3, 5, 6, 11], L: [1, 3, 4, 6, 10, 11] },
};

const RASHI_GUNA = [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12];
const GRAHA_GUNA: Record<number, number> = { 0: 5, 1: 5, 2: 8, 6: 5, 4: 10, 8: 7, 5: 5 };

function trikonaShodhana(arr: number[]): number[] {
  const out = arr.slice();
  for (let start = 0; start < 4; start++) {
    const idxs = [start, start + 4, start + 8];
    const min = Math.min(...idxs.map((i) => out[i]));
    if (min > 0) {
      for (const i of idxs) out[i] -= min;
    }
  }
  return out;
}

function ekadhipatyaShodhana(arr: number[], signs: number[]): number[] {
  const out = arr.slice();
  const occCount = Array(12).fill(0);
  for (const p of SEVEN) occCount[signs[p]]++;
  const pairs: [number, number][] = [[0, 7], [1, 6], [2, 5], [8, 11], [9, 10]]; // Mars, Venus, Mercury, Jupiter, Saturn dual signs
  for (const [a, b] of pairs) {
    const va = out[a], vb = out[b];
    if (va === 0 || vb === 0) continue;
    const oa = occCount[a] > 0, ob = occCount[b] > 0;
    if (oa && ob) continue; // Both occupied -> no reduction
    if (!oa && !ob) {
      if (va === vb) { out[a] = 0; out[b] = 0; }
      else { const m = Math.min(va, vb); out[a] = m; out[b] = m; }
    } else if (oa && !ob) {
      if (vb < va) out[b] = 0;
      else out[b] = va;
    } else if (!oa && ob) {
      if (va < vb) out[a] = 0;
      else out[a] = vb;
    }
  }
  return out;
}

export function ashtaka(s: number[], lagS: number): AshtakavargaResult {
  const src: Record<string, number> = { ...Object.fromEntries(SEVEN.map((i) => [String(i), s[i]])), L: lagS };
  const bav: Record<number, number[]> = {};
  const trikonaBav: Record<number, number[]> = {};
  const ekadhipatyaBav: Record<number, number[]> = {};
  const rashiPinda: Record<number, number> = {};
  const grahaPinda: Record<number, number> = {};
  const sodhyaPinda: Record<number, number> = {};

  for (const p of SEVEN) {
    bav[p] = Array(12).fill(0);
    for (const c in AVT[p]) {
      for (let z = 0; z < 12; z++) {
        if (AVT[p][c].includes(((z - src[c]) % 12 + 12) % 12 + 1)) bav[p][z]++;
      }
    }
    trikonaBav[p] = trikonaShodhana(bav[p]);
    ekadhipatyaBav[p] = ekadhipatyaShodhana(trikonaBav[p], s);
    let rp = 0;
    for (let z = 0; z < 12; z++) rp += ekadhipatyaBav[p][z] * RASHI_GUNA[z];
    let gp = 0;
    for (const q of SEVEN) gp += ekadhipatyaBav[p][s[q]] * GRAHA_GUNA[q];
    rashiPinda[p] = rp;
    grahaPinda[p] = gp;
    sodhyaPinda[p] = rp + gp;
  }

  const sav = Array(12).fill(0);
  for (const p of SEVEN) {
    bav[p].forEach((v, z) => { sav[z] += v; });
  }
  return { bav, sav, trikonaBav, ekadhipatyaBav, rashiPinda, grahaPinda, sodhyaPinda };
}
