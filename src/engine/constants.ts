import type { Language, PlanetId } from './types.ts';

export const SEVEN: PlanetId[] = [0, 1, 2, 6, 4, 8, 5];
export const ORDER: PlanetId[] = [0, 1, 2, 6, 4, 8, 5, 3, 7];

export const PLANET_SHORT = ['Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me', 'Ke', 'Ve'] as const;
export const PLANET_NAMES: Record<Language, string[]> = {
  te: ['సూర్యుడు', 'చంద్రుడు', 'కుజుడు', 'రాహువు', 'గురుడు', 'శని', 'బుధుడు', 'కేతువు', 'శుక్రుడు'],
  en: ['Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus'],
  hi: ['सूर्य', 'चन्द्र', 'मंगल', 'राहु', 'बृहस्पति', 'शनि', 'बुध', 'केतु', 'शुक्र'],
};

export const SIGN_NAMES: Record<Language, string[]> = {
  te: ['మేషం', 'వృషభం', 'మిథునం', 'కర్కాటకం', 'సింహం', 'కన్య', 'తుల', 'వృశ్చికం', 'ధనుస్సు', 'మకరం', 'కుంభం', 'మీనం'],
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  hi: ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'],
};

export const SIGN_SHORT_EN = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
export const SIGN_SHORT_TE = ['మే', 'వృ', 'మి', 'క', 'సిం', 'కన్య', 'తు', 'వృశ్చి', 'ధ', 'మ', 'కుం', 'మీ'];
export const SIGN_SHORT_HI = ['मेष', 'वृष', 'मिथु', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चि', 'धनु', 'मकर', 'कुंभ', 'मीन'];

export function sShort(sign: number, lang: Language = 'en'): string {
  const idx = ((sign % 12) + 12) % 12;
  if (lang === 'te') return SIGN_SHORT_TE[idx];
  if (lang === 'hi') return SIGN_SHORT_HI[idx];
  return SIGN_SHORT_EN[idx];
}

// Sign lord: Aries=Mars(2), Tau=Ve(8), Gem=Me(6), Can=Mo(1), Leo=Su(0), Vir=Me(6), Lib=Ve(8), Sco=Ma(2), Sag=Ju(4), Cap=Sa(5), Aqu=Sa(5), Pis=Ju(4)
export const SIGN_LORDS: PlanetId[] = [2, 8, 6, 1, 0, 6, 8, 2, 4, 5, 5, 4];

export const EXA: Record<number, number> = { 0: 0, 1: 1, 2: 9, 6: 5, 4: 3, 8: 11, 5: 6 };
export const OWN: Record<number, number[]> = { 0: [4], 1: [3], 2: [0, 7], 6: [2, 5], 4: [8, 11], 8: [1, 6], 5: [9, 10] };
export const MTR: Record<number, [number, number, number]> = {
  0: [4, 0, 20],
  1: [1, 3, 30],
  2: [0, 0, 12],
  6: [5, 15, 20],
  4: [8, 0, 10],
  8: [6, 0, 15],
  5: [10, 0, 20],
};

export const NAT_FRIENDS: Record<number, PlanetId[]> = {
  0: [1, 2, 4],
  1: [0, 6],
  2: [0, 1, 4],
  6: [0, 8],
  4: [0, 1, 2],
  8: [6, 5],
  5: [6, 8],
  3: [8, 5, 6],
  7: [2, 4, 8],
};

export const NAT_ENEMIES: Record<number, PlanetId[]> = {
  0: [8, 5],
  1: [],
  2: [6],
  6: [1],
  4: [6, 8],
  8: [0, 1],
  5: [0, 1, 2],
  3: [0, 1, 2],
  7: [0, 1],
};

export const NAK_NAMES: Record<Language, string[]> = {
  te: [
    'అశ్విని', 'భరణి', 'కృత్తిక', 'రోహిణి', 'మృగశిర', 'ఆర్ద్ర', 'పునర్వసు', 'పుష్యమి', 'ఆశ్లేష',
    'మఘ', 'పుబ్బ', 'ఉత్తర', 'హస్త', 'చిత్త', 'స్వాతి', 'విశాఖ', 'అనూరాధ', 'జ్యేష్ఠ',
    'మూల', 'పూర్వాషాఢ', 'ఉత్తరాషాఢ', 'శ్రవణం', 'ధనిష్ఠ', 'శతభిషం', 'పూర్వాభాద్ర', 'ఉత్తరాభాద్ర', 'రేవతి',
  ],
  en: [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
  ],
  hi: [
    'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा',
    'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा',
    'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वाभाद्रपद', 'उत्तराभाद्रपद', 'रेवती',
  ],
};

export const NAK_SYMBOLS_TE = [
  'అశ్వ శిరస్సు', 'యోని', 'కత్తి/జ్వాల', 'రథం/బండి', 'జింక తల', 'కన్నీటి బిందువు', 'విల్లు–అంబుల పొది', 'ఆవు పొదుగు/కమలం', 'చుట్టుకున్న సర్పం',
  'సింహాసనం', 'మంచం ముందు కాళ్లు', 'మంచం వెనుక కాళ్లు', 'చేయి', 'రత్నం/ముత్యం', 'లేత మొక్క', 'తోరణం/కుమ్మరి చక్రం', 'కమలం/తోరణం', 'వృత్తాకార కుండలం',
  'వేర్ల గుత్తి', 'ఏనుగు దంతం/విసనకర్ర', 'ఏనుగు దంతం/మంచం', 'చెవి/మూడు అడుగులు', 'మృదంగం', 'ఖాళీ వృత్తం/వేయి పూలు', 'శవపేటిక ముందు కాళ్లు', 'శవపేటిక వెనుక కాళ్లు', 'చేప/డోలు',
];

export const NAK_SYMBOLS_EN = [
  'Horse head', 'Yoni', 'Knife / Flame', 'Chariot / Cart', 'Deer head', 'Teardrop / Diamond', 'Bow & Quiver', 'Cow udder / Lotus', 'Coiled Serpent',
  'Royal Throne', 'Front legs of cot', 'Back legs of cot', 'Open Hand', 'Bright Jewel / Pearl', 'Young Shoot', 'Triumphal Arch', 'Lotus', 'Circular Amulet',
  'Tied Roots', 'Elephant Tusk / Fan', 'Elephant Tusk / Bed', 'Ear / Three Footprints', 'Drum (Mridanga)', 'Empty Circle / 100 Flowers', 'Front legs of cot', 'Back legs of cot', 'Fish / Drum',
];

export const NAK_DEITIES_EN = [
  'Ashwini Kumaras', 'Yama', 'Agni', 'Brahma / Prajapati', 'Soma', 'Rudra', 'Aditi', 'Brihaspati', 'Sarpa (Nagas)',
  'Pitris', 'Bhaga', 'Aryaman', 'Savitr', 'Vishwakarma', 'Vayu', 'Indra-Agni', 'Mitra', 'Indra',
  'Nirriti', 'Apas', 'Vishvedevas', 'Vishnu', 'Ashta Vasus', 'Varuna', 'Aja Ekapada', 'Ahir Budhnya', 'Pushan',
];

export const NAK_DEITIES_TE = [
  'అశ్విని కుమారులు', 'యముడు', 'అగ్ని', 'బ్రహ్మ / ప్రజాపతి', 'సోముడు', 'రుద్రుడు', 'అదితి', 'బృహస్పతి', 'సర్ప దేవతలు',
  'పితృదేవతలు', 'భగుడు', 'అర్యముడు', 'సవితృడు', 'విశ్వకర్మ', 'వాయువు', 'ఇంద్రాగ్నులు', 'మిత్రుడు', 'ఇంద్రుడు',
  'నిరృతి', 'జల దేవతలు (ఆపః)', 'విశ్వేదేవతలు', 'మహావిష్ణువు', 'అష్టవసువులు', 'వరుణుడు', 'అజైకపాదుడు', 'అహిర్బుధ్న్యుడు', 'పూషణుడు',
];

export const NAK_SYLLABLES = (
  'చు చె చొ ల|లి లు లె లొ|అ ఇ ఉ ఎ|ఒ వ వి వు|వె వొ క కి|కు ఘ ఙ ఛ|కె కొ హ హి|హు హె హొ డ|డి డు డె డొ|' +
  'మ మి ము మె|మొ ట టి టు|టె టొ ప పి|పు ష ణ ఠ|పె పొ ర రి|రు రె రొ త|తి తు తె తొ|న ని ను నె|నొ య యి యు|' +
  'యె యొ భ భి|భు ధ ఫ ఢ|భె భొ జ జి|జు జె జొ ఖ|గ గి గు గె|గొ స సి సు|సె సొ ద దీ|దు శ ఝ థ|దె దొ చ చి'
).split('|');

export const NAK_SYLLABLES_EN = (
  'Chu Che Cho La|Li Lu Le Lo|A I U E|O Va Vi Vu|Ve Vo Ka Ki|Ku Gha Nga Cha|Ke Ko Ha Hi|Hu He Ho Da|Di Du De Do|' +
  'Ma Mi Mu Me|Mo Ta Ti Tu|Te To Pa Pi|Pu Sha Na Tha|Pe Po Ra Ri|Ru Re Ro Ta|Ti Tu Te To|Na Ni Nu Ne|No Ya Yi Yu|' +
  'Ye Yo Bha Bhi|Bhu Dha Pha Dha|Bhe Bho Ja Ji|Ju Je Jo Kha|Ga Gi Gu Ge|Go Sa Si Su|Se So Da Di|Du Sha Jha Tha|De Do Cha Chi'
).split('|');

export const TITHI_TE = [
  'పాడ్యమి', 'విదియ', 'తదియ', 'చవితి', 'పంచమి', 'షష్ఠి', 'సప్తమి', 'అష్టమి',
  'నవమి', 'దశమి', 'ఏకాదశి', 'ద్వాదశి', 'త్రయోదశి', 'చతుర్దశి', 'పౌర్ణమి',
];
export const TITHI_EN = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
  'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
];

