import {
  HOUSE_SIGNIFICANCE,
  NAT_ENEMIES,
  NAT_FRIENDS,
  ORDER,
  PLANET_NAMES,
  SIGN_LORDS,
  SIGN_NAMES,
  planetSymbols,
} from './constants.ts';
import { signedDiff } from './ephemeris.ts';
import { computeTransitReport } from './gocharaVarshaRect.ts';
import { computeGrahaYuddha, getFunctionalNature } from './parashari.ts';
import type { BhavaBalaRow, ShadbalaPlanet, VimsopakaRow } from './strength.ts';
import type { ComputedChart, PlanetId } from './types.ts';

export type MaitriTierKey = 'adhimitra' | 'mitra' | 'sama' | 'shatru' | 'adhishatru' | 'self';

export interface MaitriPairCell {
  from: PlanetId;
  to: PlanetId;
  natural: 'Friend' | 'Neutral' | 'Enemy' | 'Self';
  naturalTe: string;
  temporary: 'Friend' | 'Enemy' | 'Self';
  temporaryTe: string;
  signDist: number;
  compound: MaitriTierKey;
  compoundLabelTe: string;
  compoundLabelEn: string;
  score: number; // 2, 1, 0, -1, -2
}

export function computePanchadhaMaitriMatrix(chart: ComputedChart): {
  planets: PlanetId[];
  matrix: Record<number, Record<number, MaitriPairCell>>;
} {
  const matrix: Record<number, Record<number, MaitriPairCell>> = {};
  const tempGoodDist = new Set([2, 3, 4, 10, 11, 12]);

  for (const a of ORDER) {
    matrix[a] = {};
    for (const b of ORDER) {
      if (a === b) {
        matrix[a][b] = {
          from: a,
          to: b,
          natural: 'Self',
          naturalTe: 'స్వయం',
          temporary: 'Self',
          temporaryTe: 'స్వయం',
          signDist: 1,
          compound: 'self',
          compoundLabelTe: 'స్వగ్రహం',
          compoundLabelEn: 'Self',
          score: 2,
        };
        continue;
      }
      const natVal = NAT_FRIENDS[a]?.includes(b) ? 1 : NAT_ENEMIES[a]?.includes(b) ? -1 : 0;
      const natural = natVal === 1 ? 'Friend' : natVal === -1 ? 'Enemy' : 'Neutral';
      const naturalTe = natVal === 1 ? 'మిత్ర' : natVal === -1 ? 'శత్రు' : 'సమ';
      const dist = ((chart.s[b] - chart.s[a] + 12) % 12) + 1;
      const tempVal = tempGoodDist.has(dist) ? 1 : -1;
      const temporary = tempVal === 1 ? 'Friend' : 'Enemy';
      const temporaryTe = tempVal === 1 ? 'తాత్కాలిక మిత్ర' : 'తాత్కాలిక శత్రు';
      const sum = natVal + tempVal;
      const compound: MaitriTierKey =
        sum >= 2 ? 'adhimitra' : sum === 1 ? 'mitra' : sum === 0 ? 'sama' : sum === -1 ? 'shatru' : 'adhishatru';
      const labels: Record<MaitriTierKey, { te: string; en: string }> = {
        adhimitra: { te: 'అధిమిత్ర', en: 'Adhimitra (Great Friend)' },
        mitra: { te: 'మిత్ర', en: 'Mitra (Friend)' },
        sama: { te: 'సమ', en: 'Sama (Neutral)' },
        shatru: { te: 'శత్రు', en: 'Shatru (Enemy)' },
        adhishatru: { te: 'అధిశత్రు', en: 'Adhishatru (Great Enemy)' },
        self: { te: 'స్వయం', en: 'Self' },
      };
      matrix[a][b] = {
        from: a,
        to: b,
        natural,
        naturalTe,
        temporary,
        temporaryTe,
        signDist: dist,
        compound,
        compoundLabelTe: labels[compound].te,
        compoundLabelEn: labels[compound].en,
        score: sum,
      };
    }
  }
  return { planets: ORDER, matrix };
}

export interface FullGrahaDrishtiRow {
  from: PlanetId;
  fromHouse: number;
  fromSign: number;
  aspects: {
    houseOff: number;
    toHouse: number;
    toSign: number;
    strengthLabel: string;
    planetsHit: PlanetId[];
  }[];
  houseStrengths: Record<number, number>; // 1..12 percentage 0..100
}

