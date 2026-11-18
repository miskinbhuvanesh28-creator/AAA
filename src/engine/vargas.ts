import { N } from './ephemeris.ts';
import type { ComputedChart, PlanetId } from './types.ts';

export type VargaNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 16 | 20 | 24 | 27 | 30 | 40 | 45 | 60 | 81 | 108 | 144;

export interface VargaMeta {
  v: VargaNumber;
  code: string;
  nameTe: string;
  nameEn: string;
  domainTe: string;
  domainEn: string;
  shodasha: boolean;
  group: 'shodasha' | 'traditional' | 'extended';
}

export const EXTENDED_VARGA_NOTE = {
  te: 'తాంత్రిక / నాడీ / అతి-సూక్ష్మ వర్గాలు (D81, D108, D144): జన్మ సమయం ఖచ్చితత్వం ±30 సెకన్లలో ఉన్నప్పుడు మాత్రమే ఇవి విశ్వసనీయంగా ఉంటాయి.',
  en: 'Extended Nadi / Tajika Vargas (D81, D108, D144): Sensitive to birth-time errors under ±30 seconds; confirm rectification first.',
};

export const ALL_VARGAS: VargaMeta[] = [
  { v: 1, code: 'D1', nameTe: 'రాశి చక్రం', nameEn: 'Rashi', domainTe: 'సంపూర్ణ జీవితం · దేహం', domainEn: 'Physical body & overall destiny', shodasha: true, group: 'shodasha' },
  { v: 2, code: 'D2', nameTe: 'హోరా చక్రం', nameEn: 'Hora', domainTe: 'సంపద · ఆర్థిక స్థితి', domainEn: 'Wealth & financial sustenance', shodasha: true, group: 'shodasha' },
  { v: 3, code: 'D3', nameTe: 'ద్రేక్కాణ చక్రం', nameEn: 'Drekkana', domainTe: 'సోదరులు · ధైర్యం', domainEn: 'Siblings, courage & enterprise', shodasha: true, group: 'shodasha' },
  { v: 4, code: 'D4', nameTe: 'చతుర్థాంశ', nameEn: 'Chaturthamsha', domainTe: 'స్థిరాస్తి · సుఖం', domainEn: 'Fixed assets, home & fortune', shodasha: true, group: 'shodasha' },
  { v: 5, code: 'D5', nameTe: 'పంచాంశ', nameEn: 'Panchamsha', domainTe: 'అధికారం · పుణ్యం', domainEn: 'Fame, authority & spiritual merit', shodasha: false, group: 'traditional' },
  { v: 6, code: 'D6', nameTe: 'షష్ఠాంశ', nameEn: 'Shashthamsha', domainTe: 'ఆరోగ్యం · శత్రు జయం', domainEn: 'Health, resilience & obstacles', shodasha: false, group: 'traditional' },
  { v: 7, code: 'D7', nameTe: 'సప్తాంశ', nameEn: 'Saptamsha', domainTe: 'సంతానం · సృజనాత్మకత', domainEn: 'Children, progeny & legacy', shodasha: true, group: 'shodasha' },
  { v: 8, code: 'D8', nameTe: 'అష్టమాంశ', nameEn: 'Ashtamsha', domainTe: 'ఆయుర్దాయం · ఆకస్మిక మార్పులు', domainEn: 'Longevity & sudden transformations', shodasha: false, group: 'traditional' },
  { v: 9, code: 'D9', nameTe: 'నవాంశ చక్రం', nameEn: 'Navamsha', domainTe: 'వివాహం · ధర్మం · అంతర్బలం', domainEn: 'Marriage, dharma & inner planetary strength', shodasha: true, group: 'shodasha' },
  { v: 10, code: 'D10', nameTe: 'దశాంశ చక్రం', nameEn: 'Dashamsha', domainTe: 'వృత్తి · కర్మ · గౌరవం', domainEn: 'Career, profession & status', shodasha: true, group: 'shodasha' },
  { v: 11, code: 'D11', nameTe: 'రుద్రాంశ (ఏకాదశాంశ)', nameEn: 'Rudramsha', domainTe: 'లాభం · అదనపు ఆదాయం', domainEn: 'Gains, windfalls & honors', shodasha: false, group: 'traditional' },
  { v: 12, code: 'D12', nameTe: 'ద్వాదశాంశ', nameEn: 'Dwadashamsha', domainTe: 'తల్లిదండ్రులు · వంశం', domainEn: 'Parents, lineage & heritage', shodasha: true, group: 'shodasha' },
  { v: 16, code: 'D16', nameTe: 'షోడశాంశ', nameEn: 'Shodashamsha', domainTe: 'వాహనాలు · మానసిక సౌఖ్యం', domainEn: 'Vehicles, comforts & inner joy', shodasha: true, group: 'shodasha' },
  { v: 20, code: 'D20', nameTe: 'వింశాంశ', nameEn: 'Vimshamsha', domainTe: 'ఆధ్యాత్మిక సాధన · ఉపాసన', domainEn: 'Spiritual progress & devotion', shodasha: true, group: 'shodasha' },
  { v: 24, code: 'D24', nameTe: 'చతుర్వింశాంశ', nameEn: 'Siddhamsha', domainTe: 'విద్య · శాస్త్ర జ్ఞానం', domainEn: 'Higher education & scholarship', shodasha: true, group: 'shodasha' },
  { v: 27, code: 'D27', nameTe: 'సప్తవింశాంశ', nameEn: 'Bhamsha', domainTe: 'శారీరక బలం · సత్తా', domainEn: 'Physical vitality & stamina', shodasha: true, group: 'shodasha' },
  { v: 30, code: 'D30', nameTe: 'త్రింశాంశ', nameEn: 'Trimshamsha', domainTe: 'సవాళ్లు · అరిష్ట నివారణ', domainEn: 'Misfortunes, karmic trials & character', shodasha: true, group: 'shodasha' },
  { v: 40, code: 'D40', nameTe: 'ఖవేదాంశ', nameEn: 'Khavedamsha', domainTe: 'మాతృ వంశ శుభాశుభాలు', domainEn: 'Maternal heritage & fine auspiciousness', shodasha: true, group: 'shodasha' },
  { v: 45, code: 'D45', nameTe: 'అక్షవేదాంశ', nameEn: 'Akshavedamsha', domainTe: 'పితృ వంశ నైతికత', domainEn: 'Paternal heritage & general ethics', shodasha: true, group: 'shodasha' },
  { v: 60, code: 'D60', nameTe: 'షష్టియంశ', nameEn: 'Shashtiamsha', domainTe: 'పూర్వజన్మ కర్మ · సూక్ష్మ ఫలం', domainEn: 'Past-life karma & ultimate root chart', shodasha: true, group: 'shodasha' },
  { v: 81, code: 'D81', nameTe: 'నవ-నవాంశ', nameEn: 'Nava-Navamsha', domainTe: 'సూక్ష్మ ధర్మ బలం · నాడీ విశ్లేషణ', domainEn: '9×9 micro-Navamsha · subtle karmic strength', shodasha: false, group: 'extended' },
  { v: 108, code: 'D108', nameTe: 'అష్టోత్తరాంశ', nameEn: 'Ashtottaramsha', domainTe: 'పూర్ణ జన్మ విత్త · మోక్ష సూక్ష్మం', domainEn: '108-fold division (Navamsha × Dwadashamsha)', shodasha: false, group: 'extended' },
  { v: 144, code: 'D144', nameTe: 'ద్వాదశ-ద్వాదశాంశ', nameEn: 'Dwadashamsha-Dwadashamsha', domainTe: 'పితృ–వంశ సూక్ష్మ కర్మ', domainEn: '12×12 ultra-fine ancestral division', shodasha: false, group: 'extended' },
];