export const NITYA_YOGA_TE = [
  'విష్కంభ', 'ప్రీతి', 'ఆయుష్మాన్', 'సౌభాగ్య', 'శోభన', 'అతిగండ', 'సుకర్మ', 'ధృతి', 'శూల',
  'గండ', 'వృద్ధి', 'ధ్రువ', 'వ్యాఘాత', 'హర్షణ', 'వజ్ర', 'సిద్ధి', 'వ్యతీపాత', 'వరీయాన్',
  'పరిఘ', 'శివ', 'సిద్ధ', 'సాధ్య', 'శుభ', 'శుక్ల', 'బ్రహ్మ', 'ఐంద్ర', 'వైధృతి',
];
export const NITYA_YOGA_EN = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shoola',
  'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
];

export const KARANA_TE = ['బవ', 'బాలవ', 'కౌలవ', 'తైతుల', 'గరజ', 'వణిజ', 'భద్ర (విష్టి)'];
export const KARANA_EN = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti (Bhadra)'];

export const VARA_TE = ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'];
export const VARA_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const VARA_LORDS: PlanetId[] = [0, 1, 2, 6, 4, 8, 5];

export const MASA_TE = ['చైత్రం', 'వైశాఖం', 'జ్యేష్ఠం', 'ఆషాఢం', 'శ్రావణం', 'భాద్రపదం', 'ఆశ్వయుజం', 'కార్తికం', 'మార్గశిరం', 'పుష్యం', 'మాఘం', 'ఫాల్గుణం'];
export const MASA_EN = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'];