export function computeFullGrahaDrishti(
  chart: ComputedChart,
  nodeMode: '5/7/9' | '7-only' = '5/7/9',
): FullGrahaDrishtiRow[] {
  return ORDER.map((id) => {
    const r = chart.rows.find((x) => x.id === id)!;
    const isNode = id === 3 || id === 7;
    const offs: { off: number; pct: number }[] = [{ off: 6, pct: 100 }];
    if (id === 2) offs.push({ off: 3, pct: 100 }, { off: 7, pct: 100 });
    else if (id === 4) offs.push({ off: 4, pct: 100 }, { off: 8, pct: 100 });
    else if (id === 5) offs.push({ off: 2, pct: 100 }, { off: 9, pct: 100 });
    else if (isNode && nodeMode === '5/7/9') offs.push({ off: 4, pct: 100 }, { off: 8, pct: 100 });

    const houseStrengths: Record<number, number> = {};
    for (let h = 1; h <= 12; h++) houseStrengths[h] = 0;

    const aspects = offs
      .sort((a, b) => a.off - b.off)
      .map(({ off, pct }) => {
        const toSign = (r.sign + off) % 12;
        const toHouse = ((toSign - chart.lagS + 12) % 12) + 1;
        houseStrengths[toHouse] = pct;
        const planetsHit = ORDER.filter((q) => q !== id && chart.s[q] === toSign);
        return {
          houseOff: off + 1,
          toHouse,
          toSign,
          strengthLabel: `${pct}%`,
          planetsHit,
        };
      });

    return { from: id, fromHouse: r.house, fromSign: r.sign, aspects, houseStrengths };
  });
}

export interface RashiDrishtiRow {
  sign: number;
  house: number;
  modalityTe: string;
  modalityEn: string;
  occupants: PlanetId[];
  aspectedSigns: number[];
  aspectedHouses: number[];
  aspectedPlanets: PlanetId[];
}

export function computeRashiDrishtiReport(chart: ComputedChart): RashiDrishtiRow[] {
  // Jaimini: Movable (0,3,6,9) aspect Fixed except adjacent; Fixed (1,4,7,10) aspect Movable except adjacent; Dual (2,5,8,11) aspect all other Dual signs.
  const movable = [0, 3, 6, 9];
  const fixed = [1, 4, 7, 10];
  const dual = [2, 5, 8, 11];
  const rows: RashiDrishtiRow[] = [];

  for (let s = 0; s < 12; s++) {
    const mod = s % 3;
    const adj1 = (s + 1) % 12;
    const adj11 = (s + 11) % 12;
    const targets =
      mod === 0
        ? fixed.filter((t) => t !== adj1 && t !== adj11)
        : mod === 1
          ? movable.filter((t) => t !== adj1 && t !== adj11)
          : dual.filter((t) => t !== s);

    const occupants = ORDER.filter((id) => chart.s[id] === s);
    const aspectedPlanets = ORDER.filter((id) => targets.includes(chart.s[id]));
    rows.push({
      sign: s,
      house: ((s - chart.lagS + 12) % 12) + 1,
      modalityTe: mod === 0 ? 'చర రాశి' : mod === 1 ? 'స్థిర రాశి' : 'ద్విస్వభావ రాశి',
      modalityEn: mod === 0 ? 'Movable' : mod === 1 ? 'Fixed' : 'Dual',
      occupants,
      aspectedSigns: targets,
      aspectedHouses: targets.map((t) => ((t - chart.lagS + 12) % 12) + 1),
      aspectedPlanets,
    });
  }
  return rows;
}

export interface ConjunctionDetail {
  sign: number;
  house: number;
  planets: PlanetId[];
  pairs: {
    p1: PlanetId;
    p2: PlanetId;
    degDiff: number;
    tightOrb: boolean;
    combustPair: boolean;
    grahaYuddha: boolean;
    noteTe: string;
    noteEn: string;
  }[];
  summaryTe: string;
  summaryEn: string;
}