function d30Sign(s: number, d: number): number {
  return s % 2 === 0
    ? d < 5 ? 0 : d < 10 ? 10 : d < 18 ? 8 : d < 25 ? 2 : 6
    : d < 5 ? 1 : d < 12 ? 5 : d < 20 ? 11 : d < 25 ? 9 : 7;
}

export function VG(lon: number, v: VargaNumber | number): number {
  const x = N(lon);
  const s = Math.floor(x / 30);
  const d = x % 30;
  const o = s % 2 === 0; // Aries=0 is odd sign in Vedic (1st sign)
  const m = s % 3;       // 0=movable, 1=fixed, 2=dual
  switch (v) {
    case 1:
      return s;
    case 2:
      return o ? (d < 15 ? 4 : 3) : (d < 15 ? 3 : 4);
    case 3:
      return (s + 4 * Math.floor(d / 10)) % 12;
    case 4:
      return (s + 3 * Math.floor(d / 7.5)) % 12;
    case 5: {
      // Parashari Panchamsha: Odd signs -> Aries, Aquarius, Sagittarius, Gemini, Libra; Even -> Taurus, Virgo, Pisces, Capricorn, Scorpio
      const part = Math.min(4, Math.floor(d / 6));
      const oddSeq = [0, 10, 8, 2, 6];
      const evenSeq = [1, 5, 11, 9, 7];
      return o ? oddSeq[part] : evenSeq[part];
    }
    case 6: {
      // Shashthamsha: Odd start Aries (0), Even start Libra (6)
      const part = Math.min(5, Math.floor(d / 5));
      return ((o ? 0 : 6) + part) % 12;
    }
    case 7:
      return (s + (o ? 0 : 6) + Math.min(6, Math.floor(d / (30 / 7)))) % 12;
    case 8: {
      // Ashtamsha: Movable -> Aries (0), Fixed -> Sagittarius (8), Dual -> Leo (4)
      const part = Math.min(7, Math.floor(d / 3.75));
      return ([0, 8, 4][m] + part) % 12;
    }
    case 9:
      return Math.floor(x / (10 / 3)) % 12;
    case 10:
      return (s + (o ? 0 : 8) + Math.min(9, Math.floor(d / 3))) % 12;
    case 11: {
      // Rudramsha / Ekadashamsha: count anti-zodiacally from Aries to natal sign, then advance zodiacally
      const part = Math.min(10, Math.floor(d / (30 / 11)));
      const start = (12 - s) % 12;
      return (start + part) % 12;
    }
    case 12:
      return (s + Math.min(11, Math.floor(d / 2.5))) % 12;
    case 16:
      return ([0, 4, 8][m] + Math.min(15, Math.floor(d / (30 / 16)))) % 12;
    case 20:
      return ([0, 8, 4][m] + Math.min(19, Math.floor(d / 1.5))) % 12;
    case 24:
      return ((o ? 4 : 3) + Math.min(23, Math.floor(d / 1.25))) % 12;
    case 27:
      return ([0, 3, 6, 9][s % 4] + Math.min(26, Math.floor(d / (30 / 27)))) % 12;
    case 30:
      return d30Sign(s, d);
    case 40:
      return ((o ? 0 : 6) + Math.min(39, Math.floor(d / 0.75))) % 12;
    case 45:
      return ([0, 4, 8][m] + Math.min(44, Math.floor(d / (30 / 45)))) % 12;
    case 60:
      return (s + Math.min(59, Math.floor(d * 2))) % 12;
    case 81:
      // Nava-Navamsha (continuous 81st parts from Aries = 108/9 * 360)
      return Math.floor(x / (30 / 81)) % 12;
    case 108: {
      // Ashtottaramsha (9 padas * 12 Dwadashamshas continuous from Aries or D9 + D12 synthesis)
      return Math.floor(x / (30 / 108)) % 12;
    }
    case 144: {
      // Dwadashamsha-Dwadashamsha: continuous 12th within D12 from D12 sign
      const d12 = (s + Math.min(11, Math.floor(d / 2.5))) % 12;
      const subD = (d % 2.5) * 12;
      return (d12 + Math.min(11, Math.floor(subD / 2.5))) % 12;
    }
    default:
      return s;
  }
}