export const SAMVATSARA_60 = [
  'Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angirasa', 'Shrimukha', 'Bhava', 'Yuva', 'Dhatri',
  'Ishvara', 'Bahudhanya', 'Pramadi', 'Vikrama', 'Vrisha', 'Chitrabhanu', 'Svabhanu', 'Tarana', 'Parthiva', 'Vyaya',
  'Sarvajit', 'Sarvadharin', 'Virodhi', 'Vikrita', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi',
  'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava',
  'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhikrit', 'Paridhavi', 'Pramadicha', 'Ananda', 'Rakshasa', 'Nala',
  'Pingala', 'Kalayukti', 'Siddharthi', 'Raudri', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya',
];

export const SAMVATSARA_60_TE = [
  'ప్రభవ', 'విభవ', 'శుక్ల', 'ప్రమోదూత', 'ప్రజోత్పత్తి', 'ఆంగీరస', 'శ్రీముఖ', 'భావ', 'యువ', 'ధాత',
  'ఈశ్వర', 'బహుధాన్య', 'ప్రమాది', 'విక్రమ', 'వృష', 'చిత్రభాను', 'స్వభాను', 'తారణ', 'పార్థివ', 'వ్యయ',
  'సర్వజిత్తు', 'సర్వధారి', 'విరోధి', 'వికృతి', 'ఖర', 'నందన', 'విజయ', 'జయ', 'మన్మథ', 'దుర్ముఖి',
  'హేవిళంబి', 'విళంబి', 'వికారి', 'శార్వరి', 'ప్లవ', 'శుభకృతు', 'శోభకృతు', 'క్రోధి', 'విశ్వావసు', 'పరాభవ',
  'ప్లవంగ', 'కీలక', 'సౌమ్య', 'సాధారణ', 'విరోధికృతు', 'పరీధావి', 'ప్రమాదీచ', 'ఆనంద', 'రాక్షస', 'నల',
  'పింగళ', 'కాళయుక్తి', 'సిద్ధార్థి', 'రౌద్రి', 'దుర్మతి', 'దుందుభి', 'రుధిరోద్గారి', 'రక్తాక్షి', 'క్రోధన', 'అక్షయ',
];

export function pName(id: PlanetId, lang: Language): string {
  return PLANET_NAMES[lang]?.[id] ?? PLANET_NAMES.en[id];
}

export function sName(sign: number, lang: Language): string {
  return SIGN_NAMES[lang]?.[((sign % 12) + 12) % 12] ?? SIGN_NAMES.en[((sign % 12) + 12) % 12];
}

export function nakName(nk: number, lang: Language): string {
  return NAK_NAMES[lang]?.[((nk % 27) + 27) % 27] ?? NAK_NAMES.en[((nk % 27) + 27) % 27];
}