export function computeConjunctionDetails(chart: ComputedChart): ConjunctionDetail[] {
  const wars = computeGrahaYuddha(chart);
  const out: ConjunctionDetail[] = [];

  for (let sign = 0; sign < 12; sign++) {
    const members = chart.rows.filter((r) => r.sign === sign).map((r) => r.id);
    if (members.length < 2) continue;
    const house = ((sign - chart.lagS + 12) % 12) + 1;
    const pairs: ConjunctionDetail['pairs'] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = chart.rows.find((r) => r.id === members[i])!;
        const b = chart.rows.find((r) => r.id === members[j])!;
        const degDiff = Math.abs(signedDiff(a.lon, b.lon));
        const tightOrb = degDiff <= 3;
        const combustPair = (a.id === 0 && b.combust) || (b.id === 0 && a.combust);
        const grahaYuddha = wars.some(
          (w) => (w.p1 === a.id && w.p2 === b.id) || (w.p1 === b.id && w.p2 === a.id),
        );
        const noteTe = grahaYuddha
          ? 'గ్రహ యుద్ధం (<1° దూరం)'
          : combustPair
            ? 'సూర్య మౌఢ్యం (అస్తంగత్వం)'
            : tightOrb
              ? 'అత్యంత సన్నిహిత యుతి (≤3°)'
              : 'రాశి యుతి';
        const noteEn = grahaYuddha
          ? 'Graha Yuddha (<1° war)'
          : combustPair
            ? 'Solar combustion'
            : tightOrb
              ? 'Tight conjunction (≤3°)'
              : 'Co-sign conjunction';
        pairs.push({ p1: a.id, p2: b.id, degDiff, tightOrb, combustPair, grahaYuddha, noteTe, noteEn });
      }
    }
    const labelListTe = members.map((m) => PLANET_NAMES.te[m]).join(' + ');
    const labelListEn = members.map((m) => PLANET_NAMES.en[m]).join(' + ');
    out.push({
      sign,
      house,
      planets: members,
      pairs,
      summaryTe: `${SIGN_NAMES.te[sign]} (H${house}): ${labelListTe}`,
      summaryEn: `${SIGN_NAMES.en[sign]} (H${house}): ${labelListEn}`,
    });
  }
  return out;
}

export interface NeechabhangaResult {
  planetId: PlanetId;
  sign: number;
  house: number;
  cancelled: boolean;
  rulesMatchedTe: string[];
  rulesMatchedEn: string[];
  shadbalaRatioPct: number;
}

export function computeNeechabhangaAnalysis(
  chart: ComputedChart,
  shadbala: ShadbalaPlanet[],
): NeechabhangaResult[] {
  const exaSignMap: Record<number, number> = { 0: 0, 1: 1, 2: 9, 6: 5, 4: 3, 8: 11, 5: 6 };
  const kendraLagna = new Set([1, 4, 7, 10]);

  return chart.rows
    .filter((r) => r.digKey === 'debilitated')
    .map((r) => {
      const signLord = SIGN_LORDS[r.sign];
      const exaPlanetInSign = Number(Object.entries(exaSignMap).find(([, s]) => s === r.sign)?.[0] ?? -1) as PlanetId;
      const signLordRow = chart.rows.find((x) => x.id === signLord);
      const exaLordRow = exaPlanetInSign >= 0 ? chart.rows.find((x) => x.id === exaPlanetInSign) : undefined;
      const moonSign = chart.s[1];
      const moonHouse = (row?: typeof r) => (row ? ((row.sign - moonSign + 12) % 12) + 1 : 0);

      const rulesMatchedTe: string[] = [];
      const rulesMatchedEn: string[] = [];

      if (signLordRow && kendraLagna.has(signLordRow.house)) {
        rulesMatchedTe.push(`నీచ రాశ్యాధిపతి (${PLANET_NAMES.te[signLord]}) లగ్న కేంద్రంలో (H${signLordRow.house}) స్థితి`);
        rulesMatchedEn.push(`Sign lord ${PLANET_NAMES.en[signLord]} is in a Kendra from Lagna (H${signLordRow.house})`);
      }
      if (signLordRow && kendraLagna.has(moonHouse(signLordRow))) {
        rulesMatchedTe.push(`నీచ రాశ్యాధిపతి (${PLANET_NAMES.te[signLord]}) చంద్రుని నుండి కేంద్రంలో స్థితి`);
        rulesMatchedEn.push(`Sign lord ${PLANET_NAMES.en[signLord]} is in a Kendra from Moon`);
      }
      if (exaLordRow && kendraLagna.has(exaLordRow.house)) {
        rulesMatchedTe.push(`ఈ రాశిలో ఉచ్ఛ పొందే గ్రహం (${PLANET_NAMES.te[exaPlanetInSign]}) లగ్న కేంద్రంలో ఉంది`);
        rulesMatchedEn.push(`Exaltation lord of sign (${PLANET_NAMES.en[exaPlanetInSign]}) occupies a Lagna Kendra`);
      }
      if (exaLordRow && kendraLagna.has(moonHouse(exaLordRow))) {
        rulesMatchedTe.push(`ఉచ్ఛాధిపతి (${PLANET_NAMES.te[exaPlanetInSign]}) చంద్రుని నుండి కేంద్రంలో ఉంది`);
        rulesMatchedEn.push(`Exaltation lord (${PLANET_NAMES.en[exaPlanetInSign]}) is in a Kendra from Moon`);
      }
      if (r.sign === r.d9) {
        rulesMatchedTe.push('వర్గోత్తమ స్థితి (D1 మరియు D9 లో ఒకే రాశి)');
        rulesMatchedEn.push('Vargottama status (same sign in D1 and D9)');
      }
      if (signLordRow && (chart.rows.some((q) => q.sign === r.sign && q.digKey === 'exalted') || signLordRow.sign === r.sign)) {
        rulesMatchedTe.push('నీచ రాశిలో స్వక్షేత్ర లేదా ఉచ్ఛ గ్రహ సంచారం/స్థితి');
        rulesMatchedEn.push('Sign dispositor or exalted planet aspects/occupies the debilitation sign');
      }
      if (r.retro) {
        rulesMatchedTe.push('వక్రగతి వలన బల పునరుద్ధరణ (బృహత్ పరాశర మతం)');
        rulesMatchedEn.push('Retrograde motion restores inner chestabala strength');
      }

      const sb = shadbala.find((s) => s.id === r.id);
      return {
        planetId: r.id,
        sign: r.sign,
        house: r.house,
        cancelled: rulesMatchedEn.length > 0,
        rulesMatchedTe,
        rulesMatchedEn,
        shadbalaRatioPct: sb ? sb.ratioPct : 85,
      };
    });
}