export interface VargaChartData {
  v: VargaNumber;
  meta: VargaMeta;
  lagnaSign: number;
  planetSigns: Record<PlanetId, number>;
  planetHouses: Record<PlanetId, number>;
  vargottamaPlanets: PlanetId[];
}

export function buildVargaChart(chart: ComputedChart, v: VargaNumber): VargaChartData {
  const meta = ALL_VARGAS.find((item) => item.v === v) || ALL_VARGAS[0];
  const lagnaSign = VG(chart.lag, v);
  const planetSigns = {} as Record<PlanetId, number>;
  const planetHouses = {} as Record<PlanetId, number>;
  const vargottamaPlanets: PlanetId[] = [];
  for (const row of chart.rows) {
    const sg = VG(row.lon, v);
    planetSigns[row.id] = sg;
    planetHouses[row.id] = ((sg - lagnaSign + 12) % 12) + 1;
    if (v !== 1 && sg === row.sign) {
      vargottamaPlanets.push(row.id);
    }
  }
  return { v, meta, lagnaSign, planetSigns, planetHouses, vargottamaPlanets };
}

export function buildAllVargas(chart: ComputedChart): VargaChartData[] {
  return ALL_VARGAS.map((m) => buildVargaChart(chart, m.v));
}

export function vargottamaSummary(chart: ComputedChart): { planet: PlanetId; d1Sign: number; d9Sign: number; vargasMatched: number[] }[] {
  return chart.rows.map((row) => {
    const matched = ALL_VARGAS.filter((m) => m.v > 1 && VG(row.lon, m.v) === row.sign).map((m) => m.v);
    return { planet: row.id, d1Sign: row.sign, d9Sign: row.d9, vargasMatched: matched };
  });
}