export const PLANET_SHORT_TE = ['సూ', 'చం', 'కు', 'రా', 'గు', 'శ', 'బు', 'కే', 'శు'] as const;
export const PLANET_SHORT_HI = ['सू', 'चं', 'मं', 'रा', 'गु', 'श', 'बु', 'के', 'शु'] as const;

export function pShort(id: PlanetId, lang: Language = 'en'): string {
  if (lang === 'te') return PLANET_SHORT_TE[id] ?? PLANET_SHORT[id];
  if (lang === 'hi') return PLANET_SHORT_HI[id] ?? PLANET_SHORT[id];
  return PLANET_SHORT[id];
}

export const HOUSE_SIGNIFICANCE: { house: number; en: string; te: string }[] = [
  { house: 1, en: 'Self, physique, vitality, temperament & appearance', te: 'తనువు, స్వభావం, ఆరోగ్యం, వ్యక్తిత్వం' },
  { house: 2, en: 'Wealth, family, speech, early education & food', te: 'ధనం, కుటుంబం, వాక్కు, నేత్రాలు' },
  { house: 3, en: 'Courage, younger siblings, communication & short journeys', te: 'పరాక్రమం, సోదరులు, ప్రయాణాలు, కౌశలం' },
  { house: 4, en: 'Mother, home, vehicles, land & emotional peace', te: 'మాతృ, గృహం, వాహనాలు, విద్యా సౌఖ్యం' },
  { house: 5, en: 'Progeny, intellect, creativity, mantra & past merit', te: 'సంతానం, బుద్ధి, పూర్వపుణ్యం, మంత్రసిద్ధి' },
  { house: 6, en: 'Health challenges, service, debts, litigation & competition', te: 'రోగం, ఋణం, శత్రువులు, సేవా వృత్తి' },
  { house: 7, en: 'Marriage, partnerships, trade & public contracts', te: 'కళత్రం, వివాహం, భాగస్వామ్యం, వ్యాపారం' },
  { house: 8, en: 'Longevity, transformation, occult, inheritance & research', te: 'ఆయుర్దాయం, ఆకస్మిక మార్పులు, రహస్య విద్యలు' },
  { house: 9, en: 'Dharma, father, guru, higher learning & long travels', te: 'భాగ్యం, ధర్మం, తండ్రి, గురువు, తీర్థయాత్రలు' },
  { house: 10, en: 'Career, karma, authority, status & public deeds', te: 'కర్మ, వృత్తి, రాజ్యాధికారం, కీర్తి' },
  { house: 11, en: 'Gains, elder siblings, networks & fulfillment of desires', te: 'లాభం, ఆదాయం, మిత్రులు, కోరికల సిద్ధి' },
  { house: 12, en: 'Losses, expenses, foreign residence, sleep & moksha', te: 'వ్యయం, విదేశ వాసం, మోక్షం, ధ్యానం' },
];

export interface RashiTrait {
  sign: number;
  lord: PlanetId;
  elementTe: string;
  elementEn: string;
  modalityTe: string;
  modalityEn: string;
  directionTe: string;
  directionEn: string;
  natureTe: string;
  natureEn: string;
}

