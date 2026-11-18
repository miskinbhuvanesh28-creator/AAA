import {
  EXA,
  NAK_DEITIES_EN,
  NAK_NAMES,
  NAK_SYLLABLES,
  NAK_SYLLABLES_EN,
  NAK_SYMBOLS_EN,
  NAK_SYMBOLS_TE,
  NAT_FRIENDS,
  OWN,
  PLANET_NAMES,
  SEVEN,
  SIGN_LORDS,
  SIGN_NAMES,
} from './constants.ts';
import { signedDiff } from './ephemeris.ts';
import type { ComputedChart, PlanetId, YogaResult } from './types.ts';

const YOGA_GANA = [0, 2, 2, 1, 0, 1, 0, 0, 2, 2, 2, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0]; // 0 Deva, 1 Manushya, 2 Rakshasa
const YOGA_NADI = [0, 2, 1, 2, 1, 0, 0, 1, 2, 0, 1, 2, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 2, 0, 1, 1, 2]; // 0 Adi, 1 Madhya, 2 Antya
const YONI_ANIMALS = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion'];
const YONI_MAP = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
const NAK_VARNA = ['Vaishya', 'Shudra', 'Brahmin', 'Shudra', 'Vaishya', 'Shudra', 'Brahmin', 'Kshatriya', 'Shudra', 'Shudra', 'Brahmin', 'Kshatriya', 'Vaishya', 'Vaishya', 'Shudra', 'Brahmin', 'Shudra', 'Vaishya', 'Shudra', 'Brahmin', 'Kshatriya', 'Vaishya', 'Vaishya', 'Shudra', 'Brahmin', 'Kshatriya', 'Shudra'];
const NAK_TATVA = ['Prithvi', 'Prithvi', 'Agni', 'Prithvi', 'Prithvi', 'Jala', 'Jala', 'Agni', 'Jala', 'Agni', 'Agni', 'Agni', 'Vayu', 'Agni', 'Vayu', 'Agni', 'Prithvi', 'Vayu', 'Vayu', 'Jala', 'Vayu', 'Vayu', 'Akasha', 'Akasha', 'Akasha', 'Akasha', 'Akasha'];

export interface NakshatraDetail {
  index: number;
  nameTe: string;
  nameEn: string;
  nameHi: string;
  lord: PlanetId;
  deity: string;
  symbolTe: string;
  symbolEn: string;
  gana: 'Deva' | 'Manushya' | 'Rakshasa';
  nadi: 'Adi' | 'Madhya' | 'Antya';
  yoni: string;
  varna: string;
  tatva: string;
  syllablesTe: string[];
  syllablesEn: string[];
  padas: { pada: number; navamshaSign: number; syllableTe: string; syllableEn: string }[];
}

const KO_RING: PlanetId[] = [7, 8, 0, 1, 2, 3, 4, 5, 6];

export const ALL_NAKSHATRAS: NakshatraDetail[] = Array.from({ length: 27 }, (_, i) => {
  const syTe = NAK_SYLLABLES[i].split(' ');
  const syEn = NAK_SYLLABLES_EN[i].split(' ');
  const gan = YOGA_GANA[i] === 0 ? 'Deva' : YOGA_GANA[i] === 1 ? 'Manushya' : 'Rakshasa';
  const nad = YOGA_NADI[i] === 0 ? 'Adi' : YOGA_NADI[i] === 1 ? 'Madhya' : 'Antya';
  return {
    index: i,
    nameTe: NAK_NAMES.te[i],
    nameEn: NAK_NAMES.en[i],
    nameHi: NAK_NAMES.hi[i],
    lord: KO_RING[i % 9],
    deity: NAK_DEITIES_EN[i],
    symbolTe: NAK_SYMBOLS_TE[i],
    symbolEn: NAK_SYMBOLS_EN[i],
    gana: gan,
    nadi: nad,
    yoni: YONI_ANIMALS[YONI_MAP[i]],
    varna: NAK_VARNA[i],
    tatva: NAK_TATVA[i],
    syllablesTe: syTe,
    syllablesEn: syEn,
    padas: [0, 1, 2, 3].map((p) => ({
      pada: p + 1,
      navamshaSign: (i * 4 + p) % 12,
      syllableTe: syTe[p] || '',
      syllableEn: syEn[p] || '',
    })),
  };
});