export type PlanetVerdictCategory =
  | 'Strong & Clean'
  | 'Naturally Strong / Mild Caution'
  | 'Afflicted but Mitigated'
  | 'Significant Affliction / Needs Care'
  | 'Weak / Struggling';

export interface DeepPlanetInsight {
  id: PlanetId;
  symbols: string;
  sign: number;
  house: number;
  bhava: number;
  dignityKey: string;
  dignityTe: string;
  functionalRole: string;
  functionalRoleTe: string;
  isBadhaka: boolean;
  lordOfHouses: number[];
  shadbalaRupas: number | null;
  shadbalaPct: number | null;
  vimsopaka16: number | null;
  bavBindus: number | null;
  savAtSign: number;
  supportFactorsTe: string[];
  supportFactorsEn: string[];
  originalAfflictionsTe: string[];
  originalAfflictionsEn: string[];
  mitigationsTe: string[];
  mitigationsEn: string[];
  residualAffliction: 'None' | 'Low' | 'Moderate' | 'High';
  residualAfflictionTe: string;
  verdictCategory: PlanetVerdictCategory;
  verdictCategoryTe: string;
  verdictTe: string;
  verdictEn: string;
}

const ROLE_TE: Record<string, string> = {
  Yogakaraka: 'యోగకారక గ్రహం',
  Benefic: 'శుభ గ్రహం (త్రికోణాధిపతి)',
  Malefic: 'కార్యాత్మక పాప గ్రహం',
  Neutral: 'సమ గ్రహం',
  Maraka: 'మారక స్థాన అధిపతి',
  Node: 'ఛాయా గ్రహం',
};