export const RASHI_TRAITS: RashiTrait[] = [
  { sign: 0, lord: 2, elementTe: 'అగ్ని తత్వం', elementEn: 'Fire', modalityTe: 'చర రాశి', modalityEn: 'Movable', directionTe: 'తూర్పు', directionEn: 'East', natureTe: 'సాహసం, నాయకత్వం, చురుకుదనం', natureEn: 'Initiative, courage, direct action' },
  { sign: 1, lord: 8, elementTe: 'భూ తత్వం', elementEn: 'Earth', modalityTe: 'స్థిర రాశి', modalityEn: 'Fixed', directionTe: 'దక్షిణం', directionEn: 'South', natureTe: 'స్థిరత్వం, సౌందర్యం, ఆర్థిక సంపద', natureEn: 'Stability, aesthetics, material comfort' },
  { sign: 2, lord: 6, elementTe: 'వాయు తత్వం', elementEn: 'Air', modalityTe: 'ద్విస్వభావ రాశి', modalityEn: 'Dual', directionTe: 'పశ్చిమం', directionEn: 'West', natureTe: 'వాక్చాతుర్యం, బుద్ధిబలం, బహుముఖ ప్రజ్ఞ', natureEn: 'Intellect, communication, versatility' },
  { sign: 3, lord: 1, elementTe: 'జల తత్వం', elementEn: 'Water', modalityTe: 'చర రాశి', modalityEn: 'Movable', directionTe: 'ఉత్తరం', directionEn: 'North', natureTe: 'భావుకత, మాతృప్రేమ, రక్షణ తత్వం', natureEn: 'Empathy, nurturing, emotional depth' },
  { sign: 4, lord: 0, elementTe: 'అగ్ని తత్వం', elementEn: 'Fire', modalityTe: 'స్థిర రాశి', modalityEn: 'Fixed', directionTe: 'తూర్పు', directionEn: 'East', natureTe: 'రాజసం, ఆత్మగౌరవం, సృజనాత్మకత', natureEn: 'Authority, dignity, creativity' },
  { sign: 5, lord: 6, elementTe: 'భూ తత్వం', elementEn: 'Earth', modalityTe: 'ద్విస్వభావ రాశి', modalityEn: 'Dual', directionTe: 'దక్షిణం', directionEn: 'South', natureTe: 'విశ్లేషణ, క్రమశిక్షణ, సేవాభావం', natureEn: 'Analytical skill, precision, service' },
  { sign: 6, lord: 8, elementTe: 'వాయు తత్వం', elementEn: 'Air', modalityTe: 'చర రాశి', modalityEn: 'Movable', directionTe: 'పశ్చిమం', directionEn: 'West', natureTe: 'సమతుల్యత, న్యాయం, కళాసక్తి', natureEn: 'Balance, diplomacy, partnership' },
  { sign: 7, lord: 2, elementTe: 'జల తత్వం', elementEn: 'Water', modalityTe: 'స్థిర రాశి', modalityEn: 'Fixed', directionTe: 'ఉత్తరం', directionEn: 'North', natureTe: 'లోతైన పరిశోధన, దృఢ సంకల్పం, రహస్య జ్ఞానం', natureEn: 'Depth, resilience, research & transformation' },
  { sign: 8, lord: 4, elementTe: 'అగ్ని తత్వం', elementEn: 'Fire', modalityTe: 'ద్విస్వభావ రాశి', modalityEn: 'Dual', directionTe: 'తూర్పు', directionEn: 'East', natureTe: 'ధర్మం, గురుభక్తి, ఉన్నత లక్ష్యాలు', natureEn: 'Wisdom, dharma, philosophical vision' },
  { sign: 9, lord: 5, elementTe: 'భూ తత్వం', elementEn: 'Earth', modalityTe: 'చర రాశి', modalityEn: 'Movable', directionTe: 'దక్షిణం', directionEn: 'South', natureTe: 'కర్మనిష్ఠ, ఓర్పు, దీర్ఘకాలిక విజయం', natureEn: 'Discipline, endurance, structured ambition' },
  { sign: 10, lord: 5, elementTe: 'వాయు తత్వం', elementEn: 'Air', modalityTe: 'స్థిర రాశి', modalityEn: 'Fixed', directionTe: 'పశ్చిమం', directionEn: 'West', natureTe: 'సామాజిక దృక్పథం, శాస్త్రీయ ఆలోచన', natureEn: 'Systems thinking, humanitarianism, innovation' },
  { sign: 11, lord: 4, elementTe: 'జల తత్వం', elementEn: 'Water', modalityTe: 'ద్విస్వభావ రాశి', modalityEn: 'Dual', directionTe: 'ఉత్తరం', directionEn: 'North', natureTe: 'కరుణ, ఆధ్యాత్మికత, అంతర్దృష్టి', natureEn: 'Compassion, spirituality, intuition' },
];

export const DEEP_EXALTATION_DEG: Record<number, { sign: number; deg: number; debSign: number; debDeg: number }> = {
  0: { sign: 0, deg: 10, debSign: 6, debDeg: 10 },
  1: { sign: 1, deg: 3, debSign: 7, debDeg: 3 },
  2: { sign: 9, deg: 28, debSign: 3, debDeg: 28 },
  6: { sign: 5, deg: 15, debSign: 11, debDeg: 15 },
  4: { sign: 3, deg: 5, debSign: 9, debDeg: 5 },
  8: { sign: 11, deg: 27, debSign: 5, debDeg: 27 },
  5: { sign: 6, deg: 20, debSign: 0, debDeg: 20 },
};

export interface PlanetSymbolDef {
  symbol: '↑' | '↓' | '▫' | '®️' | '©️';
  key: 'exalted' | 'debilitated' | 'vargottama' | 'retro' | 'combust';
  labelTe: string;
  labelEn: string;
}

export const PLANET_SYMBOL_LEGEND: PlanetSymbolDef[] = [
  { symbol: '↑', key: 'exalted', labelTe: 'ఉచ్ఛ', labelEn: 'Exalted' },
  { symbol: '↓', key: 'debilitated', labelTe: 'నీచ', labelEn: 'Debilitated' },
  { symbol: '▫', key: 'vargottama', labelTe: 'వర్గోత్తమ', labelEn: 'Vargottama (D1=D9)' },
  { symbol: '®️', key: 'retro', labelTe: 'వక్రగతి', labelEn: 'Retrograde' },
  { symbol: '©️', key: 'combust', labelTe: 'మౌఢ్యం (అస్తంగత్వం)', labelEn: 'Combust' },
];

