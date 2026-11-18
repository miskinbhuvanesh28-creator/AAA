export type Language = 'te' | 'en' | 'hi';

export type PlanetId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 0:Su, 1:Mo, 2:Ma, 3:Ra, 4:Ju, 5:Sa, 6:Me, 7:Ke, 8:Ve

export type OuterPlanetKey = 'Ur' | 'Ne' | 'Pl';

export type HouseSystem = 'placidus' | 'whole' | 'equal' | 'sripati';

export type NodeType = 'mean' | 'true';

export type KpMode = 'new' | 'old';

export type KarakaMode = '7' | '8';

export type CalendarSystem = 'amanta' | 'purnimanta';

export type ChartStyle = 'south' | 'north' | 'western';

export interface BirthInput {
  y: number;
  m: number;
  d: number;
  hh: number;
  mi: number;
  ss: number;
  lat: number;
  lon: number;
  tz: number;
  ay: number;
  name?: string;
  place?: string;
}

export interface BirthProfile extends BirthInput {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  place: string;
  timezoneId?: string;
  birthTimeKnown: boolean;
  isDefault?: boolean;
  isArchived?: boolean;
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalcConfig {
  ay: number;
  sidereal: boolean;
  houseSystem: HouseSystem;
  nodeType: NodeType;
  kpMode: KpMode;
  karakaMode: KarakaMode;
  calendarSystem: CalendarSystem;
}

export type DignityKey =
  | 'exalted'
  | 'debilitated'
  | 'moolatrikona'
  | 'own'
  | 'adhimitra'
  | 'mitra'
  | 'sama'
  | 'shatru'
  | 'adhishatru'
  | 'none';

export interface PlanetRow {
  id: PlanetId;
  lon: number;          // Sidereal (or Tropical when sidereal=false) 0..360
  tropicalLon: number;  // Always tropical 0..360
  lat: number;          // Ecliptic latitude (deg)
  dec: number;          // Declination (deg)
  ra: number;           // Right Ascension (deg)
  sign: number;         // 0..11
  degInSign: number;    // 0..30
  nk: number;           // 0..26
  pada: number;         // 1..4
  sub: [PlanetId, PlanetId, PlanetId]; // [StarLord, SubLord, SubSubLord]
  house: number;        // Whole-sign house from Lagna 1..12
  bhava: number;        // House in active houseSystem (Placidus/Whole/Equal/Sripati) 1..12
  placidusHouse: number; // Always Placidus house 1..12
  spd: number;          // Daily speed (deg/day)
  retro: boolean;
  stationary: boolean;  // |spd| < 0.05 (non-luminaries/nodes)
  combust: boolean;
  combustOrb: number | null;
  dig: string;          // Telugu label
  digKey: DignityKey;
  d9: number;           // Navamsha sign 0..11
  vgt: boolean;         // Vargottama
}

export interface OuterPlanetRow {
  key: OuterPlanetKey;
  nameEn: string;
  nameTe: string;
  lon: number;
  tropicalLon: number;
  sign: number;
  degInSign: number;
  house: number;
  bhava: number;
  spd: number;
  retro: boolean;
}

export interface PanchangSummary {
  tithi: string;
  tithiEn: string;
  paksha: string;
  pakshaEn: string;
  tn: number;           // 1..30
  tithiPct: number;     // 0..100 elapsed
  yoga: string;
  yogaEn: string;
  yogaIndex: number;
  yogaPct: number;
  karana: string;
  karanaEn: string;
  karanaIndex: number;
  nk: number;
  nkPct: number;
  wd: number;           // 0..6 (Sun..Sat)
  sr: number;           // Sunrise JD
  ss: number;           // Sunset JD
  sn: number;           // Next sunrise JD
  rahu: [number, number];
  yama: [number, number];
  gulika: [number, number];
  abhijit: [number, number];
}

export interface AshtakavargaResult {
  bav: Record<number, number[]>;
  sav: number[];
  trikonaBav: Record<number, number[]>;
  ekadhipatyaBav: Record<number, number[]>;
  rashiPinda: Record<number, number>;
  grahaPinda: Record<number, number>;
  sodhyaPinda: Record<number, number>;
}

export interface YogaResult {
  id: string;
  n: string;
  nEn: string;
  src: string;
  category: 'rajayoga' | 'dhana' | 'panchamahapurusha' | 'chandra' | 'surya' | 'dosha' | 'special';
  on: boolean;
  cancelled: boolean;
  why: string;
  whyEn: string;
  planets: PlanetId[];
  c: [string, boolean][];
  cancelNote?: string;
}

export interface KpData {
  cusps: number[];
  cuspSubs: { house: number; lon: number; sign: number; starLord: PlanetId; subLord: PlanetId; subSubLord: PlanetId }[];
  house: Record<PlanetId, number>;
  sig: Record<PlanetId, number[]>; // 4-fold planetary significators
  cuspSig: Record<number, PlanetId[]>; // Cusp significators
}

export interface ComputedChart {
  inp: BirthInput;
  config: CalcConfig;
  jd: number;
  T: number;
  ay: number;           // Active Ayanamsha degrees (0 in tropical mode)
  ayVal: number;        // Selected Ayanamsha value even if tropical
  p: number[];          // 9 planetary longitudes
  ptrop: number[];      // 9 tropical longitudes
  cu: number[];         // Active house cusps (12)
  placidusCu: number[]; // Placidus cusps (12)
  s: number[];          // 9 signs (0..11)
  lagS: number;         // Lagna sign (0..11)
  lag: number;          // Lagna degree (0..360)
  mc: number;           // Midheaven degree
  rows: PlanetRow[];
  outerPlanets: OuterPlanetRow[];
  kp: KpData;
  spd: number[];
  asht: AshtakavargaResult;
  yogas: YogaResult[];
  karakas: { role: string; roleEn: string; planet: PlanetId; deg: number }[];
  AL: number;
  UL: number;
  arudhas: Record<number, number>;
  pan: PanchangSummary;
  t0: number;           // Unix ms
}

export interface LifeEvent {
  id: string;
  profileId: string;
  title: string;
  category:
    | 'marriage'
    | 'career'
    | 'education'
    | 'childbirth'
    | 'property'
    | 'travel'
    | 'health'
    | 'relocation'
    | 'accident'
    | 'business'
    | 'other';
  eventDate: string; // YYYY-MM-DD
  notes?: string;
}
