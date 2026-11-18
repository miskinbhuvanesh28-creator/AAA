import { ORDER } from './constants.ts';
import type { ComputedChart, PlanetId } from './types.ts';
import { VG } from './vargas.ts';

// Sign modalities for Rashi Drishti: Movable (0,3,6,9), Fixed (1,4,7,10), Dual (2,5,8,11)
export function getRashiAspects(fromSign: number): number[] {
  const m = fromSign % 3;
  const out: number[] = [];
  for (let s = 0; s < 12; s++) {
    if (s === fromSign) continue;
    if (m === 0 && s % 3 === 1 && s !== (fromSign + 1) % 12) out.push(s); // Movable -> Fixed except adjacent
    if (m === 1 && s % 3 === 0 && s !== (fromSign + 11) % 12) out.push(s); // Fixed -> Movable except adjacent
    if (m === 2 && s % 3 === 2) out.push(s); // Dual -> all other Dual
  }
  return out;
}

export interface ArgalaAnalysis {
  house: number;
  sign: number;
  dhanaArgala2: PlanetId[];     obstructedBy12: PlanetId[];
  sukhaArgala4: PlanetId[];     obstructedBy10: PlanetId[];
  labhaArgala11: PlanetId[];    obstructedBy3: PlanetId[];
  putraArgala5: PlanetId[];     obstructedBy9: PlanetId[];
  viparitaArgala3: PlanetId[];
}

export function computeArgala(chart: ComputedChart): ArgalaAnalysis[] {
  const atSign = (sg: number) => chart.rows.filter((r) => r.sign === sg).map((r) => r.id);
  const out: ArgalaAnalysis[] = [];
  for (let h = 1; h <= 12; h++) {
    const sign = (chart.lagS + h - 1) % 12;
    const s = (off: number) => atSign((sign + off) % 12);
    out.push({
      house: h,
      sign,
      dhanaArgala2: s(1), obstructedBy12: s(11),
      sukhaArgala4: s(3), obstructedBy10: s(9),
      labhaArgala11: s(10), obstructedBy3: s(2),
      putraArgala5: s(4), obstructedBy9: s(8),
      viparitaArgala3: s(2),
    });
  }
  return out;
}

export function computeJaiminiSummary(chart: ComputedChart) {
  const ak = chart.karakas[0];
  const amk = chart.karakas[1];
  const dk = chart.karakas[chart.karakas.length - 1];
  const akRow = chart.rows.find((r) => r.id === ak.planet)!;
  const karakamshaSign = akRow.d9;
  const karakamshaPlanetsD9 = chart.rows.filter((r) => VG(r.lon, 9) === karakamshaSign).map((r) => r.id);
  const karakamshaPlanetsD1 = chart.rows.filter((r) => r.sign === karakamshaSign).map((r) => r.id);

  // Jaimini Yogas
  const akSign = chart.s[ak.planet];
  const amkSign = chart.s[amk.planet];
  const akAmkConj = akSign === amkSign;
  const akAmkRashiAsp = getRashiAspects(akSign).includes(amkSign);

  const dkSign = chart.s[dk.planet];
  const akDkLink = akSign === dkSign || getRashiAspects(akSign).includes(dkSign);

  // Planets aspecting Karakamsha in D1 or D9
  const aspKarakamsha = ORDER.filter((id) => getRashiAspects(chart.s[id]).includes(karakamshaSign));

  return {
    ak,
    amk,
    dk,
    karakamshaSign,
    swamshaSign: karakamshaSign,
    karakamshaPlanetsD9,
    karakamshaPlanetsD1,
    akAmkRajayoga: akAmkConj || akAmkRashiAsp,
    akAmkReason: akAmkConj ? 'AK & AmK conjunct in same sign' : akAmkRashiAsp ? 'AK & AmK in mutual Rashi Drishti' : 'No direct AK–AmK Rashi linkage',
    akDkLink,
    aspKarakamsha,
    arudhas: chart.arudhas,
    AL: chart.AL,
    UL: chart.UL,
    argala: computeArgala(chart),
  };
}
