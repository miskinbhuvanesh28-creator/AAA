import { NAK_NAMES, PLANET_NAMES, SIGN_LORDS, SIGN_NAMES, pName, planetSymbols, sName } from './constants.ts';
import { computeAshtottari, computeCharaDasha, computeVimshottari, computeYogini, findActiveVimshottari } from './dasha.ts';
import { computeDeepPlanetaryInsights, computeNeechabhangaAnalysis } from './deepInsights.ts';
import { formatDms } from './ephemeris.ts';
import { computeTransitReport, computeVarshaphala } from './gocharaVarshaRect.ts';
import { computeJaiminiSummary } from './jaimini.ts';
import { KP_EVENTS, evaluateKpEvent } from './kp.ts';
import { computeDispositorChains, getFunctionalNature } from './parashari.ts';
import { evaluateGemstoneRecommendations } from './remediesGemstones.ts';
import { computeBhavaBala, computeShadbala, computeVimsopaka } from './strength.ts';
import type { BirthProfile, ComputedChart, Language } from './types.ts';
import { ALL_VARGAS, buildVargaChart } from './vargas.ts';

export type ReportDepth = 'quick' | 'detailed' | 'complete' | 'research';

export interface ReportTypeMeta {
  id: string;
  titleEn: string;
  titleTe: string;
  category: string;
  description: string;
  descriptionTe: string;
}

