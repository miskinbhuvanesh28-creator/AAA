import {
  EXA,
  KARANA_EN,
  KARANA_TE,
  MTR,
  NAK_NAMES as _NAK_NAMES,
  NAT_ENEMIES,
  NAT_FRIENDS,
  NITYA_YOGA_EN,
  NITYA_YOGA_TE,
  ORDER,
  OWN,
  PLANET_NAMES as _PLANET_NAMES,
  SEVEN,
  SIGN_LORDS,
  SIGN_NAMES as _SIGN_NAMES,
  TITHI_EN,
  TITHI_TE,
} from './constants.ts';
import {
  AYM,
  CU,
  Jd,
  N,
  P,
  dayInfo,
  eclipticToEquatorial,
  houseForLon,
  kpSub,
  outerPlanets,
  planetLatitude,
  signedDiff,
  tropicalPlanets,
} from './ephemeris.ts';
import { computeTransitReport } from './gocharaVarshaRect.ts';
import { ashtaka, type BhavaBalaRow, type ShadbalaPlanet } from './strength.ts';
import type {
  BirthInput,
  CalcConfig,
  ComputedChart,
  DignityKey,
  KpData,
  OuterPlanetKey,
  OuterPlanetRow,
  PanchangSummary,
  PlanetId,
  PlanetRow,
} from './types.ts';
import { VG } from './vargas.ts';
import { evaluateYogas } from './yogasNakshatra.ts';

export const DEFAULT_CONFIG: CalcConfig = {
  ay: 1,
  sidereal: true,
  houseSystem: 'placidus',
  nodeType: 'mean',
  kpMode: 'new',
  karakaMode: '7',
  calendarSystem: 'amanta',
};

const COMBUST_ORB: Record<number, number> = { 1: 12, 2: 17, 6: 14, 4: 11, 8: 10, 5: 15 };
const COMBUST_RETRO_ORB: Record<number, number> = { 6: 12, 8: 8 };

const PAN_LABEL_TE: Record<string, { label: string; key: DignityKey }> = {
  FT: { label: 'అధిమిత్ర', key: 'adhimitra' },
  NT: { label: 'మిత్ర', key: 'mitra' },
  FE: { label: 'సమ', key: 'sama' },
  NE: { label: 'శత్రు', key: 'shatru' },
  ET: { label: 'సమ', key: 'sama' },
  EE: { label: 'అధిశత్రు', key: 'adhishatru' },
};

export function dignityInfo(id: PlanetId, lon: number, signs: number[]): { label: string; key: DignityKey } {
  if (!(id in EXA)) return { label: '—', key: 'none' };
  const s = Math.floor(lon / 30);
  const d = lon % 30;
  if (EXA[id] === s) return { label: 'ఉచ్చ', key: 'exalted' };
  if ((EXA[id] + 6) % 12 === s) return { label: 'నీచ', key: 'debilitated' };
  const m = MTR[id];
  if (m && m[0] === s && d >= m[1] && d < m[2]) return { label: 'మూలత్రికోణ', key: 'moolatrikona' };
  if (OWN[id]?.includes(s)) return { label: 'స్వక్షేత్ర', key: 'own' };
  const lord = SIGN_LORDS[s];
  if (lord === id || !(lord in EXA)) return { label: '—', key: 'none' };
  const nat = NAT_FRIENDS[id]?.includes(lord) ? 'F' : NAT_ENEMIES[id]?.includes(lord) ? 'E' : 'N';
  const temp = [2, 3, 4, 10, 11, 12].includes(((signs[lord] - s + 12) % 12) + 1) ? 'T' : 'E';
  return PAN_LABEL_TE[nat + temp] || { label: 'సమ', key: 'sama' };
}

export function arudhaSign(houseZeroIdx: number, signs: number[]): number {
  const lord = SIGN_LORDS[houseZeroIdx];
  const d = (signs[lord] - houseZeroIdx + 12) % 12;
  let a = (signs[lord] + d) % 12;
  if (a === houseZeroIdx || a === (houseZeroIdx + 6) % 12) a = (a + 9) % 12;
  return a;
}

export function computeKarakas(p: number[], mode: '7' | '8' = '7') {
  const names7 = [
    ['ఆత్మకారక (AK)', 'Atmakaraka (AK)'],
    ['అమాత్యకారక (AmK)', 'Amatyakaraka (AmK)'],
    ['భ్రాతృకారక (BK)', 'Bhratrukaraka (BK)'],
    ['మాతృకారక (MK)', 'Matrukaraka (MK)'],
    ['పుత్రకారక (PK)', 'Putrakaraka (PK)'],
    ['జ్ఞాతికారక (GK)', 'Gnatikaraka (GK)'],
    ['దారకారక (DK)', 'Darakaraka (DK)'],
  ];
  const names8 = [
    ['ఆత్మకారక (AK)', 'Atmakaraka (AK)'],
    ['అమాత్యకారక (AmK)', 'Amatyakaraka (AmK)'],
    ['భ్రాతృకారక (BK)', 'Bhratrukaraka (BK)'],
    ['మాతృకారక (MK)', 'Matrukaraka (MK)'],
    ['పితృకారక (PiK)', 'Pitrukaraka (PiK)'],
    ['పుత్రకారక (PK)', 'Putrakaraka (PK)'],
    ['జ్ఞాతికారక (GK)', 'Gnatikaraka (GK)'],
    ['దారకారక (DK)', 'Darakaraka (DK)'],
  ];
  if (mode === '8') {
    const items = [...SEVEN.map((i) => ({ id: i, deg: p[i] % 30 })), { id: 3 as PlanetId, deg: 30 - (p[3] % 30) }]
      .sort((a, b) => b.deg - a.deg);
    return names8.map(([role, roleEn], idx) => ({ role, roleEn, planet: items[idx].id, deg: items[idx].deg }));
  }
  const items = SEVEN.map((i) => ({ id: i, deg: p[i] % 30 })).sort((a, b) => b.deg - a.deg);
  return names7.map(([role, roleEn], idx) => ({ role, roleEn, planet: items[idx].id, deg: items[idx].deg }));
}