export function computeDeepPlanetaryInsights(
  chart: ComputedChart,
  shadbala: ShadbalaPlanet[],
  vimsopaka: VimsopakaRow[],
): DeepPlanetInsight[] {
  const fn = getFunctionalNature(chart.lagS);
  const fullDrishti = computeFullGrahaDrishti(chart, '5/7/9');
  const neechas = computeNeechabhangaAnalysis(chart, shadbala);
  const wars = computeGrahaYuddha(chart);
  const beneficIds = new Set<PlanetId>([4, 8]); // Ju, Ve (plus unafflicted Me & waxing Mo handled dynamically)
  const maleficIds = new Set<PlanetId>([2, 5, 3, 7, 0]);

  return chart.rows.map((r) => {
    const fInfo = fn.byPlanet[r.id];
    const sb = shadbala.find((x) => x.id === r.id) || null;
    const vim = vimsopaka.find((x) => x.id === r.id) || null;
    const bavBindus = r.id <= 6 || r.id === 8 ? chart.asht.bav[r.id]?.[r.sign] ?? null : null;
    const savAtSign = chart.asht.sav[r.sign] ?? 28;
    const isNode = r.id === 3 || r.id === 7;
    const functionalRole = isNode ? 'Node' : fInfo?.role ?? 'Neutral';
    const functionalRoleTe = ROLE_TE[functionalRole] || 'సమ గ్రహం';
    const isBadhaka = fInfo?.badhaka ?? false;
    const lordOfHouses = fInfo?.houses ?? [];

    const aspecters = fullDrishti
      .filter((row) => row.from !== r.id && row.aspects.some((a) => a.toSign === r.sign))
      .map((row) => row.from);
    const conjuncts = chart.rows.filter((q) => q.id !== r.id && q.sign === r.sign).map((q) => q.id);

    const supportFactorsTe: string[] = [];
    const supportFactorsEn: string[] = [];
    const originalAfflictionsTe: string[] = [];
    const originalAfflictionsEn: string[] = [];
    const mitigationsTe: string[] = [];
    const mitigationsEn: string[] = [];

    if (r.digKey === 'exalted' || r.digKey === 'moolatrikona' || r.digKey === 'own') {
      supportFactorsTe.push(`${r.dig} స్థితి వల్ల సహజ బలం అధికం.`);
      supportFactorsEn.push(`Strong natal dignity (${r.digKey}).`);
    }
    if (r.vgt) {
      supportFactorsTe.push('వర్గోత్తమ స్థితి (D1 & D9 ఒకే రాశి) ఫలిత స్థిరత్వాన్ని ఇస్తుంది.');
      supportFactorsEn.push('Vargottama in D1 and D9 reinforces promise.');
    }
    if ([1, 4, 5, 7, 9, 10, 11].includes(r.house)) {
      supportFactorsTe.push(`${r.house}వ శుభ/కేంద్ర/త్రికోణ భావ స్థితి.`);
      supportFactorsEn.push(`Occupies constructive House H${r.house}.`);
    }
    if (sb && sb.ratioPct >= 100) {
      supportFactorsTe.push(`షడ్బలం ${sb.ratioPct.toFixed(0)}% (పూర్ణ బలం).`);
      supportFactorsEn.push(`Meets BPHS Shadbala requirement (${sb.ratioPct.toFixed(0)}%).`);
    }
    if (bavBindus !== null && bavBindus >= 5) {
      supportFactorsTe.push(`భిన్నాష్టకవర్గంలో ${bavBindus}/8 బిందువులు.`);
      supportFactorsEn.push(`High BAV support (${bavBindus}/8 bindus).`);
    }
    if (aspecters.some((a) => beneficIds.has(a))) {
      const bens = aspecters.filter((a) => beneficIds.has(a));
      supportFactorsTe.push(`శుభగ్రహ దృష్టి (${bens.map((id) => PLANET_NAMES.te[id]).join(', ')}) రక్షణ కల్పిస్తోంది.`);
      supportFactorsEn.push(`Supported by benefic aspect from ${bens.map((id) => PLANET_NAMES.en[id]).join(', ')}.`);
    }

    // Afflictions
    if (r.digKey === 'debilitated') {
      originalAfflictionsTe.push('నీచ రాశిలో ఉండటం వల్ల ప్రాథమిక బలహీనత.');
      originalAfflictionsEn.push('Placed in debilitation sign.');
    } else if (r.digKey === 'shatru' || r.digKey === 'adhishatru') {
      originalAfflictionsTe.push(`${r.dig} రాశిలో స్థితి.`);
      originalAfflictionsEn.push(`Placed in ${r.digKey} sign.`);
    }
    if ([6, 8, 12].includes(r.house)) {
      originalAfflictionsTe.push(`${r.house}వ దుస్థాన స్థితి.`);
      originalAfflictionsEn.push(`Placed in Dusthana H${r.house}.`);
    }
    if (r.combust) {
      originalAfflictionsTe.push(`సూర్యునితో అస్తంగత్వం (మౌఢ్యం ${r.combustOrb?.toFixed(1)}°).`);
      originalAfflictionsEn.push(`Combust within ${r.combustOrb?.toFixed(1)}° of Sun.`);
    }
    if (r.retro && r.id !== 3 && r.id !== 7) {
      originalAfflictionsTe.push('వక్రగతి (చలన మార్పు — ఆలస్యం తర్వాత ఫలితాలు).');
      originalAfflictionsEn.push('Retrograde motion modifies timing (internalized / delayed delivery).');
    }
    const malAsp = aspecters.filter((a) => maleficIds.has(a));
    if (malAsp.length > 0) {
      originalAfflictionsTe.push(`పాపగ్రహ దృష్టి (${malAsp.map((id) => PLANET_NAMES.te[id]).join(', ')}).`);
      originalAfflictionsEn.push(`Aspected by ${malAsp.map((id) => PLANET_NAMES.en[id]).join(', ')}.`);
    }
    const malConj = conjuncts.filter((c) => maleficIds.has(c));
    if (malConj.length > 0) {
      originalAfflictionsTe.push(`కలిసి ఉన్న గ్రహాల ఒత్తిడి (${malConj.map((id) => PLANET_NAMES.te[id]).join(', ')}).`);
      originalAfflictionsEn.push(`Conjunct ${malConj.map((id) => PLANET_NAMES.en[id]).join(', ')}.`);
    }
    if (wars.some((w) => w.loser === r.id)) {
      originalAfflictionsTe.push('గ్రహ యుద్ధంలో ఓటమి.');
      originalAfflictionsEn.push('Defeated in Graha Yuddha.');
    }
    if (sb && sb.ratioPct < 85) {
      originalAfflictionsTe.push(`తక్కువ షడ్బలం (${sb.ratioPct.toFixed(0)}%).`);
      originalAfflictionsEn.push(`Below-threshold Shadbala (${sb.ratioPct.toFixed(0)}%).`);
    }

    // Mitigations
    const nb = neechas.find((n) => n.planetId === r.id);
    if (nb?.cancelled) {
      mitigationsTe.push(...nb.rulesMatchedTe);
      mitigationsEn.push(...nb.rulesMatchedEn);
    }
    if (aspecters.includes(4)) {
      mitigationsTe.push('గురు దృష్టి వల్ల దోష తీవ్రత గణనీయంగా తగ్గుతుంది.');
      mitigationsEn.push("Jupiter's benefic aspect substantially cushions affliction.");
    }
    const dispositor = SIGN_LORDS[r.sign];
    const dispRow = chart.rows.find((q) => q.id === dispositor);
    if (dispRow && (['exalted', 'own', 'moolatrikona'].includes(dispRow.digKey) || [1, 4, 5, 7, 9, 10].includes(dispRow.house))) {
      mitigationsTe.push(`రాశ్యాధిపతి ${PLANET_NAMES.te[dispositor]} బలంగా ఉండటం రక్షణ.`);
      mitigationsEn.push(`Strong sign dispositor (${PLANET_NAMES.en[dispositor]} in H${dispRow.house}) stabilizes results.`);
    }
    if (r.vgt && originalAfflictionsEn.length > 0) {
      mitigationsTe.push('వర్గోత్తమ స్థితి అంతిమ ఫలితాలను కాపాడుతుంది.');
      mitigationsEn.push('Vargottama status preserves long-term dignity.');
    }
    if (functionalRole === 'Yogakaraka' || r.id === SIGN_LORDS[chart.lagS]) {
      mitigationsTe.push('లగ్న శుభ గ్రహత్వం / యోగకారక బలం సహాయపడుతుంది.');
      mitigationsEn.push('Functional benefic/Yogakaraka lordship reduces harshness.');
    }

    const affCount = originalAfflictionsEn.length;
    const mitCount = mitigationsEn.length;
    const supCount = supportFactorsEn.length;

    let residualAffliction: DeepPlanetInsight['residualAffliction'] = 'None';
    if (affCount === 0) residualAffliction = 'None';
    else if (affCount - mitCount <= 0) residualAffliction = 'Low';
    else if (affCount - mitCount === 1) residualAffliction = 'Moderate';
    else residualAffliction = 'High';

    const residualMapTe = { None: 'దోషం లేదు', Low: 'స్వల్పం (పరిహార్యం)', Moderate: 'మధ్యస్థం', High: 'అధికం' };

    let verdictCategory: PlanetVerdictCategory = 'Strong & Clean';
    let verdictCategoryTe = 'బలమైన శుభస్థితి';
    if ((sb && sb.ratioPct < 80) || r.digKey === 'debilitated') {
      if (mitCount > 0 && residualAffliction !== 'High') {
        verdictCategory = 'Afflicted but Mitigated';
        verdictCategoryTe = 'దోష భంగం — శుభ పరివర్తన';
      } else {
        verdictCategory = 'Weak / Struggling';
        verdictCategoryTe = 'బలహీన / శ్రమతో కూడిన స్థితి';
      }
    } else if (residualAffliction === 'High') {
      verdictCategory = 'Significant Affliction / Needs Care';
      verdictCategoryTe = 'ప్రత్యేక జాగ్రత్త & శాంతి అవసరం';
    } else if (affCount > 0 && mitCount > 0) {
      verdictCategory = 'Afflicted but Mitigated';
      verdictCategoryTe = 'సవాళ్లు ఉన్నా రక్షణ పొందిన స్థితి';
    } else if (supCount >= 2 && affCount > 0) {
      verdictCategory = 'Naturally Strong / Mild Caution';
      verdictCategoryTe = 'బలమైనదే కానీ స్వల్ప జాగ్రత్త అవసరం';
    }

    const verdictTe =
      verdictCategory === 'Strong & Clean'
        ? `${PLANET_NAMES.te[r.id]} రాశి–నవాంశ–షడ్బలాలలో సుస్థిరంగా ఉండి తన ${lordOfHouses.map((h) => `${h}వ`).join(', ') || 'సహజ'} భావ ఫలితాలను శుభప్రదంగా ఇస్తుంది.`
        : verdictCategory === 'Afflicted but Mitigated'
          ? `${PLANET_NAMES.te[r.id]} పై కొన్ని ఒత్తిడులు ఉన్నా (${mitCount} భంగ కారకాలు), ప్రయత్నం ద్వారా మంచి పురోగతి లభిస్తుంది.`
          : verdictCategory === 'Naturally Strong / Mild Caution'
            ? `${PLANET_NAMES.te[r.id]} ప్రాథమికంగా బలంగా ఉంది; దశా కాలంలో సమతుల్యత పాటిస్తే విశేష ఫలితాలు.`
            : `${PLANET_NAMES.te[r.id]} ప్రస్తుతం బలహీనంగా లేదా ఒత్తిడిలో ఉన్నందున దశా కాలంలో ఓర్పు, ధర్మ మార్గం మరియు జప శాంతి శ్రేయస్కరం.`;

    const verdictEn =
      verdictCategory === 'Strong & Clean'
        ? `${PLANET_NAMES.en[r.id]} operates cleanly with solid dignity and support across Houses ${lordOfHouses.join(', ') || r.house}.`
        : verdictCategory === 'Afflicted but Mitigated'
          ? `${PLANET_NAMES.en[r.id]} carries initial strain balanced by ${mitCount} mitigating factor(s), delivering results after effort.`
          : verdictCategory === 'Naturally Strong / Mild Caution'
            ? `${PLANET_NAMES.en[r.id]} is fundamentally supportive with minor caveats to mind during its Dasha.`
            : `${PLANET_NAMES.en[r.id]} shows notable strain or lower strength; patient pacing and supportive remedies help during its periods.`;

    return {
      id: r.id,
      symbols: planetSymbols(r),
      sign: r.sign,
      house: r.house,
      bhava: r.bhava,
      dignityKey: r.digKey,
      dignityTe: r.dig,
      functionalRole,
      functionalRoleTe,
      isBadhaka,
      lordOfHouses,
      shadbalaRupas: sb ? sb.totalRupas : null,
      shadbalaPct: sb ? sb.ratioPct : null,
      vimsopaka16: vim ? vim.shodashavarga : null,
      bavBindus,
      savAtSign,
      supportFactorsTe,
      supportFactorsEn,
      originalAfflictionsTe,
      originalAfflictionsEn,
      mitigationsTe,
      mitigationsEn,
      residualAffliction,
      residualAfflictionTe: residualMapTe[residualAffliction],
      verdictCategory,
      verdictCategoryTe,
      verdictTe,
      verdictEn,
    };
  });
}