export const REPORT_TYPES: ReportTypeMeta[] = [
  { id: 'telugu-jathakam', titleEn: 'Telugu Sampoorna Jathakam', titleTe: 'తెలుగు సంపూర్ణ జాతకం (ప్రత్యేక పట్టిక)', category: 'Telugu', description: 'Traditional Telugu Lagna, Panchanga, Dasha, Yogas & Graha Phalalu', descriptionTe: 'సంప్రదాయ తెలుగు జన్మ పత్రిక: పంచాంగం, లగ్న బలం, యోగాలు & దశా ఫలితాలు' },
  { id: 'complete-horoscope', titleEn: 'Complete Birth Horoscope', titleTe: 'సంపూర్ణ జన్మ జాతక నివేదిక', category: 'Core', description: 'D1/D9 charts, planets, Shadbala, Ashtakavarga, Yogas & Vimshottari Dasha', descriptionTe: 'D1/D9 చక్రాలు, గ్రహ స్థితి, షడ్బల, అష్టకవర్గ, యోగాలు & వింశోత్తరి దశ' },
  { id: 'parashari-reading', titleEn: 'Parashari Reading', titleTe: 'పరాశరీ సమగ్ర విశ్లేషణ', category: 'Parashari', description: 'Houses, functional nature, dispositor chains, dignities & Yogas', descriptionTe: 'భావాలు, గ్రహ మైత్రి, కారకత్వం, స్థితులు & యోగాలు' },
  { id: 'kp-report', titleEn: 'KP Astrology Report', titleTe: 'KP నక్షత్ర–సబ్ నివేదిక', category: 'KP', description: 'Placidus cusps, sub-lords, 4-fold significators & 8 life domains', descriptionTe: 'ప్లాసిడస్ కస్ప్‌లు, సబ్ లార్డ్‌లు, 4-స్థాయి కారకత్వాలు & ముఖ్య అంశాలు' },
  { id: 'jaimini-report', titleEn: 'Jaimini Report', titleTe: 'జైమినీ సూత్ర నివేదిక', category: 'Jaimini', description: 'Chara Karakas, Karakamsha, AL/UL/A1–A12 & Chara Dasha', descriptionTe: 'చర కారకులు, కారకాంశ, ఆరూఢాలు (AL/UL) & చర దశ' },
  { id: 'divisional-report', titleEn: '23-Varga Divisional Report', titleTe: 'షోడశ & అతిసూక్ష్మ వర్గ నివేదిక', category: 'Vargas', description: 'All 23 divisional charts (D1–D144) and Vargottama matrix', descriptionTe: 'అన్ని 23 విభాగ చక్రాలు (D1–D144) మరియు వర్గోత్తమ పట్టిక' },
  { id: 'shadbala-report', titleEn: 'Shadbala & Strength Report', titleTe: 'షడ్బల & భావబల నివేదిక', category: 'Strength', description: 'Full 6-fold planetary strength, Bhava Bala & Vimsopaka', descriptionTe: 'సంపూర్ణ ఆరు విధాల గ్రహబలం, భావబలం & వింశోపక బలం' },
  { id: 'ashtakavarga-report', titleEn: 'Ashtakavarga Report', titleTe: 'అష్టకవర్గ సమగ్ర నివేదిక', category: 'Strength', description: 'BAV, SAV (337), Trikona & Ekadhipatya Shodhana & Sodhya Pinda', descriptionTe: 'భిన్నాష్టక, సర్వాష్టకవర్గ (337), త్రికోణ & ఏకాధిపత్య శోధనలు' },
  { id: 'yoga-dosha-report', titleEn: 'Yoga & Dosha Report', titleTe: 'యోగ & దోష విశ్లేషణ నివేదిక', category: 'Yogas', description: 'Rajayogas, Dhana, Panchamahapurusha, Kuja & Kaal Sarpa', descriptionTe: 'రాజయోగాలు, ధనయోగం, పంచమహాపురుష, కుజ & కాలసర్ప దోషాలు' },
  { id: 'dasha-report', titleEn: 'Multi-System Dasha Report', titleTe: 'బహుళ దశా కాల నివేదిక', category: 'Dashas', description: 'Vimshottari, Yogini, Ashtottari & Chara Dasha timelines', descriptionTe: 'వింశోత్తరి, యోగిని, అష్టోత్తరి, చర, శూల & మండూక దశలు' },
  { id: 'transit-report', titleEn: 'Gochara & Transit Report', titleTe: 'గోచార & ఏలినాటి నివేదిక', category: 'Transits', description: 'Current transits, Sade Sati schedule, Double Transit & 7-day curve', descriptionTe: 'ప్రస్తుత గ్రహ సంచారం, ఏలినాటి శని, ద్వంద్వ సంచారం' },
  { id: 'annual-varshaphala', titleEn: 'Annual Varshaphala Report', titleTe: 'వార్షిక వర్షఫల నివేదిక', category: 'Annual', description: 'Solar Return chart, Muntha, Varshesha, Sahams & Mudda Dasha', descriptionTe: 'సూర్య పునరాగమన కుండలి, ముంథా, వర్షేశుడు, సహములు & ముద్దా దశ' },
  { id: 'career-report', titleEn: 'Career & Profession Report', titleTe: 'వృత్తి & ఉద్యోగ నివేదిక', category: 'Life Domain', description: '10th house, D10 Dashamsha, AmK, Saturn & KP 6/10 analysis', descriptionTe: 'దశమ భావం, D10 దశాంశ, అమాత్యకారకుడు & వృత్తి యోగాలు' },
  { id: 'marriage-report', titleEn: 'Marriage & Relationships Report', titleTe: 'వివాహ & దాంపత్య నివేదిక', category: 'Life Domain', description: '7th house, D9 Navamsha, Venus/Jupiter, UL & Kuja Dosha check', descriptionTe: 'సప్తమ భావం, D9 నవాంశ, ఉపపద లగ్నం & కుజదోష పరిశీలన' },
  { id: 'compatibility-report', titleEn: 'Compatibility / Matchmaking Report', titleTe: 'వివాహ పొంతన నివేదిక', category: 'Matchmaking', description: 'Ashtakoota (36), Dashakoota (10) & Kuja comparison', descriptionTe: 'అష్టకూట (36 గుణాలు), దశకూట పొంతనలు & కుజదోష తులన' },
  { id: 'wealth-report', titleEn: 'Wealth & Finance Report', titleTe: 'ధన & ఆర్ధిక నివేదిక', category: 'Life Domain', description: '2nd/11th houses, D2 Hora, Dhana Yogas & Ashtakavarga', descriptionTe: '2/11 భావాలు, D2 హోరా చక్రం, ధనయోగాలు & ఆర్థిక స్థిరత్వం' },
  { id: 'business-report', titleEn: 'Business & Entrepreneurship Report', titleTe: 'వ్యాపార & వాణిజ్య నివేదిక', category: 'Life Domain', description: '3rd/7th/10th/11th houses, Mercury & KP business significators', descriptionTe: 'వ్యాపార భావాలు (3/7/10/11), బుధ బలం & KP సూచికలు' },
  { id: 'education-report', titleEn: 'Education & Intellect Report', titleTe: 'విద్య & విజ్ఞాన నివేదిక', category: 'Life Domain', description: '4th/5th/9th houses, D24 Siddhamsha, Mercury & Jupiter', descriptionTe: 'విద్యా స్థానాలు (4/5/9), D24 చతుర్వింశాంశ, బుధ–గురు బలం' },
  { id: 'property-report', titleEn: 'Property & Vehicle Report', titleTe: 'భూమి, గృహ & వాహన నివేదిక', category: 'Life Domain', description: '4th house, D4 Chaturthamsha, D16 Shodashamsha & Mars/Venus', descriptionTe: 'చతుర్థ భావం, D4 చతుర్థాంశ, D16 షోడశాంశ & భూ–వాహన యోగాలు' },
  { id: 'foreign-report', titleEn: 'Foreign Travel & Settlement Report', titleTe: 'విదేశ ప్రయాణ నివేదిక', category: 'Life Domain', description: '9th/12th houses, Rahu/Moon & KP 3/9/12 significators', descriptionTe: '9/12 స్థానాలు, రాహు–చంద్ర బలం & విదేశీ స్థిరనివాస సూచికలు' },
  { id: 'spiritual-report', titleEn: 'Spirituality & Dharma Report', titleTe: 'ఆధ్యాత్మిక & ధర్మ నివేదిక', category: 'Life Domain', description: '9th/12th/5th houses, D20 Vimshamsha, Atmakaraka & Moksha trikona', descriptionTe: '5/9/12 మోక్ష త్రికోణం, D20 వింశాంశ & ఆత్మకారక విశ్లేషణ' },
  { id: 'panchanga-report', titleEn: 'Panchanga & Calendar Report', titleTe: 'పంచాంగ & శుభ కాల నివేదిక', category: 'Calendar', description: 'Tithi, Vara, Nakshatra, Yoga, Karana, Choghadiya & Hora', descriptionTe: 'తిథి, వార, నక్షత్ర, యోగ, కరణాలు, రాహుకాలం & హోరా పట్టిక' },
  { id: 'muhurta-report', titleEn: 'Muhurta Selection Report', titleTe: 'ముహూర్త నిర్ణయ నివేదిక', category: 'Muhurta', description: 'Electional Panchanga, Tara Bala, Chandra Bala & auspicious windows', descriptionTe: 'తారాబలం, చంద్రబలం & శుభ ముహూర్త సమయాల శోధన' },
  { id: 'prashna-report', titleEn: 'Prashna & Horary Report', titleTe: 'ప్రశ్న & KP హోరరీ నివేదిక', category: 'Prashna', description: 'Moment/1–249 Horary chart, Ruling Planets & significator synthesis', descriptionTe: 'తక్షణ ప్రశ్న కుండలి, KP 1–249 హోరరీ & పాలక గ్రహ విశ్లేషణ' },
  { id: 'rectification-report', titleEn: 'Birth-Time Rectification Report', titleTe: 'జన్మ సమయ సవరణ నివేదిక', category: 'Rectification', description: 'Cusp sensitivity & life-event Dasha verification summary', descriptionTe: 'లగ్న/సబ్ లార్డ్ సున్నితత్వం & జీవిత సంఘటనల దశా సరిపోలిక' },
  { id: 'numerology-report', titleEn: 'Numerology Report', titleTe: 'సంఖ్యాశాస్త్ర నివేదిక', category: 'Numerology', description: 'Vedic, Chaldean, Pythagorean & Lo Shu harmony synthesis', descriptionTe: 'మూలాంక్, భాగ్యాంక్, కల్డియన్/పైథాగరియన్ & లో షు గ్రిడ్ విశ్లేషణ' },
  { id: 'custom-report', titleEn: 'Custom Astrologer Report', titleTe: 'అనుకూలీకరించిన ప్రత్యేక నివేదిక', category: 'Custom', description: 'Modular synthesis tailored by the consulting astrologer', descriptionTe: 'జ్యోతిష పండితుల సూచనలతో రూపొందించిన ప్రత్యేక నివేదిక' },
];