export function computeKp(p: number[], cu: number[]): KpData {
  const own = (h: number): PlanetId => SIGN_LORDS[Math.floor(cu[h - 1] / 30)];
  const house = {} as Record<PlanetId, number>;
  for (const i of ORDER) house[i] = houseForLon(p[i], cu);

  const cuspSubs = cu.map((lon, idx) => {
    const [starLord, subLord, subSubLord] = kpSub(lon);
    return { house: idx + 1, lon, sign: Math.floor(lon / 30), starLord, subLord, subSubLord };
  });

  // 4-fold KP Significators:
  // Level A: Planets in Star of Occupants of H
  // Level B: Occupants of H
  // Level C: Planets in Star of Owner of H
  // Level D: Owner of H
  const sig = {} as Record<PlanetId, number[]>;
  for (const i of ORDER) {
    const st = kpSub(p[i])[0];
    const set = new Set<number>([house[st], house[i]]);
    for (let h = 1; h <= 12; h++) {
      const l = own(h);
      if (l === st || l === i) set.add(h);
    }
    sig[i] = [...set].sort((a, b) => a - b);
  }

  const cuspSig: Record<number, PlanetId[]> = {};
  for (let h = 1; h <= 12; h++) {
    const occupants = ORDER.filter((id) => house[id] === h);
    const owner = own(h);
    const ordered: PlanetId[] = [];
    const pushUnique = (id: PlanetId) => {
      if (!ordered.includes(id)) ordered.push(id);
    };
    for (const occ of occupants) {
      for (const pl of ORDER) {
        if (kpSub(p[pl])[0] === occ) pushUnique(pl);
      }
    }
    for (const occ of occupants) pushUnique(occ);
    for (const pl of ORDER) {
      if (kpSub(p[pl])[0] === owner) pushUnique(pl);
    }
    pushUnique(owner);
    cuspSig[h] = ordered;
  }

  return { cusps: cu, cuspSubs, house, sig, cuspSig };
}

export function computePanchang(p: number[], jd: number, lat: number, lon: number, tz: number): PanchangSummary {
  const el = N(p[1] - p[0]);
  const t = Math.floor(el / 12);
  const tithiPct = ((el % 12) / 12) * 100;
  const k = Math.floor(el / 6);
  const yogaAngle = N(p[0] + p[1]);
  const yo = Math.floor(yogaAngle / (40 / 3));
  const yogaPct = ((yogaAngle % (40 / 3)) / (40 / 3)) * 100;
  const nk = Math.floor(p[1] / (40 / 3));
  const nkPct = ((p[1] % (40 / 3)) / (40 / 3)) * 100;

  const di = dayInfo(jd, lat, lon, tz);
  const wd = new Date((jd - 2440587.5) * 864e5 + tz * 36e5).getUTCDay();
  const RK = [8, 2, 7, 5, 6, 4, 3];
  const YM = [5, 4, 3, 2, 1, 7, 6];
  const GL = [7, 6, 5, 4, 3, 2, 1];
  const seg = (i: number): [number, number] => [di.sr + ((i - 1) * (di.ss - di.sr)) / 8, di.sr + (i * (di.ss - di.sr)) / 8];
  const abhijit: [number, number] = [di.sr + (7 * (di.ss - di.sr)) / 15, di.sr + (8 * (di.ss - di.sr)) / 15];

  const tithiTe = t < 15 ? TITHI_TE[t] : t === 29 ? 'అమావాస్య' : TITHI_TE[t - 15];
  const tithiEn = t < 15 ? TITHI_EN[t] : t === 29 ? 'Amavasya' : TITHI_EN[t - 15];
  const karanaTe = k === 0 ? 'కింస్తుఘ్న' : k < 57 ? KARANA_TE[(k - 1) % 7] : ['శకుని', 'చతుష్పాద', 'నాగవ'][k - 57];
  const karanaEn = k === 0 ? 'Kimstughna' : k < 57 ? KARANA_EN[(k - 1) % 7] : ['Shakuni', 'Chatushpada', 'Nagava'][k - 57];

  return {
    tithi: tithiTe,
    tithiEn,
    paksha: t < 15 ? 'శుక్ల' : 'కృష్ణ',
    pakshaEn: t < 15 ? 'Shukla' : 'Krishna',
    tn: t + 1,
    tithiPct,
    yoga: NITYA_YOGA_TE[yo],
    yogaEn: NITYA_YOGA_EN[yo],
    yogaIndex: yo,
    yogaPct,
    karana: karanaTe,
    karanaEn,
    karanaIndex: k,
    nk,
    nkPct,
    wd,
    sr: di.sr,
    ss: di.ss,
    sn: di.sn,
    rahu: seg(RK[wd]),
    yama: seg(YM[wd]),
    gulika: seg(GL[wd]),
    abhijit,
  };
}