export function evaluateTaraChandraBala(natalMoonLon: number, targetMoonLon: number) {
  const bn = Math.floor(natalMoonLon / (40 / 3));
  const tn = Math.floor(targetMoonLon / (40 / 3));
  const taraIdx = (((tn - bn) % 27 + 27) % 27) % 9; // 0..8
  const taraNamesTe = ['జన్మ', 'సంపత్', 'విపత్', 'క్షేమ', 'ప్రత్యక్', 'సాధన', 'నైధన', 'మిత్ర', 'పరమమిత్ర'];
  const taraNamesEn = ['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyak', 'Sadhana', 'Naidhana', 'Mitra', 'Parama Mitra'];
  const taraFavorable = ![2, 4, 6].includes(taraIdx); // 3,5,7 in 1-based

  const bs = Math.floor(natalMoonLon / 30);
  const ts = Math.floor(targetMoonLon / 30);
  const chandraHouse = ((ts - bs + 12) % 12) + 1;
  const chandraFavorable = [1, 3, 6, 7, 10, 11].includes(chandraHouse);

  return {
    natalNk: bn,
    targetNk: tn,
    taraNumber: taraIdx + 1,
    taraNameTe: taraNamesTe[taraIdx],
    taraNameEn: taraNamesEn[taraIdx],
    taraFavorable,
    chandraHouse,
    chandraFavorable,
  };
}