export interface ReportSection {
  id: string;
  heading: string;
  summary: string;
  table?: { headers: string[]; rows: string[][] };
  notes?: string;
}

export interface GeneratedReportDocument {
  reportType: string;
  title: string;
  depth: ReportDepth;
  language: Language;
  generatedAt: string;
  profileName: string;
  sections: ReportSection[];
}

export function generateStructuredReport(
  typeId: string,
  profile: BirthProfile,
  chart: ComputedChart,
  depth: ReportDepth = 'detailed',
  lang: Language = 'te',
): GeneratedReportDocument {
  const meta = REPORT_TYPES.find((r) => r.id === typeId) || REPORT_TYPES[0];
  const title = lang === 'te' ? `${profile.name} — ${meta.titleTe}` : `${profile.name} — ${meta.titleEn}`;
  const isTe = lang === 'te';

  const shadbala = computeShadbala(chart);
  const bhavaBala = computeBhavaBala(chart, shadbala);
  const vimsopaka = computeVimsopaka(chart);
  const jaimini = computeJaiminiSummary(chart);
  const activeVim = findActiveVimshottari(chart.p[1], chart.t0);
  const fnNature = getFunctionalNature(chart.lagS);
  const transits = computeTransitReport(chart);
  const varsha = computeVarshaphala(chart, new Date().getFullYear());

  const birthMetaSec: ReportSection = {
    id: 'birth-meta',
    heading: isTe ? '1. జన్మ వివరాలు & మూల పంచాంగం' : '1. Birth Particulars & Natal Panchanga',
    summary: isTe
      ? `${profile.name} గారి జన్మ లగ్నం ${sName(chart.lagS, 'te')} (${formatDms(chart.lag % 30)}), చంద్ర రాశి ${sName(chart.s[1], 'te')}, జన్మ నక్షత్రం ${NAK_NAMES.te[chart.pan.nk]} (${chart.rows[1].pada}వ పాదం). అయనాంశ: ${chart.ayVal.toFixed(4)}°.`
      : `${profile.name} rises in ${sName(chart.lagS, 'en')} Lagna (${formatDms(chart.lag % 30)}), with Moon in ${sName(chart.s[1], 'en')} and birth star ${NAK_NAMES.en[chart.pan.nk]} Pada ${chart.rows[1].pada}. Active Ayanamsha: ${chart.ayVal.toFixed(4)}°.`,
    table: {
      headers: isTe ? ['అంశం', 'విలువ'] : ['Parameter', 'Value'],
      rows: [
        [isTe ? 'తేదీ / సమయం' : 'Date / Time', `${profile.y}-${String(profile.m).padStart(2, '0')}-${String(profile.d).padStart(2, '0')} ${String(profile.hh).padStart(2, '0')}:${String(profile.mi).padStart(2, '0')} (UTC${profile.tz >= 0 ? '+' : ''}${profile.tz})`],
        [isTe ? 'జన్మ స్థలం' : 'Birth Place', `${profile.place} (${profile.lat.toFixed(4)}, ${profile.lon.toFixed(4)})`],
        [isTe ? 'తిథి / పక్షం' : 'Tithi / Paksha', `${isTe ? chart.pan.paksha : chart.pan.pakshaEn} ${isTe ? chart.pan.tithi : chart.pan.tithiEn}`],
        [isTe ? 'యోగం / కరణం' : 'Yoga / Karana', `${isTe ? chart.pan.yoga : chart.pan.yogaEn} / ${isTe ? chart.pan.karana : chart.pan.karanaEn}`],
        [isTe ? 'ప్రస్తుత దశ' : 'Current Vimshottari', `${pName(activeVim.maha.lord as any, lang)} → ${pName(activeVim.antar.lord as any, lang)} → ${pName(activeVim.pratyantar.lord as any, lang)}`],
      ],
    },
  };

  const planetSec: ReportSection = {
    id: 'planets',
    heading: isTe ? '2. గ్రహ స్థాన పట్టిక (రాశి, నక్షత్రం, D9, KP సబ్)' : '2. Planetary Longitudes & Classical Dignities',
    summary: isTe
      ? 'నవగ్రహాల రాశి, డిగ్రీ, నక్షత్ర పాదం, నవాంశ స్థితి, దిగ్వివరణ మరియు చలన స్థితి క్రింది పట్టికలో ఇవ్వబడింది.'
      : 'Complete sidereal longitudes, house placements, Nakshatra–Pada, KP Star/Sub lords, dignity, and Navamsha coordinates.',
    table: {
      headers: isTe ? ['గ్రహం', 'చిహ్నాలు', 'రాశి · డిగ్రీ', 'భావం', 'నక్షత్రం (పా)', 'సబ్ లార్డ్', 'స్థితి', 'D9'] : ['Planet', 'Symbols', 'Sign · Deg', 'House', 'Star (Pada)', 'KP Sub', 'Dignity', 'D9'],
      rows: chart.rows.map((r) => [
        pName(r.id, lang),
        planetSymbols(r) || '—',
        `${sName(r.sign, lang)} ${formatDms(r.degInSign)}`,
        `H${r.house} (${isTe ? 'భా:' : 'Bh:'}${r.bhava})`,
        `${NAK_NAMES[lang][r.nk]} (${r.pada})`,
        `${pName(r.sub[0], lang)} / ${pName(r.sub[1], lang)}`,
        `${r.dig} (${fnNature.byPlanet[r.id]?.role ?? (isTe ? 'ఛాయా' : 'Node')})`,
        `${sName(r.d9, lang)}${r.vgt ? ' ▫' : ''}`,
      ]),
    },
  };

  const strengthSec: ReportSection = {
    id: 'strength',
    heading: isTe ? '3. షడ్బల & అష్టకవర్గ సారాంశం' : '3. Shadbala & Ashtakavarga Strength Profile',
    summary: isTe
      ? `మొత్తం సర్వాష్టకవర్గ బిందువులు 337. బలమైన భావాలు మరియు గ్రహాల విరూప/రూప నిష్పత్తులు ఈ క్రింద ఉన్నాయి.`
      : 'Six-fold Shadbala Rupas vs BPHS minimums alongside Ishta/Kashta Phala and Shodashavarga Vimsopaka scores.',
    table: {
      headers: isTe ? ['గ్రహం', 'స్థాన', 'దిగ్', 'కాల', 'చేష్ట', 'నైసర్గిక', 'దృక్', 'మొత్తం రూపాలు', 'నిష్పత్తి %'] : ['Planet', 'Sthana', 'Dig', 'Kala', 'Cheshta', 'Nais.', 'Drik', 'Total Rupas', 'Req %'],
      rows: shadbala.map((s) => [
        pName(s.id, lang),
        s.sthana.total.toFixed(1),
        s.dig.toFixed(1),
        s.kala.total.toFixed(1),
        s.cheshta.toFixed(1),
        s.naisargika.toFixed(1),
        s.drik.toFixed(1),
        s.totalRupas.toFixed(2),
        `${s.ratioPct.toFixed(0)}%`,
      ]),
    },
  };

  const yogaSec: ReportSection = {
    id: 'yogas',
    heading: isTe ? '4. ముఖ్య యోగాలు & దోష పరిశీలన' : '4. Classical Yogas & Dosha Assessment',
    summary: isTe
      ? `చార్ట్‌లో క్రియాశీలకంగా ఉన్న యోగాలు: ${chart.yogas.filter((y) => y.on).map((y) => y.n).join(', ') || 'లేవు'}.`
      : `Active classical formations detected: ${chart.yogas.filter((y) => y.on).map((y) => y.nEn).join(', ') || 'None'}.`,
    table: {
      headers: isTe ? ['యోగం/దోషం', 'స్థితి', 'ఆధారం / నియమం'] : ['Yoga / Dosha', 'Status', 'Evidence'],
      rows: chart.yogas.map((y) => [
        isTe ? y.n : y.nEn,
        y.on
          ? (y.cancelled ? (isTe ? 'క్రియాశీలం (భంగం)' : 'Active (Mitigated)') : (isTe ? 'క్రియాశీలం' : 'Active'))
          : (isTe ? 'లేదు' : 'Inactive'),
        isTe ? y.why : y.whyEn,
      ]),
    },
  };

  const dashaSec: ReportSection = {
    id: 'dashas',
    heading: isTe ? '5. వింశోత్తరి మహాదశ కాలక్రమం' : '5. Vimshottari Mahadasha Timeline',
    summary: isTe
      ? `జన్మ సమయ దశ శేషం: ${computeVimshottari(chart.p[1], chart.t0).balanceYears.toFixed(2)} సంవత్సరాలు.`
      : `Balance of Dasha at birth: ${computeVimshottari(chart.p[1], chart.t0).balanceYears.toFixed(2)} years.`,
    table: {
      headers: isTe ? ['మహాదశ', 'ప్రారంభం', 'ముగింపు', 'వ్యవధి (సం.)'] : ['Mahadasha', 'Start', 'End', 'Years'],
      rows: computeVimshottari(chart.p[1], chart.t0).mahas.map((m) => [
        pName(m.lord as any, lang),
        new Date(m.start).toISOString().slice(0, 10),
        new Date(m.end).toISOString().slice(0, 10),
        m.years.toFixed(2),
      ]),
    },
  };

  const kpSec: ReportSection = {
    id: 'kp-domain',
    heading: isTe ? '6. KP కస్ప్ సబ్-లార్డ్ & జీవిత రంగ విశ్లేషణ' : '6. KP Cusp Sub-Lord & Event Promise Analysis',
    summary: isTe
      ? 'ముఖ్య భావాల కస్ప్ సబ్-లార్డ్ పరిశీలన (వివాహం 2/7/11, వృత్తి 2/6/10/11, ఆస్తి 4/11/12, విదేశం 3/9/12).'
      : 'Cuspal sub-lord evaluation across key houses (Marriage 2/7/11, Career 2/6/10/11, Property 4/11/12, Foreign 3/9/12).',
    table: {
      headers: isTe ? ['జీవిత రంగం', 'ప్రధాన కస్ప్', 'సబ్ లార్డ్', 'సూచిక భావాలు', 'ఫలితం'] : ['Life Domain', 'Primary Cusp', 'Sub Lord', 'Significator Houses', 'Verdict'],
      rows: KP_EVENTS.map((ev) => {
        const res = evaluateKpEvent(chart, ev);
        const verdictTe = res.verdict === 'Promised' ? 'బలమైన యోగం' : res.verdict === 'Conditional / Mixed' ? 'మధ్యస్థ / ఆలస్య యోగం' : 'సవాలుతో కూడినది';
        return [
          isTe ? ev.titleTe : ev.titleEn,
          `${isTe ? 'కస్ప్' : 'Cusp'} ${ev.primaryCusp} (${sName(res.cusp.sign, lang)})`,
          pName(res.subLord, lang),
          res.subLordSigs.join(', '),
          isTe ? verdictTe : res.verdict,
        ];
      }),
    },
  };

  const jaiminiSec: ReportSection = {
    id: 'jaimini',
    heading: isTe ? '7. జైమినీ కారకులు, ఆరూఢాలు & చర దశ' : '7. Jaimini Chara Karakas, Arudha Padas & Chara Dasha',
    summary: isTe
      ? `ఆత్మకారకుడు (AK): ${pName(jaimini.ak.planet, lang)}; కారకాంశ: ${sName(jaimini.karakamshaSign, lang)}; ఆరూఢ లగ్నం (AL): ${sName(jaimini.AL, lang)}; ఉపపద లగ్నం (UL): ${sName(jaimini.UL, lang)}.`
      : `Atmakaraka: ${pName(jaimini.ak.planet, lang)}; Karakamsha: ${sName(jaimini.karakamshaSign, lang)}; Arudha Lagna (AL): ${sName(jaimini.AL, lang)}; Upapada (UL): ${sName(jaimini.UL, lang)}.`,
    table: {
      headers: isTe ? ['చర రాశి', 'అధిపతి', 'సంవత్సరాలు', 'ప్రారంభం', 'ముగింపు'] : ['Chara Sign', 'Lord', 'Years', 'Start', 'End'],
      rows: computeCharaDasha(chart).slice(0, 8).map((c) => [
        sName(c.sign, lang),
        pName(c.lord, lang),
        String(c.years),
        new Date(c.start).toISOString().slice(0, 10),
        new Date(c.end).toISOString().slice(0, 10),
      ]),
    },
  };

  const domainSec: ReportSection = {
    id: 'domain-synthesis',
    heading: isTe ? `8. ప్రత్యేక విషయ సంగ్రహం — ${meta.titleTe}` : `8. Specialized Domain Focus — ${meta.titleEn}`,
    summary: (() => {
      const h10Lord = SIGN_LORDS[(chart.lagS + 9) % 12];
      const h7Lord = SIGN_LORDS[(chart.lagS + 6) % 12];
      const h2Lord = SIGN_LORDS[(chart.lagS + 1) % 12];
      const d10 = buildVargaChart(chart, 10);
      const d9 = buildVargaChart(chart, 9);
      const dispEnd = computeDispositorChains(chart).find((c) => c.start === h2Lord)?.chain.slice(-1)[0] ?? h2Lord;
      if (isTe) {
        return [
          `ప్రస్తుత శని–గురు గోచార ద్వంద్వ సంచార ప్రభావం: ${transits.doubleTransitHouses.map((h) => `${h}వ భావం`).join(', ') || 'విస్తృతంగా'}.`,
          `${varsha.targetYear} వార్షిక వర్షఫల లగ్నం ${sName(varsha.returnChart.lagS, lang)}, ముంథా ${varsha.munthaHouse}వ భావం (${sName(varsha.munthaSign, lang)}), వర్షేశుడు ${pName(varsha.varshesha, lang)}.`,
          `10వ అధిపతి (${pName(h10Lord, lang)}) రాశిలో ${chart.rows.find((r) => r.id === h10Lord)?.house}వ భావంలో మరియు D10 దశాంశలో ${d10.planetHouses[h10Lord]}వ భావంలో ఉన్నారు.`,
          `7వ అధిపతి (${pName(h7Lord, lang)}) రాశిలో ${chart.rows.find((r) => r.id === h7Lord)?.house}వ భావంలో మరియు D9 నవాంశలో ${d9.planetHouses[h7Lord]}వ భావంలో ఉన్నారు.`,
          `2వ అధిపతి (${pName(h2Lord, lang)}) డిస్పోజిటర్ శృంఖలం ${pName(dispEnd, lang)} వద్ద స్థిరపడుతుంది.`,
        ].join(' ');
      }
      return [
        `Active Gochara Double Transit emphasizes Houses: ${transits.doubleTransitHouses.map((h) => `H${h}`).join(', ') || 'Distributed'}.`,
        `Current Varshaphala (${varsha.targetYear}) Lagna is ${sName(varsha.returnChart.lagS, lang)}, Muntha in H${varsha.munthaHouse} (${sName(varsha.munthaSign, lang)}), Varshesha is ${pName(varsha.varshesha, lang)}.`,
        `10th Lord (${pName(h10Lord, lang)}) occupies H${chart.rows.find((r) => r.id === h10Lord)?.house} in D1 and H${d10.planetHouses[h10Lord]} in D10 Dashamsha.`,
        `7th Lord (${pName(h7Lord, lang)}) occupies H${chart.rows.find((r) => r.id === h7Lord)?.house} in D1 and H${d9.planetHouses[h7Lord]} in D9 Navamsha.`,
        `2nd Lord (${pName(h2Lord, lang)}) dispositor chain terminates at ${pName(dispEnd, lang)}.`,
      ].join(' ');
    })(),
    table: (depth === 'research' || depth === 'complete')
      ? {
          headers: isTe ? ['భావం', 'భావబలం (రూపాలు)', 'స్థానం', 'SAV బిందువులు', 'యోగిని దశ సూచన'] : ['House', 'Bhava Bala (Rupas)', 'Rank', 'SAV Bindus', 'Yogini Dasha Note'],
          rows: bhavaBala.map((b) => [
            isTe ? `${b.house}వ భావం (${sName(b.sign, lang)})` : `House ${b.house} (${sName(b.sign, lang)})`,
            b.totalRupas.toFixed(2),
            `#${b.rank}`,
            String(chart.asht.sav[b.sign]),
            computeYogini(chart.p[1], chart.t0).mahas[b.house % 8]?.lord ? String(computeYogini(chart.p[1], chart.t0).mahas[b.house % 8].lord) : '—',
          ]),
        }
      : {
          headers: isTe ? ['వర్గ / సూచిక', 'లగ్నం / స్థితి', 'ముఖ్య ఫలితం'] : ['Varga / Indicator', 'Lagna / Placement', 'Key Insight'],
          rows: [
            [isTe ? 'D1 రాశి లగ్నం' : 'D1 Rashi Lagna', sName(chart.lagS, lang), `${isTe ? 'అధిపతి' : 'Lord'} ${pName(SIGN_LORDS[chart.lagS], lang)} H${chart.rows.find((r) => r.id === SIGN_LORDS[chart.lagS])?.house}`],
            [isTe ? 'D9 నవాంశ లగ్నం' : 'D9 Navamsha Lagna', sName(buildVargaChart(chart, 9).lagnaSign, lang), `${isTe ? 'నవాంశ చంద్రుడు:' : 'D9 Moon in'} ${sName(chart.rows[1].d9, lang)}`],
            [isTe ? 'D10 దశాంశ లగ్నం' : 'D10 Dashamsha Lagna', sName(buildVargaChart(chart, 10).lagnaSign, lang), `${isTe ? 'వర్గోత్తమ గ్రహాలు:' : 'Vargottama planets:'} ${chart.rows.filter((r) => r.vgt).map((r) => pName(r.id, lang)).join(', ') || (isTe ? 'లేవు' : 'None')}`],
            [isTe ? 'అష్టోత్తరి దశ శేషం' : 'Ashtottari Balance', `${computeAshtottari(chart.p[1], chart.t0).balanceYears.toFixed(1)} ${isTe ? 'సం.' : 'yrs'}`, `${isTe ? 'వింశోపక అగ్రగామి:' : 'Vimsopaka Top:'} ${pName([...vimsopaka].sort((a, b) => b.shodashavarga - a.shodashavarga)[0].id, lang)}`],
            [isTe ? 'కారకాంశ / గోచారం' : 'Dispositor / Karakamsha', sName(jaimini.karakamshaSign, lang), `${isTe ? 'ద్వంద్వ గోచార భావాలు:' : 'Double Transit Houses:'} ${transits.doubleTransitHouses.join(', ') || '—'}`],
          ],
        },
    notes: isTe
      ? 'గమనిక: ఇది ఖగోళ గణితం మరియు సంప్రదాయ జ్యోతిష నియమాల ఆధారంగా రూపొందించబడిన నివేదిక. ముఖ్య నిర్ణయాల కోసం అనుభవజ్ఞులైన జ్యోతిష పండితుల సలహా కూడా తీసుకోండి.'
      : 'Note: Calculated directly from the active ephemeris and classical jyotisha rules. Interpret promises alongside active Dasha and Gochara transits.',
  };

  if (depth === 'quick') {
    return { reportType: typeId, title, depth, language: lang, generatedAt: new Date().toISOString(), profileName: profile.name, sections: [birthMetaSec, planetSec, domainSec] };
  }
  if (depth === 'detailed') {
    return { reportType: typeId, title, depth, language: lang, generatedAt: new Date().toISOString(), profileName: profile.name, sections: [birthMetaSec, planetSec, strengthSec, yogaSec, dashaSec, domainSec] };
  }
  const deepInsights = computeDeepPlanetaryInsights(chart, shadbala, vimsopaka);
  const nbAnalysis = computeNeechabhangaAnalysis(chart, shadbala);
  const gemRecs = evaluateGemstoneRecommendations(chart, shadbala);

  const deepInsightsSec: ReportSection = {
    id: 'deep-insights',
    heading: isTe ? '9. అంతర్దృష్టి — గ్రహ బలబలాలు, నీచభంగం & తుది నిర్ణయం' : '9. Deep Insights, Neechabhanga & Final Planetary Verdict',
    summary: isTe
      ? `ప్రతి గ్రహం యొక్క ఫంక్షనల్ స్వభావం, షడ్బలం, దోష నివారణ స్థాయి మరియు నీచభంగ పరిశీలన.${nbAnalysis.length ? ` నీచ గ్రహాలు: ${nbAnalysis.map((n) => n.verdictTe).join(' ')}` : ''}`
      : `Comprehensive per-planet verdict weighing functional role, Shadbala, afflictions, mitigations, and Neechabhanga.${nbAnalysis.length ? ` Debilitated check: ${nbAnalysis.map((n) => n.verdictEn).join(' ')}` : ''}`,
    table: {
      headers: isTe ? ['గ్రహం', 'పాత్ర', 'షడ్బల %', 'దోష స్థాయి', 'తుది నిర్ణయం'] : ['Planet', 'Role', 'Shadbala %', 'Residual Strain', 'Verdict'],
      rows: deepInsights.map((d) => [
        `${pName(d.id, lang)} ${d.symbols}`,
        isTe ? d.functionalRoleTe : d.functionalRole,
        `${d.shadbalaPct.toFixed(0)}%`,
        isTe ? d.residualAfflictionTe : d.residualAffliction,
        isTe ? d.verdictCategoryTe : d.verdictCategory,
      ]),
    },
  };

  const gemSec: ReportSection = {
    id: 'gemstones-remedies',
    heading: isTe ? '10. రత్న ధారణ నిర్ణయ పట్టిక' : '10. Gemstone Decision Matrix',
    summary: isTe
      ? 'లగ్న యోగకారకత్వం, దుస్థాన/మారక నివారణ మరియు దశానుసారం రత్న సూచనలు.'
      : 'Functional lordship and adverse amplification-checked gemstone matrix.',
    table: {
      headers: isTe ? ['రత్నం', 'గ్రహం', 'నిర్ణయం', 'లోహం / వ్రేలు / రోజు'] : ['Gemstone', 'Planet', 'Decision', 'Metal / Finger / Day'],
      rows: gemRecs.slice(0, 5).map((g) => [
        isTe ? g.gemNameTe : g.gemNameEn,
        pName(g.planetId, lang),
        isTe ? g.statusTe : g.status,
        `${g.metal} · ${g.finger} · ${g.weekday}`,
      ]),
    },
  };

  // Complete / Research depth includes all sections + Deep Insights + Gemstones + full 23-varga matrix
  const vargaSec: ReportSection = {
    id: 'all-23-vargas',
    heading: isTe ? '11. సంపూర్ణ 23-వర్గ చక్ర పట్టిక (D1 – D144)' : '11. Complete 23-Varga Matrix (D1 – D144)',
    summary: isTe
      ? 'అన్ని 23 విభాగ చక్రాల (D1 నుండి D144 వరకు) లగ్నం మరియు సూర్య/చంద్ర/కుజ/గురు/శని స్థితులు.'
      : 'All 23 divisional chart ascendants and Sun/Moon/Mars/Jupiter/Saturn placements.',
    table: {
      headers: isTe ? ['విభాగ చక్రం', 'లగ్నం', 'సూర్యుడు', 'చంద్రుడు', 'కుజుడు', 'గురుడు', 'శని'] : ['Divisional Chart', 'Lagna', 'Sun', 'Moon', 'Mars', 'Jupiter', 'Saturn'],
      rows: ALL_VARGAS.map((vm) => {
        const vc = buildVargaChart(chart, vm.v);
        return [
          `${vm.code} (${isTe ? vm.nameTe : vm.nameEn})`,
          sName(vc.lagnaSign, lang),
          sName(vc.planetSigns[0], lang),
          sName(vc.planetSigns[1], lang),
          sName(vc.planetSigns[2], lang),
          sName(vc.planetSigns[4], lang),
          sName(vc.planetSigns[5], lang),
        ];
      }),
    },
  };
  return {
    reportType: typeId,
    title,
    depth,
    language: lang,
    generatedAt: new Date().toISOString(),
    profileName: profile.name,
    sections: [birthMetaSec, planetSec, strengthSec, yogaSec, dashaSec, kpSec, jaiminiSec, domainSec, deepInsightsSec, gemSec, vargaSec],
  };
}