export function computeChart(inp: BirthInput, partialConfig?: Partial<CalcConfig>): ComputedChart {
  const ayIndex = partialConfig?.ay ?? inp.ay ?? 1;
  const config: CalcConfig = {
    ...DEFAULT_CONFIG,
    ...partialConfig,
    ay: partialConfig?.kpMode === 'old' && partialConfig?.ay === undefined ? 5 : ayIndex,
  };
  const { y, m, d, hh, mi, ss, lat, lon, tz } = inp;
  const jd = Jd(y, m, d, hh + mi / 60 + ss / 3600 - tz);
  const T = (jd - 2451545) / 36525;
  const ayVal = AYM(T, config.ay);
  const ay = config.sidereal ? ayVal : 0;
  const useTrue = config.nodeType === 'true';

  const p = P(jd, config.ay, config.sidereal, useTrue);
  const ptrop = tropicalPlanets(jd, useTrue);
  const p1 = P(jd + 0.5, config.ay, config.sidereal, useTrue);
  const p0 = P(jd - 0.5, config.ay, config.sidereal, useTrue);
  const spd = p.map((_, i) => signedDiff(p1[i], p0[i]));

  const placidusCu = CU(jd, lat, lon, config.ay, config.sidereal, 'placidus');
  const cu = CU(jd, lat, lon, config.ay, config.sidereal, config.houseSystem);

  const s = p.map((x) => Math.floor(x / 30));
  const lagS = Math.floor(cu[0] / 30);
  const kp = computeKp(p, cu);
  const sunLon = p[0];

  const rows: PlanetRow[] = ORDER.map((i) => {
    const lonVal = p[i];
    const tropVal = ptrop[i];
    const latDeg = planetLatitude(i, jd);
    const eq = eclipticToEquatorial(tropVal, latDeg, jd);
    const retro = i === 3 || i === 7 || (i > 1 && spd[i] < 0);
    const stationary = i > 1 && i !== 3 && i !== 7 && Math.abs(spd[i]) < 0.05;
    const orb = i === 0 || i === 3 || i === 7 ? null : Math.abs(signedDiff(lonVal, sunLon));
    const limit = retro && COMBUST_RETRO_ORB[i] ? COMBUST_RETRO_ORB[i] : COMBUST_ORB[i];
    const combust = orb !== null && limit !== undefined && orb <= limit;
    const dig = dignityInfo(i, lonVal, s);
    const d9 = VG(lonVal, 9);

    return {
      id: i,
      lon: lonVal,
      tropicalLon: tropVal,
      lat: latDeg,
      dec: eq.dec,
      ra: eq.ra,
      sign: s[i],
      degInSign: lonVal % 30,
      nk: Math.floor(lonVal / (40 / 3)),
      pada: Math.floor((lonVal % (40 / 3)) / (10 / 3)) + 1,
      sub: kpSub(lonVal),
      house: ((s[i] - lagS + 12) % 12) + 1,
      bhava: kp.house[i],
      placidusHouse: houseForLon(lonVal, placidusCu),
      spd: spd[i],
      retro,
      stationary,
      combust,
      combustOrb: orb,
      dig: dig.label,
      digKey: dig.key,
      d9,
      vgt: d9 === s[i],
    };
  });

  const opNow = outerPlanets(jd, config.ay, config.sidereal);
  const op1 = outerPlanets(jd + 0.5, config.ay, config.sidereal);
  const op0 = outerPlanets(jd - 0.5, config.ay, config.sidereal);
  const outerMeta: Record<OuterPlanetKey, { en: string; te: string }> = {
    Ur: { en: 'Uranus', te: 'యురేనస్ (ఇంద్ర)' },
    Ne: { en: 'Neptune', te: 'నెప్ట్యూన్ (వరుణ)' },
    Pl: { en: 'Pluto', te: 'ప్లూటో (యమ)' },
  };
  const outerPlanetRows: OuterPlanetRow[] = (['Ur', 'Ne', 'Pl'] as OuterPlanetKey[]).map((key) => {
    const l = opNow[key].sidereal;
    const sp = signedDiff(op1[key].sidereal, op0[key].sidereal);
    const sg = Math.floor(l / 30);
    return {
      key,
      nameEn: outerMeta[key].en,
      nameTe: outerMeta[key].te,
      lon: l,
      tropicalLon: opNow[key].tropical,
      sign: sg,
      degInSign: l % 30,
      house: ((sg - lagS + 12) % 12) + 1,
      bhava: houseForLon(l, cu),
      spd: sp,
      retro: sp < 0,
    };
  });

  const arudhas: Record<number, number> = {};
  for (let h = 1; h <= 12; h++) arudhas[h] = arudhaSign((lagS + h - 1) % 12, s);

  return {
    inp,
    config,
    jd,
    T,
    ay,
    ayVal,
    p,
    ptrop,
    cu,
    placidusCu,
    s,
    lagS,
    lag: cu[0],
    mc: placidusCu[9],
    rows,
    outerPlanets: outerPlanetRows,
    kp,
    spd,
    asht: ashtaka(s, lagS),
    yogas: evaluateYogas(p, lagS),
    karakas: computeKarakas(p, config.karakaMode),
    AL: arudhas[1],
    UL: arudhas[12],
    arudhas,
    pan: computePanchang(p, jd, lat, lon, tz),
    t0: (jd - 2440587.5) * 864e5,
  };
}