export interface InfluenceNode {
  id: PlanetId;
  x: number;
  y: number;
  house: number;
  sign: number;
  symbols: string;
  verdictCategory: PlanetVerdictCategory;
}

export interface InfluenceEdge {
  from: PlanetId;
  to: PlanetId;
  kind: 'conjunct' | 'aspect' | 'lordship' | 'friend' | 'enemy';
  labelTe: string;
  labelEn: string;
  positive: boolean;
}

export function computeInfluenceGraph(
  chart: ComputedChart,
  insights: DeepPlanetInsight[],
): { nodes: InfluenceNode[]; edges: InfluenceEdge[] } {
  const cx = 240;
  const cy = 200;
  const r = 148;

  const nodes: InfluenceNode[] = ORDER.map((id, idx) => {
    const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / ORDER.length;
    const row = chart.rows.find((x) => x.id === id)!;
    const ins = insights.find((x) => x.id === id)!;
    return {
      id,
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle)),
      house: row.house,
      sign: row.sign,
      symbols: ins.symbols,
      verdictCategory: ins.verdictCategory,
    };
  });

  const edges: InfluenceEdge[] = [];
  const fullDrishti = computeFullGrahaDrishti(chart, '5/7/9');
  const maitri = computePanchadhaMaitriMatrix(chart);

  for (let i = 0; i < ORDER.length; i++) {
    for (let j = i + 1; j < ORDER.length; j++) {
      const a = ORDER[i];
      const b = ORDER[j];
      if (chart.s[a] === chart.s[b]) {
        edges.push({ from: a, to: b, kind: 'conjunct', labelTe: 'యుతి', labelEn: 'Conjunct', positive: true });
      }
    }
  }

  for (const dr of fullDrishti) {
    for (const asp of dr.aspects) {
      for (const hit of asp.planetsHit) {
        const cell = maitri.matrix[dr.from]?.[hit];
        edges.push({
          from: dr.from,
          to: hit,
          kind: 'aspect',
          labelTe: `${asp.houseOff}వ దృష్టి`,
          labelEn: `${asp.houseOff}th Aspect`,
          positive: (cell?.score ?? 0) >= 0 && ![2, 5, 3, 7].includes(dr.from),
        });
      }
    }
  }

  for (const row of chart.rows) {
    const disp = SIGN_LORDS[row.sign];
    if (disp !== row.id) {
      edges.push({
        from: row.id,
        to: disp,
        kind: 'lordship',
        labelTe: 'రాశ్యాధిపతి',
        labelEn: 'Dispositor',
        positive: (maitri.matrix[row.id]?.[disp]?.score ?? 0) >= 0,
      });
    }
  }

  return { nodes, edges };
}

