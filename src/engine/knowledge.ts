import { INITIAL_DHARMA_ARTICLES } from './data/coreData.ts';

export interface KnowledgeArticle {
  id: string;
  cat: string;
  catEn: string;
  title: string;
  titleEn: string;
  sub: string;
  subEn: string;
  src: string;
  tags: string[];
  body: string;
  bodyEn: string;
}

const JYOTISHA_CLASSICAL_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'jyotisha-bphs',
    cat: 'జ్యోతిష్య శాస్త్రం',
    catEn: 'Classical Jyotisha',
    title: 'బృహత్ పరాశర హోరా శాస్త్రం (BPHS)',
    titleEn: 'Brihat Parashara Hora Shastra (BPHS)',
    sub: 'వేద జ్యోతిషానికి మూల గ్రంథం — షోడశ వర్గాలు, షడ్బలం, అష్టకవర్గం, వింశోత్తరి దశ',
    subEn: 'Foundational text of Parashari Jyotisha: Shodasha Vargas, Shadbala, Ashtakavarga & Dashas',
    src: 'Maharshi Parashara (Classical Jyotisha)',
    tags: ['parashari', 'shadbala', 'vargas', 'dasha', 'bphs'],
    body: 'బృహత్ పరాశర హోరా శాస్త్రం పరాశర మహర్షి మైత్రేయునికి ఉపదేశించిన ప్రధాన జ్యోతిష గ్రంథం.\nఇందులో రాశి స్వరూపాలు, గ్రహ కారకత్వాలు, 16 వర్గ చక్రాలు (D1–D60), షడ్బల గణన, భావ బలం, అష్టకవర్గ బిందు పద్ధతి, యోగాలు మరియు వింశోత్తరి, యోగిని, చర దశా క్రమాలు విపులంగా ఉన్నాయి.',
    bodyEn: 'Brihat Parashara Hora Shastra is the foundational treatise of Vedic natal astrology taught by Sage Parashara to Maitreya.\nIt systematically defines zodiacal signs, planetary dignities, Shodasha Varga divisions (D1–D60), six-fold Shadbala strength, Ashtakavarga bindu synthesis, Rajayogas, and Vimshottari and Yogini Dashas.',
  },
  {
    id: 'jyotisha-jaimini-sutras',
    cat: 'జ్యోతిష్య శాస్త్రం',
    catEn: 'Classical Jyotisha',
    title: 'జైమినీ సూత్రాలు (Jaimini Sutras)',
    titleEn: 'Jaimini Upadesha Sutras',
    sub: 'చర కారకులు, రాశి దృష్టి, ఆరూఢ పదాలు, అర్గళ మరియు చర దశ',
    subEn: 'Chara Karakas, Rashi Drishti, Arudha Padas, Argala & Sign Dashas',
    src: 'Maharshi Jaimini (Upadesha Sutras)',
    tags: ['jaimini', 'karakamsha', 'arudha', 'chara-dasha', 'sutras'],
    body: 'జైమినీ మహర్షి ప్రతిపాదించిన సూత్ర పద్ధతిలో గ్రహాల డిగ్రీ ఆధారిత 7/8 చర కారకులు (ఆత్మకారక నుండి దారకారక వరకు), రాశుల మధ్య శాశ్వత రాశి దృష్టి, ఆరూఢ లగ్నం (AL), ఉపపద లగ్నం (UL), కారకాంశ మరియు చర/నారాయణ దశలు ముఖ్యమైనవి.',
    bodyEn: 'Sage Jaimini’s Upadesha Sutras present a parallel sign-centric predictive framework centered on degree-ranked Chara Karakas (Atmakaraka to Darakaraka), Rashi Drishti (movable/fixed/dual sign aspects), Arudha Padas (AL, UL, A1–A12), Argala planetary intervention, and Chara and Narayana Dashas.',
  },
  {
    id: 'jyotisha-kp-system',
    cat: 'జ్యోతిష్య శాస్త్రం',
    catEn: 'Classical Jyotisha',
    title: 'కృష్ణమూర్తి పద్ధతి (KP System)',
    titleEn: 'Krishnamurti Paddhati (KP Astrology)',
    sub: 'నక్షత్ర – సబ్ లార్డ్ – 4-స్థాయి కారకత్వం – రూలింగ్ ప్లానెట్స్',
    subEn: 'Cuspal Sub-Lords, 4-Fold Significators, Ruling Planets & 1–249 Horary',
    src: 'Prof. K.S. Krishnamurti (KP Readers I–VI)',
    tags: ['kp', 'sub-lord', 'ruling-planets', 'horary', 'placidus'],
    body: 'ప్రొ. కె.ఎస్. కృష్ణమూర్తి ప్రతిపాదించిన KP పద్ధతి Placidus భావ విభజన, నక్షత్రంలోని వింశోత్తరి నిష్పత్తి సబ్-లార్డ్ (Sub Lord), 4 స్థాయిల గ్రహ-భావ కారకత్వాలు మరియు 1–249 హోరరీ సంఖ్యల ద్వారా ఖచ్చితమైన సంఘటనల నిర్ణయానికి ఉపయోగిస్తారు.',
    bodyEn: 'Developed by Prof. K.S. Krishnamurti, KP Astrology refines Nakshatra divisions into unequal Vimshottari Sub-Lords paired with Placidus house cusps, 4-fold signification hierarchy, Ruling Planets for rectification/timing, and the 1–249 Horary Prashna system.',
  },
  {
    id: 'vedanga-jyotisha',
    cat: 'వేదాంగాలు',
    catEn: 'Vedangas',
    title: 'వేదాంగ జ్యోతిషం & సూర్య సిద్ధాంతం',
    titleEn: 'Vedanga Jyotisha & Surya Siddhanta',
    sub: 'ఖగోళ గణితం, అయనాంశ, తిథి-నక్షత్ర పంచాంగ వ్యవస్థ',
    subEn: 'Vedic observational astronomy, precession (Ayanamsha) & luni-solar calendar',
    src: 'Lagadha Vedanga Jyotisha / Surya Siddhanta',
    tags: ['vedanga', 'panchanga', 'surya-siddhanta', 'ayanamsha'],
    body: 'వేద యజ్ఞ కాలాదులను నిర్ణయించేందుకు ఏర్పడిన వేదాంగ జ్యోతిషం (లగధ మహర్షి) మరియు సూర్య సిద్ధాంతం గ్రహ గతుల గణితం, సాయన-నిరయన అయనాంశ భేదాలు, అధిక మాస నియమాలు మరియు పంచాంగ నిర్మాణానికి మూలం.',
    bodyEn: 'Vedanga Jyotisha by Lagadha and the astronomical treatise Surya Siddhanta establish the mathematical basis for lunar-solar months (Adhika Masa), equinoctial precession (Ayanamsha), planetary orbits, and the five-limbed Panchanga.',
  },
  {
    id: 'mantra-shastra-agamas',
    cat: 'ఆగమ · మంత్ర శాస్త్రం',
    catEn: 'Agama & Mantra Shastra',
    title: 'ఆగమ శాస్త్రాలు · ఆలయ సంప్రదాయం · మంత్ర శాస్త్రం',
    titleEn: 'Agama Traditions, Temple Worship & Mantra Shastra',
    sub: 'వైఖానస, పాంచరాత్ర, శైవ, శాక్త ఆగమాలు మరియు జప నియమాలు',
    subEn: 'Vaikhanasa, Pancharatra, Shaiva & Shakta Agamas and ritual discipline',
    src: 'Classical Agama & Tantra Literature',
    tags: ['agama', 'temple', 'mantra', 'shiva', 'vaishnava', 'shakta'],
    body: 'ఆలయ నిర్మాణం, విగ్రహ ప్రతిష్ఠ, నిత్య పూజలు మరియు ఉపాసన విధానాలు వైఖానస, పాంచరాత్ర (వైష్ణవ), శైవాగమ మరియు శాక్తాగమాలలో వివరించబడ్డాయి. మంత్ర శాస్త్రం జప శుద్ధి, ఛందస్సు, ఋషి, దేవతా ధ్యాన నియమాలను తెలియజేస్తుంది.',
    bodyEn: 'Temple consecration, iconography, and daily liturgical worship follow Vaikhanasa and Pancharatra (Vaishnava), Shaiva, and Shakta Agamas. Mantra Shastra emphasizes proper lineage initiation, Rishi, Chandas, Devata, and mental concentration (Japa & Dhyana).',
  },
  {
    id: 'darshana-shad',
    cat: 'షడ్దర్శనాలు',
    catEn: 'Shad Darshanas',
    title: 'భారతీయ షడ్దర్శనాలు (Six Orthodox Schools)',
    titleEn: 'The Six Classical Darshanas',
    sub: 'సాంఖ్య, యోగ, న్యాయ, వైశేషిక, పూర్వ మీమాంస, వేదాంత',
    subEn: 'Samkhya, Yoga, Nyaya, Vaisheshika, Purva Mimamsa & Vedanta',
    src: 'Classical Philosophical Sutras',
    tags: ['darshana', 'samkhya', 'yoga', 'vedanta', 'nyaya'],
    body: 'సనాతన తత్త్వశాస్త్రంలోని ఆరు ఆస్తిక దర్శనాలు: కపిలుని సాంఖ్యం, పతంజలి యోగం, గౌతముని న్యాయం, కణాదుని వైశేషికం, జైమిని పూర్వ మీమాంస, మరియు బాదరాయణుని ఉత్తర మీమాంస (వేదాంతం). ఇవి ప్రమాణ శాస్త్రం మరియు మోక్ష మార్గాలను వివరిస్తాయి.',
    bodyEn: 'The six orthodox schools of Sanatana philosophy — Samkhya (Kapila), Yoga (Patanjali), Nyaya (Gautama), Vaisheshika (Kanada), Purva Mimamsa (Jaimini), and Vedanta (Badarayana) — examine epistemology, metaphysics, dharma, and liberation.',
  },
];

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  ...INITIAL_DHARMA_ARTICLES.map((a) => ({
    id: a.id,
    cat: a.cat,
    catEn: a.catEn || a.cat,
    title: a.title,
    titleEn: a.titleEn || a.title,
    sub: a.sub || a.scope || '',
    subEn: a.subEn || a.sub || a.scope || '',
    src: a.src || a.author || 'Classical Tradition',
    tags: a.tags || [a.cat],
    body: a.body || a.summary || '',
    bodyEn: a.bodyEn || a.body || a.summary || '',
  })),
  ...JYOTISHA_CLASSICAL_ARTICLES,
];