// Functional nature by Lagna (classical Parashari rulership)
export function getFunctionalNature(lagS: number) {
  const L = (h: number) => SIGN_LORDS[(lagS + h - 1) % 12];
  const map: Record<number, { houses: number[]; role: 'Yogakaraka' | 'Benefic' | 'Malefic' | 'Neutral' | 'Maraka'; badhaka: boolean }> = {};
  const badhakaHouse = lagS % 3 === 0 ? 11 : lagS % 3 === 1 ? 9 : 7;
  const badhakaLord = L(badhakaHouse);

  for (const id of SEVEN) {
    const houses: number[] = [];
    for (let h = 1; h <= 12; h++) if (L(h) === id) houses.push(h);
    const hasKendra = houses.some((h) => [4, 7, 10].includes(h));
    const hasTrikona = houses.some((h) => [1, 5, 9].includes(h));
    const hasDusthana = houses.some((h) => [3, 6, 8, 11].includes(h));
    const isMaraka = houses.some((h) => [2, 7].includes(h)) && !houses.includes(1);
    let role: 'Yogakaraka' | 'Benefic' | 'Malefic' | 'Neutral' | 'Maraka' = 'Neutral';
    if (hasKendra && houses.some((h) => [5, 9].includes(h))) role = 'Yogakaraka';
    else if (hasTrikona && !hasDusthana) role = 'Benefic';
    else if (hasDusthana && !hasTrikona) role = 'Malefic';
    else if (isMaraka) role = 'Maraka';
    map[id] = { houses, role, badhaka: id === badhakaLord };
  }
  return { byPlanet: map, badhakaHouse, badhakaLord, badhakaSign: (lagS + badhakaHouse - 1) % 12 };
}

// Planetary & Rashi Drishti + Argala helpers
export function computeAspectMatrix(chart: ComputedChart) {
  const s = chart.s;
  const grahaAspects: { from: PlanetId; toHouse: number; toSign: number; planetsHit: PlanetId[]; strength: string }[] = [];
  for (const id of ORDER) {
    const base = s[id];
    const offsets = id === 2 ? [3, 6, 7] : id === 4 ? [4, 6, 8] : id === 5 ? [2, 6, 9] : id === 3 || id === 7 ? [4, 6, 8] : [6];
    for (const off of offsets) {
      const targetSign = (base + off) % 12;
      const toHouse = ((targetSign - chart.lagS + 12) % 12) + 1;
      const planetsHit = ORDER.filter((q) => q !== id && s[q] === targetSign);
      grahaAspects.push({ from: id, toHouse, toSign: targetSign, planetsHit, strength: '100%' });
    }
  }
  return grahaAspects;
}