export interface BhavaFullAnalysisRow {
  house: number;
  sign: number;
  lord: PlanetId;
  lordSign: number;
  lordHouse: number;
  lordD9Sign: number;
  occupantsD1: PlanetId[];
  occupantsBhavaChalit: PlanetId[];
  bhavaBalaRupas: number;
  bhavaBalaRank: number;
  savBindus: number;
  aspectedBy: PlanetId[];
  kpCuspSubLord: PlanetId;
  doubleTransitHit: boolean;
  significanceTe: string;
  significanceEn: string;
  summaryTe: string;
  summaryEn: string;
}

export function computeCompleteBhavaAnalysis(
  chart: ComputedChart,
  _shadbala: ShadbalaPlanet[],
  bhavaBala: BhavaBalaRow[],
): BhavaFullAnalysisRow[] {
  const fullDrishti = computeFullGrahaDrishti(chart, '5/7/9');
  const transits = computeTransitReport(chart);

  return Array.from({ length: 12 }, (_, idx) => {
    const house = idx + 1;
    const sign = (chart.lagS + idx) % 12;
    const lord = SIGN_LORDS[sign];
    const lordRow = chart.rows.find((r) => r.id === lord)!;
    const occupantsD1 = chart.rows.filter((r) => r.house === house).map((r) => r.id);
    const occupantsBhavaChalit = chart.rows.filter((r) => r.bhava === house).map((r) => r.id);
    const bb = bhavaBala.find((b) => b.house === house);
    const savBindus = chart.asht.sav[sign];
    const aspectedBy = fullDrishti.filter((d) => d.aspects.some((a) => a.toSign === sign)).map((d) => d.from);
    const kpCuspSubLord = chart.kp.cuspSubs[idx]?.subLord ?? lord;
    const doubleTransitHit = transits.doubleTransitHouses.includes(house);
    const sigMeta = HOUSE_SIGNIFICANCE[idx];

    const strongNoteTe =
      (bb?.rank ?? 12) <= 4 || savBindus >= 30
        ? 'బలమైన భావం — శుభ ఫలితాల సామర్థ్యం అధికం.'
        : [6, 8, 12].includes(house)
          ? 'సవాళ్లు, ఆరోగ్యం/వ్యయాలపై అవగాహన అవసరం.'
          : 'దశా–గోచార కాలానుగుణంగా మధ్యస్థ నుండి శుభ ఫలితాలు.';
    const strongNoteEn =
      (bb?.rank ?? 12) <= 4 || savBindus >= 30
        ? 'High vitality house with strong SAV/Bhava Bala capacity.'
        : [6, 8, 12].includes(house)
          ? 'Dusthana focus: cultivate resilience, discipline, and service.'
          : 'Balanced house responding steadily to Dasha and transit triggers.';

    const summaryTe = `${house}వ భావం (${SIGN_NAMES.te[sign]}): అధిపతి ${PLANET_NAMES.te[lord]} ${lordRow.house}వ భావంలో (${lordRow.dig}) ఉన్నారు. SAV ${savBindus}, భావబలం #${bb?.rank ?? '-'}. ${strongNoteTe}`;
    const summaryEn = `H${house} (${SIGN_NAMES.en[sign]}): Lord ${PLANET_NAMES.en[lord]} sits in H${lordRow.house} (${lordRow.digKey}); SAV ${savBindus}, Bhava Bala #${bb?.rank ?? '-'}. ${strongNoteEn}`;

    return {
      house,
      sign,
      lord,
      lordSign: lordRow.sign,
      lordHouse: lordRow.house,
      lordD9Sign: lordRow.d9,
      occupantsD1,
      occupantsBhavaChalit,
      bhavaBalaRupas: bb?.totalRupas ?? 7,
      bhavaBalaRank: bb?.rank ?? house,
      savBindus,
      aspectedBy,
      kpCuspSubLord,
      doubleTransitHit,
      significanceTe: sigMeta?.te ?? '',
      significanceEn: sigMeta?.en ?? '',
      summaryTe,
      summaryEn,
    };
  });
}