export function evaluateYogas(p: number[], lagS: number): YogaResult[] {
  const s = p.map((x) => Math.floor(x / 30));
  const deg = p.map((x) => x % 30);
  const H = (i: number) => ((s[i] - lagS + 12) % 12) + 1;
  const HM = (i: number) => ((s[i] - s[1] + 12) % 12) + 1;
  const K = (h: number) => [1, 4, 7, 10].includes(h);
  const L = (h: number): PlanetId => SIGN_LORDS[(lagS + h - 1) % 12];
  const conj = (a: number, b: number) => s[a] === s[b];
  const asp7 = (a: number, b: number) => (s[a] - s[b] + 12) % 12 === 6;
  const exch = (a: number, b: number) => a !== b && SIGN_LORDS[s[a]] === b && SIGN_LORDS[s[b]] === a;
  const rel = (a: number, b: number) => (a === b ? 'Same Lord' : conj(a, b) ? 'Conjunction' : exch(a, b) ? 'Parivartana' : asp7(a, b) ? 'Mutual 7th Aspect' : null);
  const relTe = (a: number, b: number) => (a === b ? 'ఒకే అధిపతి' : conj(a, b) ? 'సంయోగం' : exch(a, b) ? 'పరివర్తన' : asp7(a, b) ? 'పరస్పర 7వ దృష్టి' : null);
  const strong = (id: number) => EXA[id] === s[id] || OWN[id]?.includes(s[id]);
  const deb = (id: number) => EXA[id] !== undefined && (EXA[id] + 6) % 12 === s[id];
  const out: YogaResult[] = [];
  const Nte = PLANET_NAMES.te;
  const Nen = PLANET_NAMES.en;

  // 1. Pancha Mahapurusha Yogas
  const mahapurusha: [PlanetId, string, string][] = [
    [2, 'రుచక యోగం', 'Ruchaka Yoga'],
    [6, 'భద్ర యోగం', 'Bhadra Yoga'],
    [4, 'హంస యోగం', 'Hamsa Yoga'],
    [8, 'మాళవ్య యోగం', 'Malavya Yoga'],
    [5, 'శశ యోగం', 'Shasha Yoga'],
  ];
  for (const [id, nTe, nEn] of mahapurusha) {
    const ok1 = strong(id);
    const ok2 = K(H(id));
    const combust = id !== 5 && Math.abs(signedDiff(p[id], p[0])) < 9;
    out.push({
      id: `pm-${id}`,
      n: `${nTe} (పంచ మహాపురుష)`,
      nEn: `${nEn} (Pancha Mahapurusha)`,
      src: 'Brihat Parashara Hora Shastra',
      category: 'panchamahapurusha',
      on: ok1 && ok2,
      cancelled: ok1 && ok2 && combust,
      why: `${Nte[id]} ${H(id)}వ భావంలో (${SIGN_NAMES.te[s[id]]})`,
      whyEn: `${Nen[id]} in House ${H(id)} (${SIGN_NAMES.en[s[id]]})`,
      planets: [id],
      c: [['స్వ/ఉచ్చ క్షేత్రం', ok1], ['లగ్నం నుండి కేంద్రం', ok2]],
      cancelNote: combust ? 'Close to Sun (combustion may weaken results)' : undefined,
    });
  }

  // 2. Gajakesari Yoga
  const gkDist = HM(4);
  const gk = K(gkDist);
  out.push({
    id: 'gajakesari',
    n: 'గజకేసరి యోగం',
    nEn: 'Gajakesari Yoga',
    src: 'BPHS / Phaladeepika',
    category: 'chandra',
    on: gk,
    cancelled: gk && deb(4),
    why: `చంద్రుని నుండి గురుడు ${gkDist}వ స్థానంలో`,
    whyEn: `Jupiter is in ${gkDist}th house from Moon`,
    planets: [1, 4],
    c: [['చంద్రునికి గురుడు కేంద్రంలో (1,4,7,10)', gk]],
    cancelNote: deb(4) ? 'Jupiter debilitated in Capricorn — reduced strength unless cancelled' : undefined,
  });

  // 3. Budhaditya Yoga
  const bu = s[0] === s[6];
  const buComb = bu && Math.abs(signedDiff(p[0], p[6])) < 3;
  out.push({
    id: 'budhaditya',
    n: 'బుధాదిత్య యోగం',
    nEn: 'Budhaditya Yoga',
    src: 'Classical Parashari',
    category: 'surya',
    on: bu,
    cancelled: buComb,
    why: bu ? `సూర్య–బుధులు ${SIGN_NAMES.te[s[0]]}లో (${Math.abs(deg[0] - deg[6]).toFixed(1)}° దూరం)` : 'సూర్య–బుధ సంయోగం లేదు',
    whyEn: bu ? `Sun & Mercury conjunct in ${SIGN_NAMES.en[s[0]]} (${Math.abs(signedDiff(p[0], p[6])).toFixed(1)}° apart)` : 'No Sun-Mercury sign conjunction',
    planets: [0, 6],
    c: [['సూర్య–బుధ యుతి', bu]],
    cancelNote: buComb ? 'Within 3° deep combustion — intellectual merit needs Mercury unafflicted' : undefined,
  });

  // 4. Chandra-Mangala Yoga
  const cm = conj(1, 2);
  out.push({
    id: 'chandra-mangala',
    n: 'చంద్ర–మంగళ యోగం',
    nEn: 'Chandra-Mangala Yoga',
    src: 'Brihat Jataka',
    category: 'chandra',
    on: cm,
    cancelled: cm && (deb(1) || deb(2)),
    why: cm ? `చంద్ర–కుజులు ${SIGN_NAMES.te[s[1]]}లో సంయోగం` : 'సంయోగం లేదు',
    whyEn: cm ? `Moon & Mars conjunct in ${SIGN_NAMES.en[s[1]]}` : 'Not conjunct',
    planets: [1, 2],
    c: [['చంద్ర–కుజ సంయోగం', cm]],
  });

  // 5. Sunapha, Anapha, Durudhara, Kemadruma
  const aroundMoon = (offset: number) => [2, 6, 4, 8, 5].filter((x) => HM(x) === offset) as PlanetId[];
  const suPl = aroundMoon(2);
  const anPl = aroundMoon(12);
  const near = [2, 6, 4, 8, 5].some((i) => [1, 11].includes((s[i] - s[1] + 12) % 12) || s[i] === s[1]);
  const kemCanc = K(H(1)) || [2, 6, 4, 8, 5].some((i) => K(HM(i)));

  out.push({
    id: 'sunapha',
    n: 'సునఫా యోగం',
    nEn: 'Sunapha Yoga',
    src: 'BPHS',
    category: 'chandra',
    on: suPl.length > 0,
    cancelled: false,
    why: suPl.length ? `చంద్రునికి 2వ స్థానంలో: ${suPl.map((x) => Nte[x]).join(', ')}` : 'చంద్రునికి 2వ స్థానంలో గ్రహాలు లేవు',
    whyEn: suPl.length ? `Planets in 2nd from Moon: ${suPl.map((x) => Nen[x]).join(', ')}` : 'No planets (excl. Sun/Nodes) in 2nd from Moon',
    planets: suPl,
    c: [['చంద్రునికి 2వ భావంలో గ్రహం', suPl.length > 0]],
  });
  out.push({
    id: 'anapha',
    n: 'అనఫా యోగం',
    nEn: 'Anapha Yoga',
    src: 'BPHS',
    category: 'chandra',
    on: anPl.length > 0,
    cancelled: false,
    why: anPl.length ? `చంద్రునికి 12వ స్థానంలో: ${anPl.map((x) => Nte[x]).join(', ')}` : 'చంద్రునికి 12వ స్థానంలో గ్రహాలు లేవు',
    whyEn: anPl.length ? `Planets in 12th from Moon: ${anPl.map((x) => Nen[x]).join(', ')}` : 'No planets in 12th from Moon',
    planets: anPl,
    c: [['చంద్రునికి 12వ భావంలో గ్రహం', anPl.length > 0]],
  });
  out.push({
    id: 'durudhara',
    n: 'దురుధర యోగం',
    nEn: 'Durudhara Yoga',
    src: 'BPHS',
    category: 'chandra',
    on: suPl.length > 0 && anPl.length > 0,
    cancelled: false,
    why: suPl.length > 0 && anPl.length > 0 ? 'చంద్రునికి ఇరువైపులా (2 & 12) గ్రహాలు ఉన్నాయి' : 'ఇరువైపులా గ్రహాలు లేవు',
    whyEn: suPl.length > 0 && anPl.length > 0 ? 'Planets on both 2nd and 12th sides of Moon' : 'Missing flanking planets on both sides of Moon',
    planets: [...suPl, ...anPl],
    c: [['2వ & 12వ స్థానాల్లో గ్రహాలు', suPl.length > 0 && anPl.length > 0]],
  });
  out.push({
    id: 'kemadruma',
    n: 'కేమద్రుమ యోగం (దోషం)',
    nEn: 'Kemadruma Yoga',
    src: 'BPHS',
    category: 'dosha',
    on: !near,
    cancelled: !near && kemCanc,
    why: !near ? (kemCanc ? 'చంద్రునికి 2/12 ఖాళీ — కానీ కేంద్ర బలం వల్ల భంగం' : 'చంద్రునికి ఇరువైపులా మరియు యుతిలో గ్రహాలు లేవు') : 'చంద్రునికి సమీపంలో గ్రహాలు ఉన్నాయి (కేమద్రుమ లేదు)',
    whyEn: !near ? (kemCanc ? '2nd/12th from Moon empty, but cancelled by Kendra strength' : 'No planets in 1st/2nd/12th from Moon') : 'Moon has flanking/conjunct planets',
    planets: [1],
    c: [['చంద్రునికి 1/2/12 లో గ్రహం లేదు', !near], ['భంగం: కేంద్రంలో చంద్రుడు/గ్రహం', kemCanc]],
  });

  // 6. Adhi Yoga
  const adhiHouses = [6, 7, 8].filter((h) => [6, 4, 8].some((b) => HM(b) === h));
  out.push({
    id: 'adhi',
    n: 'అధి యోగం',
    nEn: 'Adhi Yoga',
    src: 'BPHS',
    category: 'chandra',
    on: adhiHouses.length >= 2,
    cancelled: false,
    why: `చంద్రుని నుండి 6/7/8లో శుభులు: ${adhiHouses.length}/3 స్థానాలు`,
    whyEn: `Natural benefics in ${adhiHouses.length}/3 houses (6th, 7th, 8th from Moon)`,
    planets: [6, 4, 8],
    c: [['చంద్రుని నుండి 6/7/8లో బుధ/గురు/శుక్ర', adhiHouses.length >= 2]],
  });

  // 7. Dharma-Karmadhipati & Kendra-Trikona Rajayogas
  const l9 = L(9), l10 = L(10);
  const dkRel = rel(l9, l10);
  out.push({
    id: 'dharma-karma',
    n: 'ధర్మ–కర్మాధిపతి రాజయోగం',
    nEn: 'Dharma-Karmadhipati Rajayoga',
    src: 'BPHS',
    category: 'rajayoga',
    on: !!dkRel,
    cancelled: false,
    why: `9వ అధిపతి ${Nte[l9]}, 10వ అధిపతి ${Nte[l10]}${dkRel ? ' — ' + relTe(l9, l10) : ' — సంబంధం లేదు'}`,
    whyEn: `9th lord ${Nen[l9]} & 10th lord ${Nen[l10]}${dkRel ? ': ' + dkRel : ': No connection'}`,
    planets: [l9, l10],
    c: [['9–10 అధిపతుల సంబంధం', !!dkRel]],
  });

  const ktPairs: string[] = [];
  const ktPairsEn: string[] = [];
  for (const k of [4, 7, 10]) {
    for (const t of [1, 5, 9]) {
      const a = L(k), b = L(t);
      if (a !== b) {
        const r = rel(a, b);
        if (r) {
          ktPairs.push(`${k}వ–${t}వ (${Nte[a]}·${Nte[b]}: ${relTe(a, b)})`);
          ktPairsEn.push(`H${k}–H${t} (${Nen[a]}·${Nen[b]}: ${r})`);
        }
      }
    }
  }
  out.push({
    id: 'kendra-trikona',
    n: 'కేంద్ర–త్రికోణ రాజయోగం',
    nEn: 'Kendra-Trikona Rajayoga',
    src: 'BPHS',
    category: 'rajayoga',
    on: ktPairs.length > 0,
    cancelled: false,
    why: ktPairs.join('; ') || 'కేంద్ర–త్రికోణ అధిపతుల మధ్య ప్రత్యక్ష సంబంధం లేదు',
    whyEn: ktPairsEn.join('; ') || 'No direct Kendra-Trikona lord linkage',
    planets: [],
    c: [['కేంద్ర–త్రికోణ అధిపతుల యుతి/పరివర్తన/దృష్టి', ktPairs.length > 0]],
  });

  // 8. Dhana Yoga
  const dhPairs: string[] = [];
  for (const [a, b] of [[2, 11], [2, 5], [2, 9], [11, 5], [11, 9]]) {
    const x = L(a), y = L(b);
    const r = rel(x, y);
    if (r) dhPairs.push(`H${a}–H${b} (${Nen[x]}/${Nen[y]}: ${r})`);
  }
  out.push({
    id: 'dhana',
    n: 'ధన యోగం',
    nEn: 'Dhana Yoga (Wealth)',
    src: 'BPHS',
    category: 'dhana',
    on: dhPairs.length > 0,
    cancelled: false,
    why: dhPairs.join('; ') || '2/11 అధిపతులకు 5/9 అధిపతులతో సంబంధం లేదు',
    whyEn: dhPairs.join('; ') || 'No direct 2/11 with 5/9 lord linkage',
    planets: [],
    c: [['2/11 మరియు 5/9 అధిపతుల సంబంధం', dhPairs.length > 0]],
  });

  // 9. Vipareeta Rajayogas (Harsha, Sarala, Vimala)
  for (const [h, nameTe, nameEn] of [[6, 'హర్ష', 'Harsha'], [8, 'సరళ', 'Sarala'], [12, 'విమల', 'Vimala']] as [number, string, string][]) {
    const lord = L(h);
    const lh = H(lord);
    const ok = [6, 8, 12].includes(lh);
    out.push({
      id: `vipareeta-${h}`,
      n: `విపరీత రాజయోగం — ${nameTe}`,
      nEn: `Vipareeta Rajayoga — ${nameEn}`,
      src: 'Phaladeepika',
      category: 'rajayoga',
      on: ok,
      cancelled: false,
      why: `${h}వ అధిపతి ${Nte[lord]} ${lh}వ భావంలో`,
      whyEn: `${h}th lord ${Nen[lord]} placed in ${lh}th house`,
      planets: [lord],
      c: [[`${h}వ అధిపతి 6/8/12లో`, ok]],
    });
  }

  // 10. Lakshmi, Amala, Saraswati
  const l1 = L(1);
  const lakOk = strong(l9) && [1, 4, 5, 7, 9, 10].includes(H(l9)) && (strong(l1) || K(H(l1)));
  out.push({
    id: 'lakshmi',
    n: 'లక్ష్మీ యోగం',
    nEn: 'Lakshmi Yoga',
    src: 'BPHS',
    category: 'dhana',
    on: lakOk,
    cancelled: false,
    why: `9వ అధిపతి ${Nte[l9]} (${H(l9)}వ), లగ్నాధిపతి ${Nte[l1]} (${H(l1)}వ)`,
    whyEn: `9th lord ${Nen[l9]} in H${H(l9)}, Lagna lord ${Nen[l1]} in H${H(l1)}`,
    planets: [l9, l1],
    c: [['9వ అధిపతి బలంగా కేంద్ర/త్రికోణంలో', strong(l9) && [1, 4, 5, 7, 9, 10].includes(H(l9))]],
  });

  const amalaFromLagna = [0, 1, 2, 6, 4, 8, 5].filter((i) => H(i) === 10);
  const amalaOk = amalaFromLagna.length > 0 && amalaFromLagna.every((i) => [6, 4, 8].includes(i));
  out.push({
    id: 'amala',
    n: 'అమల యోగం',
    nEn: 'Amala Yoga',
    src: 'Classical Jyotisha',
    category: 'special',
    on: amalaOk,
    cancelled: false,
    why: `10వ భావంలో గ్రహాలు: ${amalaFromLagna.map((i) => Nte[i]).join(', ') || 'లేవు'}`,
    whyEn: `Planets in 10th from Lagna: ${amalaFromLagna.map((i) => Nen[i]).join(', ') || 'None'}`,
    planets: amalaFromLagna as PlanetId[],
    c: [['10వ భావంలో శుభగ్రహాలు మాత్రమే', amalaOk]],
  });

  const saraswatiOk = [6, 4, 8].every((b) => [1, 2, 4, 5, 7, 9, 10].includes(H(b))) && (strong(4) || NAT_FRIENDS[4].includes(SIGN_LORDS[s[4]]) || SIGN_LORDS[s[4]] === 4);
  out.push({
    id: 'saraswati',
    n: 'సరస్వతీ యోగం',
    nEn: 'Saraswati Yoga',
    src: 'Sarvartha Chintamani',
    category: 'special',
    on: saraswatiOk,
    cancelled: false,
    why: `బుధ(${H(6)}వ), గురు(${H(4)}వ), శుక్ర(${H(8)}వ) స్థితి`,
    whyEn: `Mercury(H${H(6)}), Jupiter(H${H(4)}), Venus(H${H(8)})`,
    planets: [6, 4, 8],
    c: [['బుధ/గురు/శుక్రులు కేంద్ర/త్రికోణ/2వ భావాల్లో', saraswatiOk]],
  });

  // 11. Neecha Bhanga Rajayoga
  for (const id of SEVEN) {
    if (!deb(id)) continue;
    const dl = SIGN_LORDS[s[id]];
    const exl = SIGN_LORDS[EXA[id]];
    const c1 = K(H(dl)) || K(HM(dl));
    const c2 = K(H(exl)) || K(HM(exl));
    const c3 = K(H(id)) || K(HM(id));
    out.push({
      id: `nbr-${id}`,
      n: `నీచభంగ రాజయోగం — ${Nte[id]}`,
      nEn: `Neecha Bhanga Rajayoga — ${Nen[id]}`,
      src: 'Phaladeepika',
      category: 'rajayoga',
      on: c1 || c2 || c3,
      cancelled: false,
      why: `${Nte[id]} నీచలో; నీచరాశి అధిపతి ${Nte[dl]} కేంద్రం:${c1 ? '✔' : '✖'}, ఉచ్చరాశి అధిపతి ${Nte[exl]} కేంద్రం:${c2 ? '✔' : '✖'}`,
      whyEn: `${Nen[id]} debilitated; dispositor ${Nen[dl]} in Kendra:${c1 ? 'Yes' : 'No'}, Exaltation lord ${Nen[exl]} in Kendra:${c2 ? 'Yes' : 'No'}`,
      planets: [id as PlanetId, dl, exl],
      c: [['నీచభంగ నియమం', c1 || c2 || c3]],
    });
  }

  // 12. Doshas: Kuja Dosha, Kaal Sarpa, Shakata, Grahana, Guru Chandala, Shrapita
  const kRefs: [number, string, string][] = [[lagS, 'లగ్నం', 'Lagna'], [s[1], 'చంద్రుడు', 'Moon'], [s[8], 'శుక్రుడు', 'Venus']];
  const marsH = ((s[2] - lagS + 12) % 12) + 1;
  const kujaOn = [1, 2, 4, 7, 8, 12].includes(marsH);
  const kujaCancel = OWN[2].includes(s[2]) || EXA[2] === s[2] || conj(2, 4) || (marsH === 2 && [2, 5].includes(s[2])) || (marsH === 12 && [1, 6].includes(s[2]));
  out.push({
    id: 'kuja-dosha',
    n: 'కుజ (మంగళ) దోషం',
    nEn: 'Kuja (Mangal) Dosha',
    src: 'South Indian Tradition (1,2,4,7,8,12)',
    category: 'dosha',
    on: kujaOn,
    cancelled: kujaOn && kujaCancel,
    why: kRefs.map(([ref, lbl]) => `${lbl} నుండి ${((s[2] - ref + 12) % 12) + 1}వ`).join(' · '),
    whyEn: kRefs.map(([ref, , lbl]) => `H${((s[2] - ref + 12) % 12) + 1} from ${lbl}`).join(' · '),
    planets: [2],
    c: [['కుజుడు 1,2,4,7,8,12 భావాల్లో', kujaOn]],
    cancelNote: kujaCancel ? 'Cancelled by own/exalted Mars, Jupiter conjunction, or sign exception' : undefined,
  });

  const arc = (i: number) => ((p[i] - p[3] + 360) % 360);
  const ks = SEVEN.every((i) => arc(i) < 180) || SEVEN.every((i) => arc(i) > 180);
  out.push({
    id: 'kaalsarpa',
    n: 'కాలసర్ప యోగం',
    nEn: 'Kaal Sarpa Yoga',
    src: 'Modern Traditional',
    category: 'dosha',
    on: ks,
    cancelled: false,
    why: ks ? 'ఏడు గ్రహాలూ రాహు–కేతు అక్షానికి ఒకే వైపున ఉన్నాయి' : 'రాహు–కేతు అక్షానికి ఇరువైపులా గ్రహాలు ఉన్నాయి',
    whyEn: ks ? 'All 7 planets hemmed within the Rahu–Ketu axis' : 'Planets distributed on both sides of the nodal axis',
    planets: [3, 7],
    c: [['7 గ్రహాలు రాహు–కేతు మధ్య', ks]],
  });

  const shakataOn = [6, 8, 12].includes(HM(1));
  const shakataCanc = K(H(1));
  out.push({
    id: 'shakata',
    n: 'శకట యోగం',
    nEn: 'Shakata Yoga',
    src: 'BPHS',
    category: 'dosha',
    on: shakataOn && !shakataCanc,
    cancelled: shakataOn && shakataCanc,
    why: `గురువు నుండి చంద్రుడు ${((s[1] - s[4] + 12) % 12) + 1}వ స్థానంలో${shakataOn && shakataCanc ? ' (లగ్న కేంద్రం వల్ల భంగం)' : ''}`,
    whyEn: `Moon in ${((s[1] - s[4] + 12) % 12) + 1}th from Jupiter${shakataOn && shakataCanc ? ' (Cancelled: Moon in Lagna Kendra)' : ''}`,
    planets: [1, 4],
    c: [['గురువు నుండి చంద్రుడు 6/8/12లో', shakataOn], ['లగ్న కేంద్ర భంగం లేదు', !shakataCanc]],
  });

  const sunEcl = conj(0, 3) || conj(0, 7);
  const monEcl = conj(1, 3) || conj(1, 7);
  out.push({
    id: 'grahana',
    n: 'గ్రహణ దోషం',
    nEn: 'Grahana Dosha',
    src: 'Classical',
    category: 'dosha',
    on: sunEcl || monEcl,
    cancelled: false,
    why: [sunEcl ? 'సూర్యుడు నోడ్‌తో' : '', monEcl ? 'చంద్రుడు నోడ్‌తో' : ''].filter(Boolean).join('; ') || 'గ్రహణ సంయోగం లేదు',
    whyEn: [sunEcl ? 'Sun with Rahu/Ketu' : '', monEcl ? 'Moon with Rahu/Ketu' : ''].filter(Boolean).join('; ') || 'No luminary–node conjunction',
    planets: [0, 1, 3, 7],
    c: [['సూర్య/చంద్రులకు రాహు–కేతు యుతి', sunEcl || monEcl]],
  });

  out.push({
    id: 'guru-chandala',
    n: 'గురు చండాల దోషం',
    nEn: 'Guru Chandala Dosha',
    src: 'Classical',
    category: 'dosha',
    on: conj(4, 3),
    cancelled: conj(4, 3) && strong(4),
    why: conj(4, 3) ? `గురు–రాహువులు ${SIGN_NAMES.te[s[4]]}లో కలిసి ఉన్నారు` : 'గురు–రాహు సంయోగం లేదు',
    whyEn: conj(4, 3) ? `Jupiter & Rahu conjunct in ${SIGN_NAMES.en[s[4]]}` : 'No Jupiter-Rahu conjunction',
    planets: [4, 3],
    c: [['గురు–రాహు యుతి', conj(4, 3)]],
  });

  out.push({
    id: 'shrapita',
    n: 'శ్రాపిత దోషం',
    nEn: 'Shrapita Yoga',
    src: 'Classical',
    category: 'dosha',
    on: conj(5, 3),
    cancelled: false,
    why: conj(5, 3) ? `శని–రాహువులు ${SIGN_NAMES.te[s[5]]}లో కలిసి ఉన్నారు` : 'శని–రాహు సంయోగం లేదు',
    whyEn: conj(5, 3) ? `Saturn & Rahu conjunct in ${SIGN_NAMES.en[s[5]]}` : 'No Saturn-Rahu conjunction',
    planets: [5, 3],
    c: [['శని–రాహు యుతి', conj(5, 3)]],
  });

  return out;
}