export function computeAvasthas(chart: ComputedChart) {
  const SHAYANADI_TE = [
    'శయన', 'ఉపవేశన', 'నేత్రపాణి', 'ప్రకాశ', 'గమన', 'ఆగమన',
    'సభా', 'ఆగమ', 'భోజన', 'నృత్యలిప్స', 'కౌతుక', 'నిద్ర',
  ];
  const SHAYANADI_EN = [
    'Shayana (Resting)', 'Upaveshana (Sitting)', 'Netrapani (Observing)', 'Prakasha (Shining)',
    'Gamana (Moving)', 'Aagamana (Returning)', 'Sabha (In Assembly)', 'Aagama (Acquiring)',
    'Bhojana (Enjoying)', 'Nrityalipsa (Expressive)', 'Kautuka (Eager)', 'Nidra (Dormant)',
  ];
  const pOrderNum: Record<number, number> = { 0: 1, 1: 2, 2: 3, 6: 4, 4: 5, 8: 6, 5: 7, 3: 8, 7: 9 };
  const sunLon = chart.p[0];
  const isWaxingMoon = N(chart.p[1] - sunLon) <= 180;
  const isMalefic = (id: PlanetId) => id === 0 || id === 2 || id === 5 || id === 3 || id === 7 || (id === 1 && !isWaxingMoon);

  return chart.rows.map((p) => {
    const d = p.degInSign;
    const odd = p.sign % 2 === 0;
    const baladi = odd
      ? d < 6 ? 'Bala (బాల)' : d < 12 ? 'Kumara (కుమార)' : d < 18 ? 'Yuva (యువ)' : d < 24 ? 'Vriddha (వృద్ధ)' : 'Mrita (మృత)'
      : d < 6 ? 'Mrita (మృత)' : d < 12 ? 'Vriddha (వృద్ధ)' : d < 18 ? 'Yuva (యువ)' : d < 24 ? 'Kumara (కుమార)' : 'Bala (బాల)';
    const baladiTe = odd
      ? d < 6 ? 'బాల' : d < 12 ? 'కుమార' : d < 18 ? 'యువ' : d < 24 ? 'వృద్ధ' : 'మృత'
      : d < 6 ? 'మృత' : d < 12 ? 'వృద్ధ' : d < 18 ? 'యువ' : d < 24 ? 'కుమార' : 'బాల';

    const deeptadi =
      p.digKey === 'exalted' ? 'Deepta' : p.digKey === 'own' || p.digKey === 'moolatrikona' ? 'Swastha' : p.digKey === 'debilitated' ? 'Vikala' : p.digKey === 'adhimitra' || p.digKey === 'mitra' ? 'Mudita' : p.digKey === 'shatru' || p.digKey === 'adhishatru' ? 'Deena' : 'Shanta';
    const deeptadiTe =
      p.digKey === 'exalted' ? 'దీప్త' : p.digKey === 'own' || p.digKey === 'moolatrikona' ? 'స్వస్థ' : p.digKey === 'debilitated' ? 'వికల' : p.digKey === 'adhimitra' || p.digKey === 'mitra' ? 'ముదిత' : p.digKey === 'shatru' || p.digKey === 'adhishatru' ? 'దీన' : 'శాంత';

    const jagradadi = ['exalted', 'own', 'moolatrikona'].includes(p.digKey)
      ? 'Jagrat (Awake)'
      : p.digKey === 'adhimitra' || p.digKey === 'mitra'
        ? 'Swapna (Dreaming)'
        : 'Sushupti (Asleep)';
    const jagradadiTe = ['exalted', 'own', 'moolatrikona'].includes(p.digKey)
      ? 'జాగ్రత్'
      : p.digKey === 'adhimitra' || p.digKey === 'mitra'
        ? 'స్వప్న'
        : 'సుషుప్తి';

    // Lajjitadi Avastha (BPHS Chapter 45)
    const conjunctWith = chart.rows.filter((q) => q.id !== p.id && q.sign === p.sign);
    const hasMalConj = conjunctWith.some((q) => isMalefic(q.id));
    const hasBenConj = conjunctWith.some((q) => !isMalefic(q.id));
    let lajjitadiEn = 'Mudita (Contented)';
    let lajjitadiTe = 'ముదిత';
    if (p.house === 5 && conjunctWith.some((q) => q.id === 3 || q.id === 7 || q.id === 5 || q.id === 0 || q.id === 2)) {
      lajjitadiEn = 'Lajjita (Humiliated)';
      lajjitadiTe = 'లజ్జిత';
    } else if (p.digKey === 'exalted' || p.digKey === 'moolatrikona') {
      lajjitadiEn = 'Garvita (Proud / Exalted)';
      lajjitadiTe = 'గర్విత';
    } else if (p.digKey === 'shatru' || p.digKey === 'adhishatru' || p.digKey === 'debilitated') {
      lajjitadiEn = hasMalConj ? 'Kshobhita (Agitated)' : 'Kshudhita (Deprived)';
      lajjitadiTe = hasMalConj ? 'క్షోభిత' : 'క్షుధిత';
    } else if ([3, 7, 11].includes(p.sign) && hasMalConj) {
      lajjitadiEn = 'Trishita (Thirsty / Strained)';
      lajjitadiTe = 'తృషిత';
    } else if (hasBenConj || p.digKey === 'adhimitra' || p.digKey === 'mitra' || p.digKey === 'own') {
      lajjitadiEn = 'Mudita (Delighted)';
      lajjitadiTe = 'ముదిత';
    } else {
      lajjitadiEn = 'Shanta / Neutral';
      lajjitadiTe = 'శాంత';
    }

    // Shayanadi Avastha (BPHS): ((Nakshatra * PlanetIndex * Navamsha) + MoonNk + JanmaGhati + LagnaSign) mod 12
    const nk1 = p.nk + 1;
    const pIdx = pOrderNum[p.id] || 1;
    const moonNk = chart.pan.nk + 1;
    const lag1 = chart.lagS + 1;
    const ghati = Math.max(1, Math.round((((chart.jd - chart.pan.sr + 1) % 1) * 60)));
    const shIdx = ((((nk1 * pIdx * (p.d9 + 1)) + moonNk + ghati + lag1) - 1) % 12 + 12) % 12;

    return {
      id: p.id,
      baladi,
      baladiTe,
      deeptadi,
      deeptadiTe,
      jagradadi,
      jagradadiTe,
      lajjitadiEn,
      lajjitadiTe,
      shayanadiEn: SHAYANADI_EN[shIdx],
      shayanadiTe: SHAYANADI_TE[shIdx],
      combust: p.combust,
      retro: p.retro,
    };
  });
}

// Graha Yuddha (Planetary War among true planets Ma, Me, Ju, Ve, Sa within 1° ecliptic orb)
export interface GrahaYuddhaRow {
  p1: PlanetId;
  p2: PlanetId;
  diffDeg: number;
  winner: PlanetId;
  loser: PlanetId;
  winnerLat: number;
  loserLat: number;
  sign: number;
  house: number;
  noteTe: string;
  noteEn: string;
}

export function computeGrahaYuddha(chart: ComputedChart): GrahaYuddhaRow[] {
  const warIds: PlanetId[] = [2, 6, 4, 8, 5]; // Ma, Me, Ju, Ve, Sa
  const wars: GrahaYuddhaRow[] = [];
  for (let i = 0; i < warIds.length; i++) {
    for (let j = i + 1; j < warIds.length; j++) {
      const r1 = chart.rows.find((r) => r.id === warIds[i])!;
      const r2 = chart.rows.find((r) => r.id === warIds[j])!;
      const diff = Math.abs(signedDiff(r1.lon, r2.lon));
      if (diff <= 1.0) {
        // Northernmost ecliptic latitude wins in classical Surya Siddhanta / BPHS convention
        const p1Wins = r1.lat >= r2.lat;
        const winner = p1Wins ? r1 : r2;
        const loser = p1Wins ? r2 : r1;
        wars.push({
          p1: r1.id,
          p2: r2.id,
          diffDeg: diff,
          winner: winner.id,
          loser: loser.id,
          winnerLat: winner.lat,
          loserLat: loser.lat,
          sign: r1.sign,
          house: r1.house,
          noteTe: `${_PLANET_NAMES.te[winner.id]} (అక్షాంశం ${winner.lat.toFixed(2)}°) విజేత; ${_PLANET_NAMES.te[loser.id]} (${loser.lat.toFixed(2)}°) ఓటమి`,
          noteEn: `${_PLANET_NAMES.en[winner.id]} (lat ${winner.lat.toFixed(2)}°) wins over ${_PLANET_NAMES.en[loser.id]} (lat ${loser.lat.toFixed(2)}°)`,
        });
      }
    }
  }
  return wars;
}