export function planetSymbols(opts: {
  digKey?: string;
  vgt?: boolean;
  retro?: boolean;
  combust?: boolean;
}): string {
  let out = '';
  if (opts.digKey === 'exalted') out += '↑';
  if (opts.digKey === 'debilitated') out += '↓';
  if (opts.vgt) out += '▫';
  if (opts.retro) out += '®️';
  if (opts.combust) out += '©️';
  return out;
}

export interface MantraLibraryItem {
  key: string;
  planetId: PlanetId | null;
  titleTe: string;
  titleEn: string;
  deityTe: string;
  deityEn: string;
  devanagari: string;
  teluguScript: string;
  iast: string;
  meaningTe: string;
  meaningEn: string;
  attribution: string;
  recommendedMala: number;
  recommendedCount: number;
  weekdayTe: string;
  weekdayEn: string;
}

export const MANTRA_JAPA_LIBRARY: MantraLibraryItem[] = [
  {
    key: 'surya',
    planetId: 0,
    titleTe: 'సూర్య బీజ & పౌరాణిక మంత్రం',
    titleEn: 'Surya Navagraha Mantra',
    deityTe: 'శ్రీ సూర్య భగవానుడు',
    deityEn: 'Lord Surya (Sun)',
    devanagari: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः ॥',
    teluguScript: 'ఓం హ్రాం హ్రీం హ్రౌం సః సూర్యాయ నమః ॥',
    iast: 'Oṁ hrāṁ hrīṁ hrauṁ saḥ sūryāya namaḥ',
    meaningTe: 'సకల తేజోరూపుడైన ఆదిత్యునికి నమస్కారము — ఆరోగ్యం, ఆత్మవిశ్వాసం మరియు ధర్మబుద్ధిని ప్రసాదించుగాక.',
    meaningEn: 'Salutations to radiant Lord Surya, grantor of vitality, clarity, leadership, and righteous discernment.',
    attribution: 'Navagraha Tantrokta Bija & Vyasa Navagraha Stotra Tradition',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'ఆదివారం (సూర్యోదయ సమయం)',
    weekdayEn: 'Sunday (Sunrise)',
  },
  {
    key: 'chandra',
    planetId: 1,
    titleTe: 'చంద్ర బీజ మంత్రం',
    titleEn: 'Chandra Navagraha Mantra',
    deityTe: 'శ్రీ చంద్రమౌళి / సోముడు',
    deityEn: 'Lord Chandra (Moon)',
    devanagari: 'ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः ॥',
    teluguScript: 'ఓం శ్రాం శ్రీం శ్రౌం సః చంద్రమసే నమః ॥',
    iast: 'Oṁ śrāṁ śrīṁ śrauṁ saḥ candramase namaḥ',
    meaningTe: 'మనోకారకుడైన సోమునకు వందనము — మనశ్శాంతి, స్థిరత్వం మరియు కరుణను కలుగజేయుగాక.',
    meaningEn: 'Salutations to Soma, nourisher of mind, emotional composure, intuition, and inner peace.',
    attribution: 'Tantrokta Navagraha Mantra Sangraha',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'సోమవారం (సాయంత్రం)',
    weekdayEn: 'Monday (Evening)',
  },
  {
    key: 'kuja',
    planetId: 2,
    titleTe: 'కుజ (అంగారక) బీజ మంత్రం',
    titleEn: 'Kuja / Mangala Mantra',
    deityTe: 'శ్రీ అంగారకుడు / సుబ్రహ్మణ్యుడు',
    deityEn: 'Lord Mangala (Mars)',
    devanagari: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः ॥',
    teluguScript: 'ఓం క్రాం క్రీం క్రౌం సః భౌమాయ నమః ॥',
    iast: 'Oṁ krāṁ krīṁ krauṁ saḥ bhaumāya namaḥ',
    meaningTe: 'భూమిపుత్రుడైన అంగారకునికి నమస్కారము — సద్బలం, ధైర్యం మరియు క్రమశిక్షణను ఇచ్చుగాక.',
    meaningEn: 'Salutations to Bhauma (Mars), inspiring disciplined energy, courage, and protective strength.',
    attribution: 'Tantrokta Navagraha Mantra Sangraha',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'మంగళవారం (ఉదయం)',
    weekdayEn: 'Tuesday (Morning)',
  },
  {
    key: 'budha',
    planetId: 6,
    titleTe: 'బుధ బీజ మంత్రం',
    titleEn: 'Budha Navagraha Mantra',
    deityTe: 'శ్రీ బుధ భగవానుడు / మహావిష్ణువు',
    deityEn: 'Lord Budha (Mercury)',
    devanagari: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः ॥',
    teluguScript: 'ఓం బ్రాం బ్రీం బ్రౌం సః బుధాయ నమః ॥',
    iast: 'Oṁ brāṁ brīṁ brauṁ saḥ budhāya namaḥ',
    meaningTe: 'బుద్ధి, వాక్కు మరియు వివేకానికి అధిపతి అయిన బుధునికి నమస్కారము.',
    meaningEn: 'Salutations to Budha, bestower of refined intellect, articulate speech, and analytical skill.',
    attribution: 'Tantrokta Navagraha Mantra Sangraha',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'బుధవారం (ఉదయం)',
    weekdayEn: 'Wednesday (Morning)',
  },
  {
    key: 'guru',
    planetId: 4,
    titleTe: 'గురు (బృహస్పతి) బీజ మంత్రం',
    titleEn: 'Guru / Brihaspati Mantra',
    deityTe: 'శ్రీ బృహస్పతి / దక్షిణామూర్తి',
    deityEn: 'Lord Brihaspati (Jupiter)',
    devanagari: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः ॥',
    teluguScript: 'ఓం గ్రాం గ్రీం గ్రౌం సః గురవే నమః ॥',
    iast: 'Oṁ grāṁ grīṁ grauṁ saḥ gurave namaḥ',
    meaningTe: 'దేవగురువైన బృహస్పతికి నమస్కారము — జ్ఞానం, ధర్మం, శుభబుద్ధి ప్రసాదించుగాక.',
    meaningEn: 'Salutations to Guru Brihaspati, teacher of wisdom, dharmic grace, and expansion.',
    attribution: 'Tantrokta Navagraha Mantra Sangraha',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'గురువారం (బ్రాహ్మీ / ఉదయం)',
    weekdayEn: 'Thursday (Morning)',
  },
  {
    key: 'shukra',
    planetId: 8,
    titleTe: 'శుక్ర బీజ మంత్రం',
    titleEn: 'Shukra Navagraha Mantra',
    deityTe: 'శ్రీ శుక్రాచార్యుడు / మహాలక్ష్మి',
    deityEn: 'Lord Shukra (Venus)',
    devanagari: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः ॥',
    teluguScript: 'ఓం ద్రాం ద్రీం ద్రౌం సః శుక్రాయ నమః ॥',
    iast: 'Oṁ drāṁ drīṁ drauṁ saḥ śukrāya namaḥ',
    meaningTe: 'కళలు, దాంపత్య సౌఖ్యం మరియు సంపదలకు కర్త అయిన శుక్రునికి నమస్కారము.',
    meaningEn: 'Salutations to Shukra, inspirer of harmony, creative grace, devotion, and prosperity.',
    attribution: 'Tantrokta Navagraha Mantra Sangraha',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'శుక్రవారం (ఉదయం)',
    weekdayEn: 'Friday (Morning)',
  },
  {
    key: 'shani',
    planetId: 5,
    titleTe: 'శని బీజ మంత్రం',
    titleEn: 'Shani Navagraha Mantra',
    deityTe: 'శ్రీ శనైశ్చర స్వామి',
    deityEn: 'Lord Shani (Saturn)',
    devanagari: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः ॥',
    teluguScript: 'ఓం ప్రాం ప్రీం ప్రౌం సః శనైశ్చరాయ నమః ॥',
    iast: 'Oṁ prāṁ prīṁ prauṁ saḥ śanaiścarāya namaḥ',
    meaningTe: 'కర్మఫలదాత అయిన శనైశ్చరునికి నమస్కారము — ఓర్పు, న్యాయం మరియు కర్మనిష్ఠను అనుగ్రహించుగాక.',
    meaningEn: 'Salutations to Lord Shanaishchara, dispenser of patient discipline, endurance, and karmic justice.',
    attribution: 'Tantrokta Navagraha Mantra Sangraha',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'శనివారం (సాయంత్రం)',
    weekdayEn: 'Saturday (Evening)',
  },
  {
    key: 'rahu',
    planetId: 3,
    titleTe: 'రాహు బీజ మంత్రం',
    titleEn: 'Rahu Navagraha Mantra',
    deityTe: 'శ్రీ రాహు గ్రహం / దుర్గాదేవి',
    deityEn: 'Rahu (North Node)',
    devanagari: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः ॥',
    teluguScript: 'ఓం భ్రాం భ్రీం భ్రౌం సః రాహవే నమః ॥',
    iast: 'Oṁ bhrāṁ bhrīṁ bhrauṁ saḥ rāhave namaḥ',
    meaningTe: 'ఛాయాగ్రహమైన రాహువుకు నమస్కారము — భ్రమలను తొలగించి వివేకాన్ని ప్రసాదించుగాక.',
    meaningEn: 'Salutations to Rahu, transforming illusion and restlessness into discernment and focus.',
    attribution: 'Tantrokta Navagraha Mantra Sangraha',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'శనివారం / రాహుకాలం',
    weekdayEn: 'Saturday / Rahu Kalam',
  },
  {
    key: 'ketu',
    planetId: 7,
    titleTe: 'కేతు బీజ మంత్రం',
    titleEn: 'Ketu Navagraha Mantra',
    deityTe: 'శ్రీ కేతు గ్రహం / గణేశుడు',
    deityEn: 'Ketu (South Node)',
    devanagari: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः ॥',
    teluguScript: 'ఓం స్రాం స్రీం స్రౌం సః కేతవే నమః ॥',
    iast: 'Oṁ srāṁ srīṁ srauṁ saḥ ketave namaḥ',
    meaningTe: 'మోక్షకారకుడైన కేతువుకు వందనము — ఆధ్యాత్మిక అంతర్దృష్టి మరియు రక్షణను ప్రసాదించుగాక.',
    meaningEn: 'Salutations to Ketu, lamp of spiritual insight, detachment, and quiet protection.',
    attribution: 'Tantrokta Navagraha Mantra Sangraha',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'మంగళవారం / గణేశ పూజ',
    weekdayEn: 'Tuesday / Ganesha Puja',
  },
  {
    key: 'gayatri',
    planetId: null,
    titleTe: 'గాయత్రీ మహామంత్రం',
    titleEn: 'Gayatri Mahamantra',
    deityTe: 'సవితృ పరమాత్మ',
    deityEn: 'Savitr / Universal Light',
    devanagari: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
    teluguScript: 'ఓం భూర్భువః స్వః తత్సవితుర్వరేణ్యం భర్గో దేవస్య ధీమహి ధియో యో నః ప్రచోదయాత్ ॥',
    iast: 'Oṁ bhūr bhuvaḥ svaḥ tat savitur vareṇyaṁ bhargo devasya dhīmahi dhiyo yo naḥ pracodayāt',
    meaningTe: 'ముల్లోకాలకు ప్రకాశకుడైన సవితృ దేవుని దివ్య తేజస్సును ధ్యానిస్తున్నాము; ఆ పరమాత్మ మా బుద్ధిని సన్మార్గంలో నడిపించుగాక.',
    meaningEn: 'We meditate upon the supreme effulgence of Savitr; may that divine light illuminate and guide our intellect.',
    attribution: 'Rigveda 3.62.10 (Vishwamitra Rishi)',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'ప్రతిరోజూ సంధ్యాకాలం',
    weekdayEn: 'Daily at Dawn / Noon / Dusk',
  },
  {
    key: 'ganesha',
    planetId: null,
    titleTe: 'శ్రీ గణేశ మూల మంత్రం',
    titleEn: 'Ganesha Vignaharta Mantra',
    deityTe: 'శ్రీ మహాగణపతి',
    deityEn: 'Lord Maha Ganapati',
    devanagari: 'ॐ गं गणपतये नमः ॥',
    teluguScript: 'ఓం గం గణపతయే నమః ॥',
    iast: 'Oṁ gaṁ gaṇapataye namaḥ',
    meaningTe: 'విఘ్నవినాయకుడైన శ్రీ గణపతికి నమస్కారము — కార్యసిద్ధి మరియు శుభారంభమును అనుగ్రహించుగాక.',
    meaningEn: 'Salutations to Lord Ganapati, remover of obstacles and patron of wisdom and beginnings.',
    attribution: 'Ganapati Atharvashirsha / Puranic Tradition',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'ప్రతిరోజూ / బుధవారం',
    weekdayEn: 'Daily / Wednesday',
  },
  {
    key: 'mahamrityunjaya',
    planetId: null,
    titleTe: 'మహామృత్యుంజయ మంత్రం',
    titleEn: 'Mahamrityunjaya Mantra',
    deityTe: 'శ్రీ త్ర్యంబక శివుడు',
    deityEn: 'Lord Tryambaka Shiva',
    devanagari: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात् ॥',
    teluguScript: 'ఓం త్ర్యంబకం యజామహే సుగంధిం పుష్టివర్ధనమ్ ఉర్వారుకమివ బంధనాన్మృత్యోర్ముక్షీయ మామృతాత్ ॥',
    iast: 'Oṁ tryambakaṁ yajāmahe sugandhiṁ puṣṭivardhanam urvārukam iva bandhanān mṛtyor mukṣīya mā’mṛtāt',
    meaningTe: 'ముక్కంటి అయిన పరమశివుని ఆరాధిస్తున్నాము; ఆరోగ్యం, దీర్ఘాయువు మరియు భయవిముక్తిని ప్రసాదించుగాక.',
    meaningEn: 'We worship the Three-Eyed One, fragrant and nourishing; may He grant healing, vitality, and liberation from fear.',
    attribution: 'Rigveda 7.59.12 (Vasishtha Rishi)',
    recommendedMala: 1,
    recommendedCount: 108,
    weekdayTe: 'సోమవారం / మహాశివరాత్రి / నిత్యం',
    weekdayEn: 'Monday / Daily',
  },
];