export const GLOSSARY_TERMS: { sanskrit: string; te: string; en: string }[] = [
  { sanskrit: 'Lagna', te: 'లగ్నం — జన్మ సమయంలో తూర్పున ఉదయించే రాశి/బిందువు', en: 'Eastern horizon sign/degree rising at birth' },
  { sanskrit: 'Rashi', te: 'రాశి — 30° రాశి విభాగం (12)', en: '30-degree zodiacal division (12 signs)' },
  { sanskrit: 'Bhava', te: 'భావం — జీవిత రంగాన్ని సూచించే 12 స్థానాలు', en: 'House representing a domain of life experience' },
  { sanskrit: 'Nakshatra', te: 'నక్షత్రం — 13°20′ చంద్రమార్గ విభాగం (27)', en: '27 lunar mansions of 13°20′ arc each' },
  { sanskrit: 'Pada', te: 'పాదం — నక్షత్రంలో నాలుగో భాగం (3°20′)', en: 'One-quarter of a Nakshatra (3°20′)' },
  { sanskrit: 'Ayanamsha', te: 'అయనాంశ — సాయన–నిరయన రాశుల మధ్య కోణ భేదం', en: 'Precessional angle separating Tropical & Sidereal zodiacs' },
  { sanskrit: 'Vargottama', te: 'వర్గోత్తమం — D1 మరియు D9 లో ఒకే రాశిలో ఉండడం', en: 'Planet occupying the identical sign in D1 Rashi and D9 Navamsha' },
  { sanskrit: 'Shadbala', te: 'షడ్బలం — ఆరు రకాల గ్రహ బల గణన (విరూపాలు/రూపాలు)', en: 'Six-fold classical planetary strength measured in Virupas and Rupas' },
  { sanskrit: 'Ashtakavarga', te: 'అష్టకవర్గం — 7 గ్రహాలు + లగ్నం ఆధారంగా బిందు విధానం', en: '8-source point-allocation matrix (337 total SAV bindus)' },
  { sanskrit: 'Dasha', te: 'దశ — గ్రహాల ఫలిత కాల క్రమం', en: 'Planetary timing periods governing activation of natal promises' },
  { sanskrit: 'Gochara', te: 'గోచారం — ప్రస్తుత గ్రహ సంచారం', en: 'Current planetary transits evaluated relative to Moon/Lagna' },
  { sanskrit: 'Karakamsha', te: 'కారకాంశ — నవాంశలో ఆత్మకారకుడు ఉన్న రాశి', en: 'Navamsha sign occupied by the Atmakaraka' },
  { sanskrit: 'Arudha Lagna', te: 'ఆరూఢ లగ్నం — లోకంలో జాతకుని ప్రతిబింబ స్థితి', en: 'Projected image of the Lagna (Pancham/Perception status)' },
  { sanskrit: 'Sade Sati', te: 'ఏలినాటి శని — చంద్ర రాశికి 12,1,2లో శని సంచారం (7½ ఏళ్లు)', en: 'Saturn transit across 12th, 1st, and 2nd signs from natal Moon' },
  { sanskrit: 'Yogakaraka', te: 'యోగకారకుడు — కేంద్ర, త్రికోణాలకు ఒకేసారి అధిపతి అయిన గ్రహం', en: 'Single planet ruling both a Kendra and a Trikona house' },
  { sanskrit: 'Parivartana', te: 'పరివర్తన — రెండు గ్రహాలు పరస్పర రాశుల్లో ఉండడం', en: 'Mutual sign exchange between two planetary lords' },
];