// Pushkara Navamsha, Pushkara Bhaga, Gandanta, Mrityu Bhaga, Upagrahas
const MRITYU_BHAGA = [
  [20, 9, 12, 6, 8, 24, 16, 17, 22, 2, 3, 23],
  [8, 25, 22, 22, 21, 1, 4, 23, 18, 20, 20, 10],
  [19, 28, 25, 23, 29, 28, 14, 21, 2, 15, 11, 6],
  [15, 14, 13, 12, 8, 18, 20, 10, 21, 22, 7, 5],
  [19, 29, 12, 27, 6, 4, 13, 10, 17, 11, 15, 28],
  [28, 15, 11, 17, 10, 13, 4, 6, 27, 12, 29, 19],
  [10, 4, 7, 9, 12, 16, 3, 18, 28, 14, 13, 15],
  [14, 13, 12, 11, 24, 23, 22, 21, 10, 20, 18, 8],
  [8, 18, 20, 10, 21, 22, 23, 24, 11, 12, 13, 14],
];
const PUSHKARA_BHAGA = [21, 14, 18, 8, 19, 9, 24, 11, 23, 14, 19, 9];

export function computeSpecialPointsAndUpagrahas(chart: ComputedChart) {
  const mbIds = [0, 1, 2, 6, 4, 8, 5, 3, 7];
  const points = chart.rows.map((p) => {
    const navIdx = Math.floor(p.degInSign / (30 / 9)) + 1;
    const elem = p.sign % 4;
    const pushPair = elem === 0 ? [7, 9] : elem === 1 ? [3, 5] : elem === 2 ? [6, 8] : [1, 3];
    const isPushkaraNav = pushPair.includes(navIdx);
    const pbDeg = PUSHKARA_BHAGA[p.sign];
    const isPushkaraBhaga = Math.abs(p.degInSign - pbDeg) <= 1;
    const isGandanta = [120, 240, 360].some((edge) => Math.abs(signedDiff(p.lon, edge % 360)) <= 10 / 3);
    const isSandhi = p.degInSign < 1 || p.degInSign > 29;
    const mbDeg = MRITYU_BHAGA[mbIds.indexOf(p.id)][p.sign];
    const mbDiff = Math.abs(p.degInSign - mbDeg);
    return {
      id: p.id,
      lon: p.lon,
      sign: p.sign,
      isPushkaraNav,
      navIdx,
      isPushkaraBhaga,
      pbDeg,
      isGandanta,
      isSandhi,
      mbDeg,
      mbDiff,
      nearMrityuBhaga: mbDiff <= 1,
    };
  });

  // Aprakasha & Upagrahas
  const { inp, jd, pan } = chart;
  const next = dayInfo(jd + 1, inp.lat, inp.lon, inp.tz);
  const isDay = jd >= pan.sr && jd < pan.ss;
  const start = isDay ? pan.sr : pan.ss;
  const end = isDay ? pan.ss : next.sr;
  const span = (end - start) / 8;
  const week = [0, 1, 2, 6, 4, 8, 5];
  const nightStart = (pan.wd + 3) % 7;
  const seqStart = isDay ? pan.wd : nightStart;
  const timeLabels: [string, number][] = [
    ['Kala (కాల)', 0],
    ['Mrityu (మృత్యు)', 2],
    ['Ardhaprahara (అర్ధప్రహర)', 6],
    ['Yamaghanta (యమఘంట)', 4],
    ['Gulika (గులిక)', 5],
  ];
  const upagrahas = timeLabels.map(([name, pid]) => {
    const idx = ((week.indexOf(pid) - seqStart) % 7 + 7) % 7;
    const st = start + idx * span;
    const asc = CU(st, inp.lat, inp.lon, chart.config.ay, chart.config.sidereal, chart.config.houseSystem)[0];
    return { name, part: `${idx + 1}/8`, period: isDay ? 'Day' : 'Night', localTime: new Date((st - 2440587.5) * 864e5 + inp.tz * 36e5).toISOString().slice(11, 16), lon: asc, sign: Math.floor(asc / 30) };
  });

  const sunLon = chart.p[0];
  const dhuma = N(sunLon + 133 + 20 / 60);
  const vyatipata = N(360 - dhuma);
  const parivesha = N(vyatipata + 180);
  const indrachapa = N(360 - parivesha);
  const upaketu = N(indrachapa + 16 + 40 / 60);
  upagrahas.push(
    { name: 'Dhuma (ధూమ)', part: 'Sun+133°20′', period: 'Solar', localTime: '—', lon: dhuma, sign: Math.floor(dhuma / 30) },
    { name: 'Vyatipata (వ్యతీపాత)', part: '360°−Dhuma', period: 'Solar', localTime: '—', lon: vyatipata, sign: Math.floor(vyatipata / 30) },
    { name: 'Parivesha (పరివేష)', part: 'Vyatipata+180°', period: 'Solar', localTime: '—', lon: parivesha, sign: Math.floor(parivesha / 30) },
    { name: 'Indrachapa (ఇంద్రచాప)', part: '360°−Parivesha', period: 'Solar', localTime: '—', lon: indrachapa, sign: Math.floor(indrachapa / 30) },
    { name: 'Upaketu (ఉపకేతు)', part: 'Indrachapa+16°40′', period: 'Solar', localTime: '—', lon: upaketu, sign: Math.floor(upaketu / 30) },
  );

  return { points, upagrahas };
}