export function generateSectionReport(
  sectionTitleTe: string,
  sectionTitleEn: string,
  profile: BirthProfile,
  summary: string,
  headers: string[],
  rows: string[][],
  lang: Language = 'te',
  notes?: string,
): GeneratedReportDocument {
  const isTe = lang === 'te';
  return {
    reportType: 'section-export',
    title: `${profile.name} — ${isTe ? sectionTitleTe : sectionTitleEn}`,
    depth: 'detailed',
    language: lang,
    generatedAt: new Date().toISOString(),
    profileName: profile.name,
    sections: [
      {
        id: 'section-export-1',
        heading: isTe ? sectionTitleTe : sectionTitleEn,
        summary,
        table: { headers, rows },
        notes,
      },
    ],
  };
}

export function renderReportHtml(doc: GeneratedReportDocument): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  const isTe = doc.language === 'te';
  const metaLine = isTe
    ? `జాతకుడు: ${esc(doc.profileName)} · స్థాయి: ${doc.depth === 'quick' ? 'సంక్షిప్త' : doc.depth === 'detailed' ? 'సమగ్ర' : 'పరిశోధన'} · రూపొందించిన తేదీ: ${esc(doc.generatedAt.slice(0, 16).replace('T', ' '))}`
    : `Profile: ${esc(doc.profileName)} · Depth: ${doc.depth.toUpperCase()} · Generated: ${esc(doc.generatedAt.slice(0, 16).replace('T', ' '))}`;
  return `<!doctype html>
<html lang="${doc.language}">
<head>
<meta charset="utf-8" />
<title>${esc(doc.title)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: 'Noto Sans Telugu', 'Plus Jakarta Sans', system-ui, sans-serif; color: #18181b; line-height: 1.55; max-width: 800px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 20px; border-bottom: 2px solid #b45309; padding-bottom: 8px; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #52525b; margin-bottom: 20px; }
  section { margin-bottom: 22px; page-break-inside: avoid; }
  h2 { font-size: 15px; color: #92400e; margin: 0 0 6px; }
  p { font-size: 13px; margin: 4px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
  th, td { border: 1px solid #d4d4d8; padding: 5px 8px; text-align: left; }
  th { background: #fef3c7; font-weight: 600; }
  .note { font-size: 11px; color: #52525b; background: #fafafa; padding: 8px 10px; border-radius: 4px; }
</style>
</head>
<body>
  <h1>${esc(doc.title)}</h1>
  <div class="meta">${metaLine}</div>
  ${doc.sections
    .map(
      (sec) => `<section>
        <h2>${esc(sec.heading)}</h2>
        <p>${esc(sec.summary)}</p>
        ${
          sec.table
            ? `<table><thead><tr>${sec.table.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${sec.table.rows
                .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
                .join('')}</tbody></table>`
            : ''
        }
        ${sec.notes ? `<p class="note">${esc(sec.notes)}</p>` : ''}
      </section>`,
    )
    .join('')}
</body>
</html>`;
}