export function computeDispositorChains(chart: ComputedChart) {
  return ORDER.map((id) => {
    const chain: PlanetId[] = [id];
    let cur = id;
    for (let step = 0; step < 9; step++) {
      const sign = chart.s[cur];
      const lord = SIGN_LORDS[sign];
      if (chain.includes(lord)) {
        chain.push(lord);
        break;
      }
      chain.push(lord);
      cur = lord;
    }
    const last = chain[chain.length - 1];
    const isSelf = chain.length >= 2 && chain[chain.length - 2] === last;
    return { start: id, chain, finalDispositor: isSelf ? last : null, loop: !isSelf };
  });
}

export interface IntegratedFactor {
  pillarTe: string;
  pillarEn: string;
  summaryTe: string;
  summaryEn: string;
  polarity: 'supportive' | 'mixed' | 'caution';
}

export function computeIntegratedInterpretation(
  chart: ComputedChart,
  shadbala: ShadbalaPlanet[],
  bhavaBala: BhavaBalaRow[],
): {
  headlineTe: string;
  headlineEn: string;
  factors: IntegratedFactor[];
  caveatTe: string;
  caveatEn: string;
} {
  const fn = getFunctionalNature(chart.lagS);
  const lagLord = SIGN_LORDS[chart.lagS];
  const lagRow = chart.rows.find((r) => r.id === lagLord)!;
  const moonRow = chart.rows.find((r) => r.id === 1)!;
  const sunRow = chart.rows.find((r) => r.id === 0)!;
  const sortedSb = [...shadbala].sort((a, b) => b.ratioPct - a.ratioPct);
  const topPlanet = sortedSb[0];
  const lowPlanet = sortedSb[sortedSb.length - 1];
  const sortedBb = [...bhavaBala].sort((a, b) => a.rank - b.rank);
  const strongHouse = sortedBb[0];
  const weakHouse = sortedBb[sortedBb.length - 1];
  const activeYogas = chart.yogas.filter((y) => y.on && y.category !== 'dosha' && !y.cancelled);
  const activeDoshas = chart.yogas.filter((y) => y.on && y.category === 'dosha' && !y.cancelled);
  const wars = computeGrahaYuddha(chart);
  const transits = computeTransitReport(chart);
  const savBest = chart.asht.sav.map((v, i) => ({ sign: i, pts: v })).sort((a, b) => b.pts - a.pts)[0];

  const yogakarakaEntry = Object.entries(fn.byPlanet).find(([, v]) => v.role === 'Yogakaraka');
  const yogakarakaId = yogakarakaEntry ? (Number(yogakarakaEntry[0]) as PlanetId) : null;

  const factors: IntegratedFactor[] = [
    {
      pillarTe: 'లగ్నం & లగ్నాధిపతి స్థితి',
      pillarEn: 'Lagna & Lagna Lord Foundation',
      summaryTe: `${_SIGN_NAMES.te[chart.lagS]} లగ్నం; లగ్నాధిపతి ${_PLANET_NAMES.te[lagLord]} ${lagRow.house}వ భావంలో (${_SIGN_NAMES.te[lagRow.sign]}) ${lagRow.dig} స్థితిలో ఉన్నారు.`,
      summaryEn: `${_SIGN_NAMES.en[chart.lagS]} rising; Lagna lord ${_PLANET_NAMES.en[lagLord]} occupies House ${lagRow.house} (${_SIGN_NAMES.en[lagRow.sign]}) in ${lagRow.digKey} dignity.`,
      polarity: [1, 4, 5, 7, 9, 10, 11].includes(lagRow.house) || ['exalted', 'own', 'moolatrikona'].includes(lagRow.digKey) ? 'supportive' : 'mixed',
    },
    {
      pillarTe: 'చంద్ర రాశి & మనోబలం',
      pillarEn: 'Moon Sign & Nakshatra',
      summaryTe: `చంద్రుడు ${_SIGN_NAMES.te[moonRow.sign]} రాశి (${moonRow.house}వ భావం), ${_NAK_NAMES.te[moonRow.nk]} నక్షత్రం (${moonRow.pada}వ పాదం). సూర్యుడు ${sunRow.house}వ భావంలో.`,
      summaryEn: `Moon in ${_SIGN_NAMES.en[moonRow.sign]} (H${moonRow.house}), ${_NAK_NAMES.en[moonRow.nk]} Pada ${moonRow.pada}; Sun in H${sunRow.house}.`,
      polarity: [6, 8, 12].includes(moonRow.house) ? 'mixed' : 'supportive',
    },
    {
      pillarTe: 'షడ్బల & భావబల సారూప్యత',
      pillarEn: 'Shadbala & Bhava Bala Balance',
      summaryTe: `బలమైన గ్రహం: ${_PLANET_NAMES.te[topPlanet.id]} (${topPlanet.ratioPct.toFixed(0)}%); తక్కువ బలం: ${_PLANET_NAMES.te[lowPlanet.id]} (${lowPlanet.ratioPct.toFixed(0)}%). బలమైన భావం: H${strongHouse.house}, బలహీన భావం: H${weakHouse.house}.`,
      summaryEn: `Strongest: ${_PLANET_NAMES.en[topPlanet.id]} (${topPlanet.ratioPct.toFixed(0)}%); Weakest: ${_PLANET_NAMES.en[lowPlanet.id]} (${lowPlanet.ratioPct.toFixed(0)}%). Strongest House: H${strongHouse.house}, Weakest: H${weakHouse.house}.`,
      polarity: topPlanet.ratioPct >= 100 && lowPlanet.ratioPct >= 85 ? 'supportive' : 'mixed',
    },
    {
      pillarTe: 'యోగకారక & బాధక విశ్లేషణ',
      pillarEn: 'Functional Role & Yogas',
      summaryTe: `${yogakarakaId !== null ? `యోగకారకుడు: ${_PLANET_NAMES.te[yogakarakaId]}. ` : ''}క్రియాశీల యోగాలు: ${activeYogas.length}, క్రియాశీల దోషాలు: ${activeDoshas.length}. బాధకాధిపతి: ${_PLANET_NAMES.te[fn.badhakaLord]} (H${fn.badhakaHouse}).`,
      summaryEn: `${yogakarakaId !== null ? `Yogakaraka: ${_PLANET_NAMES.en[yogakarakaId]}. ` : ''}Active Yogas: ${activeYogas.length}, Active Doshas: ${activeDoshas.length}. Badhaka: ${_PLANET_NAMES.en[fn.badhakaLord]} (H${fn.badhakaHouse}).`,
      polarity: activeDoshas.length > activeYogas.length ? 'caution' : activeYogas.length >= 3 ? 'supportive' : 'mixed',
    },
    {
      pillarTe: 'గోచార ద్వంద్వ సంచారం & SAV',
      pillarEn: 'Double Transit & SAV Peak',
      summaryTe: `శని–గురు గోచార ద్వంద్వ ప్రభావం: ${transits.doubleTransitHouses.map((h) => `H${h}`).join(', ') || 'విస్తృతంగా'}. సర్వాష్టకవర్గ గరిష్ట బిందువులు: ${_SIGN_NAMES.te[savBest.sign]} (${savBest.pts}).${wars.length ? ` గ్రహ యుద్ధం: ${wars.length}.` : ''}`,
      summaryEn: `Guru–Shani Double Transit focuses H${transits.doubleTransitHouses.join(', H') || 'Distributed'}; SAV peak in ${_SIGN_NAMES.en[savBest.sign]} (${savBest.pts} pts).${wars.length ? ` Graha Yuddha pairs: ${wars.length}.` : ''}`,
      polarity: wars.length > 0 ? 'caution' : 'supportive',
    },
  ];

  const caveatTe =
    activeDoshas.length > 0 || wars.length > 0 || lowPlanet.ratioPct < 80
      ? `గమనిక: బలమైన యోగాలు ఉన్నప్పటికీ, ${lowPlanet.ratioPct < 80 ? `${_PLANET_NAMES.te[lowPlanet.id]} తక్కువ షడ్బలం, ` : ''}${wars.length ? 'గ్రహ యుద్ధం, ' : ''}${activeDoshas.length ? 'క్రియాశీల దోషాలు ' : ''}కారణంగా మిశ్రమ ఫలితాలు రావచ్చు. దశా–అంతర్దశ మరియు గోచార సమయాన్ని బట్టి తుది ఫలితం మారుతుంది.`
      : 'గమనిక: ప్రతిగ్రహ బలం, నవాంశ స్థితి మరియు ప్రస్తుత వింశోత్తరి దశా–గోచార బలాన్ని కలిపి చూస్తే ఖచ్చితమైన కాల నిర్ణయం లభిస్తుంది.';

  const caveatEn =
    activeDoshas.length > 0 || wars.length > 0 || lowPlanet.ratioPct < 80
      ? `Balanced Caveat: Alongside supportive yogas, factor in ${lowPlanet.ratioPct < 80 ? `lower Shadbala for ${_PLANET_NAMES.en[lowPlanet.id]}, ` : ''}${wars.length ? 'planetary war, ' : ''}${activeDoshas.length ? 'unmitigated doshas ' : ''}before finalizing predictions—outcomes manifest mainly during ruling Dashas and transits.`
      : 'Integrated Note: Always synthesize natal promise with D9 Navamsha dignity, Shadbala, and active Vimshottari Dasha + Double Transit triggers.';

  return {
    headlineTe: `${_SIGN_NAMES.te[chart.lagS]} లగ్నం · ${_PLANET_NAMES.te[topPlanet.id]} ప్రధాన బలం · ${activeYogas.length} యోగాలు`,
    headlineEn: `${_SIGN_NAMES.en[chart.lagS]} Lagna · ${_PLANET_NAMES.en[topPlanet.id]} Peak Strength · ${activeYogas.length} Active Yogas`,
    factors,
    caveatTe,
    caveatEn,
  };
}

