import type { Language } from '../engine/types.ts';

export type PageKey =
  | 'dashboard'
  | 'profiles'
  | 'horoscope'
  | 'parashari'
  | 'relationships'
  | 'vargas'
  | 'strength'
  | 'ashtakavarga'
  | 'yogas'
  | 'nakshatra'
  | 'dasha'
  | 'kp'
  | 'jaimini'
  | 'analysis'
  | 'insights'
  | 'panchanga'
  | 'gochara'
  | 'varshaphala'
  | 'rectification'
  | 'compatibility'
  | 'muhurta'
  | 'prashna'
  | 'numerology'
  | 'western'
  | 'remedies'
  | 'gemstones'
  | 'japa'
  | 'verification'
  | 'ai'
  | 'reports'
  | 'knowledge'
  | 'admin';

export interface NavSubItem {
  id: string;
  subSlug: string;
  labelEn: string;
  labelTe: string;
  labelHi: string;
  subTab: string;
  keywords: string[];
}

export interface NavCategory {
  id: string;
  code: string;
  group: 'workflow' | 'utility';
  catSlug: string;
  labelEn: string;
  labelTe: string;
  labelHi: string;
  icon: string;
  pageKey: PageKey;
  defaultSubSlug: string;
  items: NavSubItem[];
}

function item(
  catSlug: string,
  subSlug: string,
  labelEn: string,
  labelTe: string,
  labelHi: string,
  subTab: string,
  keywords: string[] = [],
): NavSubItem {
  return {
    id: `${catSlug}:${subSlug}`,
    subSlug,
    labelEn,
    labelTe,
    labelHi,
    subTab,
    keywords: [labelEn.toLowerCase(), labelTe.toLowerCase(), ...keywords],
  };
}

export const NAV_CATEGORIES: NavCategory[] = [
  // ================= 01–21 ORDERED SEQUENTIAL WORKFLOW =================
  {
    id: 'wf-01',
    code: '01',
    group: 'workflow',
    catSlug: 'rectification',
    labelEn: 'Birth Time Rectification',
    labelTe: 'జన్మ సమయ సవరణ',
    labelHi: 'जन्म समय संशोधन',
    icon: 'Timer',
    pageKey: 'rectification',
    defaultSubSlug: 'workspace',
    items: [
      item('rectification', 'workspace', 'Rectification Workspace', 'సమయ సవరణ కేంద్రం', 'संशोधन कार्यक्षेत्र', 'workspace'),
      item('rectification', 'life-events', 'Life Events', 'జీవిత ముఖ్య సంఘటనలు', 'जीवन घटनाएँ', 'events'),
      item('rectification', 'candidates', 'Candidate Birth Times', 'ప్రత్యామ్నాయ సమయాలు', 'संभावित समय', 'candidates'),
      item('rectification', 'ascendant-sensitivity', 'Ascendant Sensitivity', 'లగ్న మార్పు సున్నితత్వం', 'लग्न संवेदनशीलता', 'sensitivity'),
      item('rectification', 'cusp-comparison', 'House Cusp Comparison', 'భావ సంధి తులన', 'भाव कस्प तुलना', 'sensitivity'),
      item('rectification', 'varga-comparison', 'Divisional Chart Comparison', 'D9/D10/D60 మార్పులు', 'वर्ग तुलना', 'sensitivity'),
      item('rectification', 'dasha-correlation', 'Dasha Event Correlation', 'దశ-సంఘటన సమన్వయం', 'दशा घटना समन्वय', 'correlation'),
      item('rectification', 'kp-rectification', 'KP Rectification', 'KP రూలింగ్ ప్లానెట్స్ సవరణ', 'के.पी. संशोधन', 'kp'),
      item('rectification', 'jaimini-rectification', 'Jaimini Rectification', 'జైమినీ ఆధారిత సవరణ', 'जैमिनी संशोधन', 'jaimini'),
      item('rectification', 'results', 'Rectification Results', 'సవరణ ఫలితాలు', 'संशोधन परिणाम', 'results'),
      item('rectification', 'confidence', 'Confidence Assessment', 'ఖచ్చితత్వ విశ్లేషణ', 'विश्वसनीयता आकलन', 'results'),
    ],
  },
  {
    id: 'wf-02',
    code: '02',
    group: 'workflow',
    catSlug: 'panchanga',
    labelEn: 'Panchanga',
    labelTe: 'పంచాంగం',
    labelHi: 'पंचांग',
    icon: 'Calendar',
    pageKey: 'panchanga',
    defaultSubSlug: 'today',
    items: [
      item('panchanga', 'today', "Today's Panchanga", 'నేటి పంచాంగం', 'आज का पंचांग', 'today'),
      item('panchanga', 'date-wise', 'Date-wise Panchanga', 'తేదీ వారీ పంచాంగం', 'तिथि अनुसार पंचांग', 'date'),
      item('panchanga', 'tithi', 'Tithi', 'తిథి', 'तिथि', 'limbs'),
      item('panchanga', 'vara', 'Vara', 'వారం', 'वार', 'limbs'),
      item('panchanga', 'nakshatra', 'Nakshatra', 'నక్షత్రం', 'नक्षत्र', 'limbs'),
      item('panchanga', 'yoga', 'Yoga', 'యోగం', 'योग', 'limbs'),
      item('panchanga', 'karana', 'Karana', 'కరణం', 'करण', 'limbs'),
      item('panchanga', 'sun-times', 'Sunrise & Sunset', 'సూర్యోదయ-సూర్యాస్తమయాలు', 'सूर्योदय और सूर्यास्त', 'timings'),
      item('panchanga', 'moon-times', 'Moonrise & Moonset', 'చంద్రోదయ-చంద్రాస్తమయాలు', 'चंद्रोदय और चंद्रास्त', 'timings'),
      item('panchanga', 'paksha', 'Paksha / Masa / Samvatsara', 'పక్షం / మాసం / సంవత్సరం', 'पक्ष / मास / संवत्सर', 'calendar-meta'),
      item('panchanga', 'amanta', 'Amanta Calendar', 'అమాంత మాస క్రమం', 'अमांत कैलेंडर', 'amanta'),
      item('panchanga', 'purnimanta', 'Purnimanta Calendar', 'పూర్ణిమాంత మాస క్రమం', 'पूर्णिमांत कैलेंडर', 'purnimanta'),
      item('panchanga', 'festivals', 'Hindu Festivals', 'పండుగలు & వ్రతాలు', 'हिंदू त्योहार', 'festivals'),
      item('panchanga', 'rahu-kalam', 'Rahu Kalam & Inauspicious Windows', 'రాహు కాలం / యమగండం / గుళిక', 'राहु काल', 'timings'),
      item('panchanga', 'abhijit', 'Abhijit & Brahma Muhurta', 'అభిజిత్ / బ్రహ్మ ముహూర్తం', 'अभिजीत मुहूर्त', 'timings'),
      item('panchanga', 'choghadiya', 'Choghadiya', 'చౌఘడియా', 'चौघड़िया', 'choghadiya'),
      item('panchanga', 'hora', 'Planetary Hora', 'గ్రహ హోర', 'होरा', 'hora'),
    ],
  },
  {
    id: 'wf-03',
    code: '03',
    group: 'workflow',
    catSlug: 'parashari',
    labelEn: 'Planets & Planetary Conditions',
    labelTe: 'గ్రహాలు & గ్రహ అవస్థలు',
    labelHi: 'ग्रह और ग्रह अवस्थाएँ',
    icon: 'BookOpen',
    pageKey: 'parashari',
    defaultSubSlug: 'planetary-analysis',
    items: [
      item('parashari', 'planetary-analysis', 'All Planets & Conditions', 'సమగ్ర గ్రహాలు & అవస్థలు', 'ग्रह विश्लेषण', 'planetary-analysis'),
      item('parashari', 'planetary-avasthas', 'Planetary Avasthas', 'గ్రహ అవస్థలు (బాలాది/దీప్తాది)', 'ग्रह अवस्था', 'planetary-avasthas', ['baladi', 'deeptadi']),
      item('parashari', 'combustion', 'Combustion', 'అస్తంగతం (మౌఢ్యం)', 'अस्त ग्रह', 'combustion', ['moudhyam']),
      item('parashari', 'retrogression', 'Retrogression', 'వక్ర గతి', 'वक्री ग्रह', 'retrogression'),
      item('parashari', 'planetary-war', 'Planetary War', 'గ్రహ యుద్ధం', 'ग्रह युद्ध', 'planetary-war', ['graha yuddha']),
      item('parashari', 'vargottama', 'Vargottama', 'వర్గోత్తమ గ్రహాలు', 'वर्गोत्तम', 'vargottama'),
      item('parashari', 'special-conditions', 'Special Planetary Conditions', 'గండంత, పుష్కర & మృత్యు భాగాలు', 'विशेष ग्रह स्थितियाँ', 'special-conditions', ['gandanta', 'pushkara', 'mrityu bhaga', 'upagraha']),
      item('parashari', 'lagna-analysis', 'Lagna Analysis', 'లగ్న విశ్లేషణ', 'लग्न विश्लेषण', 'lagna-analysis'),
      item('parashari', 'twelve-houses', 'Twelve Houses', 'ద్వాదశ భావాలు', 'बारह भाव', 'twelve-houses'),
      item('parashari', 'house-lords', 'House Lords', 'భావాధిపతులు', 'भावेश', 'house-lords'),
      item('parashari', 'functional-nature', 'Functional Benefics & Malefics', 'శుభ-పాప కారకత్వాలు', 'शुभ-अशुभ ग्रह', 'functional-nature', ['maraka', 'badhaka']),
      item('parashari', 'planetary-strength', 'Planetary Strength', 'గ్రహ బలాబలాలు', 'ग्रह बल', 'planetary-strength'),
      item('parashari', 'integrated-interpretation', 'Integrated Interpretation', 'సమగ్ర పరాశరీ ఫలితాలు', 'समग्र फलित', 'integrated-interpretation'),
    ],
  },
  {
    id: 'wf-04',
    code: '04',
    group: 'workflow',
    catSlug: 'horoscope',
    labelEn: 'Charts',
    labelTe: 'చార్ట్ (జాతక చక్రాలు)',
    labelHi: 'जन्म कुंडली (चार्ट)',
    icon: 'Compass',
    pageKey: 'horoscope',
    defaultSubSlug: 'complete-chart',
    items: [
      item('horoscope', 'complete-chart', 'Complete Birth Chart', 'సంపూర్ణ జన్మ చక్రం', 'संपूर्ण जन्म कुंडली', 'complete-chart', ['kundli', 'jataka']),
      item('horoscope', 'rashi-d1', 'Rashi Chart — D1', 'రాశి చక్రం — D1', 'राशि चक्र — D1', 'rashi-d1', ['d1']),
      item('horoscope', 'bhava-chalit', 'Bhava Chalit', 'భావ చలిత చక్రం', 'भाव चलित', 'bhava-chalit', ['chalit', 'cusps']),
      item('horoscope', 'planetary-positions', 'Planetary Positions', 'గ్రహ స్థితులు', 'ग्रह स्थिति', 'planetary-positions', ['longitude', 'degree']),
      item('horoscope', 'house-analysis', 'House Analysis', 'భావ విశ్లేషణ', 'भाव विश्लेषण', 'house-analysis'),
      item('horoscope', 'ascendant-analysis', 'Ascendant Analysis', 'లగ్న విశ్లేషణ', 'लग्न विश्लेषण', 'ascendant-analysis', ['lagna']),
      item('horoscope', 'moon-chart', 'Moon Chart', 'చంద్ర లగ్న చక్రం', 'चंद्र कुंडली', 'moon-chart', ['chandra lagna']),
      item('horoscope', 'sun-chart', 'Sun Chart', 'సూర్య లగ్న చక్రం', 'सूर्य कुंडली', 'sun-chart', ['surya lagna']),
      item('horoscope', 'north-indian', 'North Indian Chart', 'ఉత్తర భారత చక్రం', 'उत्तर भारतीय चक्र', 'north-indian', ['diamond']),
      item('horoscope', 'south-indian', 'South Indian Chart', 'దక్షిణ భారత చక్రం', 'दक्षिण भारतीय चक्र', 'south-indian', ['square']),
      item('horoscope', 'planetary-aspects', 'Planetary Aspects', 'గ్రహ దృష్టులు', 'ग्रह दृष्टि', 'planetary-aspects', ['drishti']),
      item('horoscope', 'planetary-dignity', 'Planetary Dignity', 'గ్రహ ఉచ్చ-నీచ స్థితి', 'ग्रह उच्च-नीच स्थिति', 'planetary-dignity', ['exalted', 'debilitated']),
      item('horoscope', 'dispositor-analysis', 'Dispositor Analysis', 'అధిపతి గొలుసు విశ్లేషణ', 'डिस्पोजिटर विश्लेषण', 'dispositor-analysis'),
    ],
  },
  {
    id: 'wf-05',
    code: '05',
    group: 'workflow',
    catSlug: 'relationships',
    labelEn: 'Planetary Relationships',
    labelTe: 'గ్రహమైత్రి (పంచధా మైత్రి)',
    labelHi: 'ग्रह मैत्री (पंचधा मैत्री)',
    icon: 'GitCompare',
    pageKey: 'relationships',
    defaultSubSlug: 'panchadha-maitri',
    items: [
      item('relationships', 'panchadha-maitri', 'Panchadha Maitri (5-Fold)', 'పంచధా మైత్రి (9×9 పట్టిక)', 'पंचधा मैत्री', 'panchadha', ['friendship', 'compound']),
      item('relationships', 'naisargika-maitri', 'Natural Relationships', 'నైసర్గిక మైత్రి', 'नैसर्गिक मैत्री', 'natural'),
      item('relationships', 'tatkalika-maitri', 'Temporary Relationships', 'తాత్కాలిక మైత్రి', 'तात्कालिक मैत्री', 'temporary'),
      item('relationships', 'pair-inspector', 'Pairwise Inspector', 'గ్రహ జంటల పరిశీలన', 'ग्रह युग्म जांच', 'inspector'),
    ],
  },
  {
    id: 'wf-06',
    code: '06',
    group: 'workflow',
    catSlug: 'divisional-charts',
    labelEn: 'Varga (Divisional Charts)',
    labelTe: 'వర్గ (D1–D144)',
    labelHi: 'वर्ग कुंडलियाँ (D1–D144)',
    icon: 'Grid',
    pageKey: 'vargas',
    defaultSubSlug: 'varga-overview',
    items: [
      item('divisional-charts', 'varga-overview', 'Varga Overview', 'వర్గ చక్రాల సారాంశం', 'वर्ग सारांश', 'overview'),
      item('divisional-charts', 'd1', 'D1 Rashi', 'D1 రాశి', 'D1 राशि', 'D1', ['rashi']),
      item('divisional-charts', 'd2', 'D2 Hora', 'D2 హోర', 'D2 होरा', 'D2', ['hora', 'wealth']),
      item('divisional-charts', 'd3', 'D3 Drekkana', 'D3 ద్రేక్కాణ', 'D3 द्रेष्काण', 'D3', ['drekkana', 'siblings']),
      item('divisional-charts', 'd4', 'D4 Chaturthamsha', 'D4 చతుర్థాంశ', 'D4 चतुर्थांश', 'D4', ['property']),
      item('divisional-charts', 'd5', 'D5 Panchamsha', 'D5 పంచమాంశ', 'D5 पंचमांश', 'D5', ['fame']),
      item('divisional-charts', 'd6', 'D6 Shashthamsha', 'D6 షష్ఠాంశ', 'D6 षष्ठांश', 'D6', ['health']),
      item('divisional-charts', 'd7', 'D7 Saptamsha', 'D7 సప్తమాంశ', 'D7 सप्तमांश', 'D7', ['children']),
      item('divisional-charts', 'd8', 'D8 Ashtamsha', 'D8 అష్టమాంశ', 'D8 अष्टमांश', 'D8', ['longevity']),
      item('divisional-charts', 'd9', 'D9 Navamsha', 'D9 నవాంశ', 'D9 नवमांश', 'D9', ['navamsa', 'marriage']),
      item('divisional-charts', 'd10', 'D10 Dashamsha', 'D10 దశాంశ', 'D10 दशमांश', 'D10', ['career']),
      item('divisional-charts', 'd11', 'D11 Rudramsha', 'D11 రుద్రాంశ', 'D11 रुद्रांश', 'D11', ['gains']),
      item('divisional-charts', 'd12', 'D12 Dwadashamsha', 'D12 ద్వాదశాంశ', 'D12 द्वादशांश', 'D12', ['parents']),
      item('divisional-charts', 'd16', 'D16 Shodashamsha', 'D16 షోడశాంశ', 'D16 षोडशांश', 'D16', ['vehicles']),
      item('divisional-charts', 'd20', 'D20 Vimshamsha', 'D20 వింశాంశ', 'D20 विंशांश', 'D20', ['spirituality']),
      item('divisional-charts', 'd24', 'D24 Chaturvimshamsha', 'D24 చతుర్వింశాంశ', 'D24 चतुर्विंशांश', 'D24', ['education']),
      item('divisional-charts', 'd27', 'D27 Saptavimshamsha', 'D27 సప్తవింశాంశ', 'D27 सप्तविंशांश', 'D27', ['strength']),
      item('divisional-charts', 'd30', 'D30 Trimshamsha', 'D30 త్రింశాంశ', 'D30 त्रिंशांश', 'D30', ['evils']),
      item('divisional-charts', 'd40', 'D40 Khavedamsha', 'D40 ఖవేదాంశ', 'D40 खवेदांश', 'D40'),
      item('divisional-charts', 'd45', 'D45 Akshavedamsha', 'D45 అక్షవేదాంశ', 'D45 अक्षवेदांश', 'D45'),
      item('divisional-charts', 'd60', 'D60 Shashtiamsha', 'D60 షష్టియాంశ', 'D60 षष्ट्यंश', 'D60', ['karma']),
      item('divisional-charts', 'd81', 'D81 Nava-Navamsha', 'D81 నవ-నవాంశ', 'D81 नव-नवमांश', 'D81', ['nadi', 'extended']),
      item('divisional-charts', 'd108', 'D108 Ashtottaramsha', 'D108 అష్టోత్తరాంశ', 'D108 अष्टोत्तरांश', 'D108', ['ashtottari', 'extended']),
      item('divisional-charts', 'd144', 'D144 Dwadasha-Dwadashamsha', 'D144 ద్వాదశాంశ-ద్వాదశాంశ', 'D144 द्वादशा-द्वादशांश', 'D144', ['kalachakra', 'extended']),
      item('divisional-charts', 'varga-comparison', 'Varga Comparison', 'వర్గ తులనాత్మక చక్రం', 'वर्ग तुलना', 'comparison'),
      item('divisional-charts', 'shodasha-varga', 'Shodasha Varga', 'షోడశ వర్గ పట్టిక', 'षोडश वर्ग', 'shodasha'),
      item('divisional-charts', 'vargottama-analysis', 'Vargottama Analysis', 'వర్గోత్తమ విశ్లేషణ', 'वर्गोत्तम विश्लेषण', 'vargottama'),
      item('divisional-charts', 'varga-strength', 'Varga Strength', 'వర్గ బలం (వింశోపక)', 'वर्ग बल', 'strength'),
      item('divisional-charts', 'varga-interpretations', 'Varga Interpretations', 'వర్గ ఫలిత వివరణ', 'वर्ग फलित', 'interpretations'),
    ],
  },
  {
    id: 'wf-07',
    code: '07',
    group: 'workflow',
    catSlug: 'dasha-systems',
    labelEn: 'Dasha',
    labelTe: 'దశ',
    labelHi: 'दशा प्रणाली',
    icon: 'Clock',
    pageKey: 'dasha',
    defaultSubSlug: 'overview',
    items: [
      item('dasha-systems', 'overview', 'Dasha Overview', 'దశా సారాంశం', 'दशा सारांश', 'overview'),
      item('dasha-systems', 'vimshottari', 'Vimshottari Dasha', 'వింశోత్తరి దశ', 'विंशोत्तरी दशा', 'vimshottari'),
      item('dasha-systems', 'mahadasha', 'Mahadasha', 'మహాదశ', 'महादशा', 'vimshottari-md'),
      item('dasha-systems', 'antardasha', 'Antardasha', 'అంతర్దశ', 'अंतर्दशा', 'vimshottari-ad'),
      item('dasha-systems', 'pratyantardasha', 'Pratyantardasha', 'ప్రత్యంతర్దశ', 'प्रत्यंतर्दशा', 'vimshottari-pd'),
      item('dasha-systems', 'sookshma', 'Sookshma Dasha', 'సూక్ష్మ దశ', 'सूक्ष्म दशा', 'vimshottari-sd'),
      item('dasha-systems', 'prana', 'Prana Dasha', 'ప్రాణ దశ', 'प्राण दशा', 'vimshottari-prana'),
      item('dasha-systems', 'yogini', 'Yogini Dasha', 'యోగిని దశ', 'योगिनी दशा', 'yogini'),
      item('dasha-systems', 'ashtottari', 'Ashtottari Dasha', 'అష్టోత్తరి దశ', 'अष्टोत्तरी दशा', 'ashtottari'),
      item('dasha-systems', 'chara', 'Chara Dasha', 'చర దశ (జైమినీ)', 'चर दशा', 'chara'),
      item('dasha-systems', 'narayana', 'Narayana Dasha', 'నారాయణ దశ', 'नारायण दशा', 'narayana'),
      item('dasha-systems', 'kalachakra', 'Kalachakra Dasha', 'కాలచక్ర దశ', 'कालचक्र दशा', 'kalachakra'),
      item('dasha-systems', 'shoola', 'Shoola Dasha', 'శూల దశ (జైమినీ)', 'शूल दशा', 'shoola'),
      item('dasha-systems', 'mandooka', 'Mandooka Dasha', 'మండూక దశ (జైమినీ)', 'मंडूक दशा', 'mandooka'),
      item('dasha-systems', 'timeline', 'Dasha Timeline', 'దశా కాలక్రమం', 'दशा समयरेखा', 'timeline'),
      item('dasha-systems', 'current', 'Current Dasha', 'ప్రస్తుత దశా కాలం', 'वर्तमान दशा', 'current'),
      item('dasha-systems', 'upcoming', 'Upcoming Dasha', 'రాబోయే దశలు', 'आगामी दशा', 'upcoming'),
      item('dasha-systems', 'comparison', 'Dasha Comparison', 'దశల తులనాత్మక పరిశీలన', 'दशा तुलना', 'comparison'),
      item('dasha-systems', 'transit-correlation', 'Dasha & Transit Correlation', 'దశ–గోచార సమన్వయం', 'दशा-गोचर समन्वय', 'correlation'),
    ],
  },
  {
    id: 'wf-08',
    code: '08',
    group: 'workflow',
    catSlug: 'ashtakavarga',
    labelEn: 'Ashtakavarga',
    labelTe: 'అష్టకవర్గ',
    labelHi: 'अष्टकवर्ग',
    icon: 'Table',
    pageKey: 'ashtakavarga',
    defaultSubSlug: 'overview',
    items: [
      item('ashtakavarga', 'overview', 'Ashtakavarga Overview', 'అష్టకవర్గ సారాంశం', 'अष्टकवर्ग सारांश', 'overview', ['bindu', '337']),
      item('ashtakavarga', 'bav', 'Bhinna Ashtakavarga', 'భిన్న అష్టకవర్గం', 'भिन्नाष्टकवर्ग', 'bav'),
      item('ashtakavarga', 'sav', 'Sarva Ashtakavarga', 'సర్వ అష్టకవర్గం', 'सर्वाष्टकवर्ग', 'sav'),
      item('ashtakavarga', 'sun', 'Sun Ashtakavarga', 'సూర్య అష్టకవర్గం', 'सूर्य अष्टकवर्ग', 'sun'),
      item('ashtakavarga', 'moon', 'Moon Ashtakavarga', 'చంద్ర అష్టకవర్గం', 'चंद्र अष्टकवर्ग', 'moon'),
      item('ashtakavarga', 'mars', 'Mars Ashtakavarga', 'కుజ అష్టకవర్గం', 'मंगल अष्टकवर्ग', 'mars'),
      item('ashtakavarga', 'mercury', 'Mercury Ashtakavarga', 'బుధ అష్టకవర్గం', 'बुध अष्टकवर्ग', 'mercury'),
      item('ashtakavarga', 'jupiter', 'Jupiter Ashtakavarga', 'గురు అష్టకవర్గం', 'गुरु अष्टकवर्ग', 'jupiter'),
      item('ashtakavarga', 'venus', 'Venus Ashtakavarga', 'శుక్ర అష్టకవర్గం', 'शुक्र अष्टकवर्ग', 'venus'),
      item('ashtakavarga', 'saturn', 'Saturn Ashtakavarga', 'శని అష్టకవర్గం', 'शनि अष्टकवर्ग', 'saturn'),
      item('ashtakavarga', 'trikona-shodhana', 'Trikona Shodhana', 'త్రికోణ శోధన', 'त्रिकोण शोधन', 'trikona'),
      item('ashtakavarga', 'ekadhipatya-shodhana', 'Ekadhipatya Shodhana', 'ఏకాధిపత్య శోధన', 'एकाधिपत्य शोधन', 'ekadhipatya'),
      item('ashtakavarga', 'rashi-pinda', 'Rashi Pinda', 'రాశి పిండం', 'राशि पिंड', 'pinda'),
      item('ashtakavarga', 'graha-pinda', 'Graha Pinda', 'గ్రహ పిండం', 'ग्रह पिंड', 'pinda'),
      item('ashtakavarga', 'sodhya-pinda', 'Sodhya Pinda', 'శోధ్య పిండం', 'शोध्य पिंड', 'pinda'),
      item('ashtakavarga', 'transit-ashtakavarga', 'Transit Ashtakavarga', 'గోచార అష్టకవర్గం', 'गोचर अष्टकवर्ग', 'transit'),
    ],
  },
  {
    id: 'wf-09',
    code: '09',
    group: 'workflow',
    catSlug: 'gochara',
    labelEn: 'Transits (Gochara)',
    labelTe: 'గోచారం',
    labelHi: 'गोचर',
    icon: 'Orbit',
    pageKey: 'gochara',
    defaultSubSlug: 'current',
    items: [
      item('gochara', 'current', 'Current Transits', 'ప్రస్తుత గ్రహ గోచారం', 'वर्तमान गोचर', 'current'),
      item('gochara', 'calendar', 'Planetary Transit Calendar', 'గ్రహ రాశి మార్పుల క్యాలెండర్', 'गोचर कैलेंडर', 'calendar'),
      item('gochara', 'by-sign', 'Transit by Sign', 'రాశి వారీ గోచారం', 'राशि अनुसार गोचर', 'by-sign'),
      item('gochara', 'by-nakshatra', 'Transit by Nakshatra', 'నక్షత్ర గోచారం', 'नक्षत्र गोचर', 'by-nakshatra'),
      item('gochara', 'saturn', 'Saturn Transit', 'శని గోచారం', 'शनि गोचर', 'saturn'),
      item('gochara', 'jupiter', 'Jupiter Transit', 'గురు గోచారం', 'गुरु गोचर', 'jupiter'),
      item('gochara', 'rahu-ketu', 'Rahu-Ketu Transit', 'రాహు-కేతు గోచారం', 'राहु-केतु गोचर', 'rahu-ketu'),
      item('gochara', 'sade-sati', 'Sade Sati', 'ఏలినాటి శని', 'साढ़ेसाती', 'sade-sati'),
      item('gochara', 'ashtama-shani', 'Ashtama Shani', 'అష్టమ శని', 'अष्टम शनि', 'sade-sati'),
      item('gochara', 'dhaiya', 'Dhaiya / Ardhashtama', 'అర్ధాష్టమ శని', 'ढैया', 'sade-sati'),
      item('gochara', 'house-analysis', 'Transit House Analysis', 'గోచార భావ ఫలితాలు', 'गोचर भाव फल', 'houses'),
      item('gochara', 'ashtakavarga', 'Transit Ashtakavarga', 'గోచార అష్టకవర్గ బిందువులు', 'गोचर अष्टकवर्ग', 'ashtakavarga'),
      item('gochara', 'dasha-correlation', 'Dasha & Transit Correlation', 'దశ-గోచార సమన్వయం', 'दशा-गोचर समन्वय', 'dasha-corr'),
      item('gochara', 'monthly', 'Monthly Predictions', 'మాస ఫలితాలు', 'मासिक फल', 'forecast'),
      item('gochara', 'annual', 'Annual Predictions', 'వార్షిక ఫలితాలు', 'वार्षिक फल', 'forecast'),
    ],
  },
  {
    id: 'wf-10',
    code: '10',
    group: 'workflow',
    catSlug: 'kp-astrology',
    labelEn: 'KP Astrology',
    labelTe: 'కెపి (KP జ్యోతిషం)',
    labelHi: 'के.पी. ज्योतिष',
    icon: 'Target',
    pageKey: 'kp',
    defaultSubSlug: 'overview',
    items: [
      item('kp-astrology', 'overview', 'KP Overview', 'KP సారాంశం', 'के.पी. सारांश', 'overview', ['krishnamurti']),
      item('kp-astrology', 'birth-chart', 'KP Birth Chart', 'KP జన్మ చక్రం', 'के.पी. कुंडली', 'chart'),
      item('kp-astrology', 'cusps', 'KP Cusps', 'KP భావ సంధులు', 'के.पी. कस्प', 'cusps'),
      item('kp-astrology', 'placidus', 'Placidus Houses', 'ప్లాసిడస్ భావాలు', 'प्लेसिडस भाव', 'cusps'),
      item('kp-astrology', 'planet-significators', 'Planetary Significators', 'గ్రహ కారకత్వాలు (ABCD)', 'ग्रह कारक', 'planet-sig'),
      item('kp-astrology', 'cusp-significators', 'Cusp Significators', 'భావ కారకత్వాలు', 'भाव कारक', 'cusp-sig'),
      item('kp-astrology', 'star-lords', 'Star Lords', 'నక్షత్ర అధిపతులు', 'नक्षत्र स्वामी', 'table'),
      item('kp-astrology', 'sub-lords', 'Sub Lords', 'సబ్ లార్డ్లు', 'उप-स्वामी', 'table', ['kp sub lord']),
      item('kp-astrology', 'sub-sub-lords', 'Sub-Sub Lords', 'సబ్-సబ్ లార్డ్లు', 'उप-उप स्वामी', 'table'),
      item('kp-astrology', 'ruling-planets', 'Ruling Planets', 'రూలింగ్ ప్లానెట్స్', 'रूलिंग प्लैनेट्स', 'ruling-planets'),
      item('kp-astrology', 'planetary-table', 'KP Planetary Table', 'KP గ్రహ పట్టిక', 'के.पी. ग्रह तालिका', 'table'),
      item('kp-astrology', 'house-analysis', 'KP House Analysis', 'KP భావ విశ్లేషణ', 'के.पी. भाव विश्लेषण', 'cusp-sig'),
      item('kp-astrology', 'event-analysis', 'KP Event Analysis', 'KP సంఘటన విశ్లేషణ', 'के.पी. घटना विश्लेषण', 'events'),
      item('kp-astrology', 'timing', 'KP Timing', 'KP కాల నిర్ణయం', 'के.पी. समय निर्णय', 'events'),
      item('kp-astrology', 'marriage', 'Marriage (KP)', 'వివాహ విశ్లేషణ', 'विवाह (के.पी.)', 'event-marriage'),
      item('kp-astrology', 'career', 'Career (KP)', 'వృత్తి విశ్లేషణ', 'करियर (के.पी.)', 'event-career'),
      item('kp-astrology', 'employment', 'Employment (KP)', 'ఉద్యోగ విశ్లేషణ', 'रोज़गार (के.पी.)', 'event-employment'),
      item('kp-astrology', 'business', 'Business (KP)', 'వ్యాపార విశ్లేషణ', 'व्यापार (के.पी.)', 'event-business'),
      item('kp-astrology', 'property', 'Property (KP)', 'గృహ / భూమి', 'संपत्ति (के.पी.)', 'event-property'),
      item('kp-astrology', 'education', 'Education (KP)', 'విద్య విశ్లేషణ', 'शिक्षा (के.पी.)', 'event-education'),
      item('kp-astrology', 'children', 'Children (KP)', 'సంతాన విశ్లేషణ', 'संतान (के.पी.)', 'event-children'),
      item('kp-astrology', 'foreign', 'Foreign Settlement (KP)', 'విదేశ ప్రయాణం', 'विदेश योग (के.पी.)', 'event-foreign'),
      item('kp-astrology', 'horary', 'KP Horary 1–249', 'KP హోరరీ 1–249', 'के.पी. होररी 1–249', 'horary'),
      item('kp-astrology', 'conventions', 'KP Old / New Conventions', 'KP పాత / కొత్త నియమాలు', 'के.पी. नियम', 'conventions'),
    ],
  },
  {
    id: 'wf-11',
    code: '11',
    group: 'workflow',
    catSlug: 'analysis',
    labelEn: 'Complete Horoscope Analysis',
    labelTe: 'విశ్లేషణ (12 భావాల సంపూర్ణ పరిశీలన)',
    labelHi: 'संपूर्ण कुंडली विश्लेषण',
    icon: 'Compass',
    pageKey: 'analysis',
    defaultSubSlug: 'twelve-bhavas',
    items: [
      item('analysis', 'twelve-bhavas', 'All 12 Bhavas Synthesis', 'ద్వాదశ భావ సమగ్ర విశ్లేషణ', 'बारह भाव संश्लेषण', 'bhavas', ['complete horoscope analysis', '12 houses']),
      item('analysis', 'career-wealth', 'Career, Wealth & Dharma (2/6/9/10/11)', 'వృత్తి, ధన & ధర్మ భావాలు', 'करियर व धन', 'artha'),
      item('analysis', 'relationships-family', 'Marriage, Family & Children (2/4/5/7)', 'కుటుంబం, వివాహం & సంతానం', 'परिवार व विवाह', 'kama'),
      item('analysis', 'longevity-moksha', 'Health, Dusthanas & Moksha (6/8/12)', 'ఆరోగ్యం, దుస్థానాలు & మోక్షం', 'स्वास्थ्य व मोक्ष', 'moksha'),
    ],
  },
  {
    id: 'wf-12',
    code: '12',
    group: 'workflow',
    catSlug: 'insights',
    labelEn: 'Deep Insights & Planetary Interactions',
    labelTe: 'అంతర్దృష్టి (గ్రహ దృష్టి & నీచభంగ విశ్లేషణ)',
    labelHi: 'गहन अंतर्दृष्टि और ग्रह विश्लेषण',
    icon: 'Brain',
    pageKey: 'insights',
    defaultSubSlug: 'planetary-verdicts',
    items: [
      item('insights', 'planetary-verdicts', 'Deep Planetary Insights & Verdicts', 'గ్రహ సారాంశం & తుది నిర్ణయాలు', 'गहन ग्रह निष्कर्ष', 'verdicts', ['support', 'affliction', 'mitigation']),
      item('insights', 'graha-drishti', 'Graha Drishti (Full & Partial)', 'గ్రహ దృష్టి (సంపూర్ణ & పాక్షిక)', 'ग्रह दृष्टि', 'graha-drishti'),
      item('insights', 'rashi-drishti', 'Jaimini Rashi Drishti', 'జైమినీ రాశి దృష్టి', 'राशि दृष्टि', 'rashi-drishti'),
      item('insights', 'conjunctions', 'Conjunctions & Mutual Aspects', 'యుతి & పరస్పర దృష్టులు', 'युति व दृष्टि', 'conjunctions'),
      item('insights', 'neechabhanga', 'Neechabhanga & Cancellation Rules', 'నీచభంగ రాజయోగ & నివారణలు', 'नीचभंग विश्लेषण', 'neechabhanga'),
      item('insights', 'influence-graph', 'Interactive Planetary Influence Graph', 'గ్రహ ప్రభావ నెట్‌వర్క్ గ్రాఫ్', 'ग्रह प्रभाव ग्राफ', 'graph'),
    ],
  },
  {
    id: 'wf-13',
    code: '13',
    group: 'workflow',
    catSlug: 'varshaphala',
    labelEn: 'Varshaphala',
    labelTe: 'వర్షఫలం',
    labelHi: 'वर्षफल',
    icon: 'Sun',
    pageKey: 'varshaphala',
    defaultSubSlug: 'solar-return',
    items: [
      item('varshaphala', 'solar-return', 'Solar Return Chart', 'వర్ష ప్రవేశ చక్రం', 'सौर वापसी कुंडली', 'chart'),
      item('varshaphala', 'muntha', 'Muntha & Monthly Progression', 'ముంథ & 12 మాస ఫలితాలు', 'मुंथा', 'muntha'),
      item('varshaphala', 'tajika-aspects', 'Tajika Yogas (16 + Nakta/Yamaya)', 'తాజిక యోగాలు', 'ताजिक योग', 'tajika'),
      item('varshaphala', 'sahams', 'Sahams', 'సహామలు', 'सहम', 'sahams'),
      item('varshaphala', 'year-lord', 'Year Lord (Varshesha)', 'వర్షేశ్వరుడు', 'वर्षेश', 'varshesha'),
      item('varshaphala', 'annual-dasha', 'Annual Dasha (Mudda)', 'ముద్దా దశ', 'मुद्दा दशा', 'mudda'),
      item('varshaphala', 'planetary-analysis', 'Annual Planetary Analysis', 'వార్షిక గ్రహ స్థితులు', 'वार्षिक ग्रह विश्लेषण', 'planets'),
      item('varshaphala', 'yearly-report', 'Yearly Report', 'వార్షిక నివేదిక', 'वार्षिक रिपोर्ट', 'report'),
    ],
  },
  {
    id: 'wf-14',
    code: '14',
    group: 'workflow',
    catSlug: 'prashna',
    labelEn: 'Prashna',
    labelTe: 'ప్రశ్న',
    labelHi: 'प्रश्न शास्त्र',
    icon: 'HelpCircle',
    pageKey: 'prashna',
    defaultSubSlug: 'workspace',
    items: [
      item('prashna', 'workspace', 'Prashna Workspace', 'ప్రశ్న కేంద్రం', 'प्रश्न कार्यक्षेत्र', 'workspace'),
      item('prashna', 'chart', 'Prashna Chart', 'తత్కాల ప్రశ్న చక్రం', 'प्रश्न कुंडली', 'chart'),
      item('prashna', 'kp-horary', 'KP Horary', 'KP 1–249 హోరరీ', 'के.पी. होररी', 'horary'),
      item('prashna', 'traditional', 'Traditional Prashna', 'అష్టమంగళ / సంప్రదాయ ప్రశ్న', 'पारंपरिक प्रश्न', 'traditional'),
      item('prashna', 'houses', 'House Analysis', 'ప్రశ్న భావ విశ్లేషణ', 'भाव विश्लेषण', 'houses'),
      item('prashna', 'significators', 'Planetary Significators', 'గ్రహ కారకత్వాలు', 'ग्रह कारक', 'significators'),
      item('prashna', 'interpretation', 'Question Interpretation', 'ప్రశ్న ఫలిత వివరణ', 'प्रश्न फलित', 'interpretation'),
      item('prashna', 'report', 'Prashna Report', 'ప్రశ్న నివేదిక', 'प्रश्न रिपोर्ट', 'report'),
    ],
  },
  {
    id: 'wf-15',
    code: '15',
    group: 'workflow',
    catSlug: 'compatibility',
    labelEn: 'Compatibility',
    labelTe: 'పొంతన (వివాహ మేళనం)',
    labelHi: 'विवाह मिलान',
    icon: 'HeartHandshake',
    pageKey: 'compatibility',
    defaultSubSlug: 'ashtakoota',
    items: [
      item('compatibility', 'ashtakoota', 'Ashtakoota (36 Gunas)', 'అష్టకూట పొంతన (36 గుణాలు)', 'अष्टकूट', 'ashtakoota'),
      item('compatibility', 'dashakoota', 'Dashakoota', 'దశకూట పొంతన (10)', 'दशकूट', 'dashakoota'),
      item('compatibility', 'kuja-dosha', 'Kuja Dosha', 'కుజ దోష తులన', 'मांगलिक मिलान', 'kuja'),
      item('compatibility', 'd9-compat', 'D1/D9/7th & Dasha Checks', 'D1 / D9 / సప్తమ / దశా తులన', 'D9 तुलना', 'charts'),
      item('compatibility', 'koota-details', 'All 8 Koota Breakdown', 'అష్టకూటాల సమగ్ర వివరణ', 'कूट विवरण', 'koota-details'),
      item('compatibility', 'report', 'Detailed Marriage Report', 'వివాహ పొంతన నివేదిక', 'विस्तृत विवाह रिपोर्ट', 'report'),
    ],
  },
  {
    id: 'wf-16',
    code: '16',
    group: 'workflow',
    catSlug: 'muhurta',
    labelEn: 'Muhurta',
    labelTe: 'ముహూర్తం',
    labelHi: 'मुहूर्त',
    icon: 'CalendarCheck',
    pageKey: 'muhurta',
    defaultSubSlug: 'overview',
    items: [
      item('muhurta', 'overview', 'Muhurta Finder', 'ముహూర్త అన్వేషణ', 'मुहूर्त खोज', 'overview'),
      item('muhurta', 'marriage', 'Marriage Muhurta', 'వివాహ ముహూర్తం', 'विवाह मुहूर्त', 'marriage'),
      item('muhurta', 'griha-pravesh', 'Griha Pravesh', 'గృహ ప్రవేశ ముహూర్తం', 'गृह प्रवेश मुहूर्त', 'griha_pravesh'),
      item('muhurta', 'business', 'Business Opening', 'వ్యాపార ప్రారంభం', 'व्यापार शुभारंभ', 'business'),
      item('muhurta', 'vehicle', 'Vehicle Purchase', 'వాహన కొనుగోలు', 'वाहन खरीद', 'vehicle'),
      item('muhurta', 'travel', 'Travel Muhurta', 'ప్రయాణ ముహూర్తం', 'यात्रा मुहूर्त', 'travel'),
      item('muhurta', 'education', 'Education / Vidyarambham', 'విద్యారంభం', 'विद्यारंभ', 'education'),
      item('muhurta', 'naming', 'Naming Ceremony', 'నామకరణం', 'नामकरण', 'naming'),
      item('muhurta', 'location', 'Location-based Muhurta', 'స్థానిక అక్షాంశ ముహూర్తం', 'स्थान आधारित मुहूर्त', 'location'),
    ],
  },
  {
    id: 'wf-17',
    code: '17',
    group: 'workflow',
    catSlug: 'numerology',
    labelEn: 'Numerology',
    labelTe: 'సంఖ్యాశాస్త్రం',
    labelHi: 'अंक ज्योतिष',
    icon: 'Hash',
    pageKey: 'numerology',
    defaultSubSlug: 'overview',
    items: [
      item('numerology', 'overview', 'Numerology Overview', 'సంఖ్యాశాస్త్ర సారాంశం', 'अंक ज्योतिष सारांश', 'overview'),
      item('numerology', 'chaldean', 'Chaldean Numerology', 'కాల్డియన్ పద్ధతి', 'कैल्डियन पद्धति', 'chaldean'),
      item('numerology', 'pythagorean', 'Pythagorean Numerology', 'పైథాగరియన్ పద్ధతి', 'पाइथागोरस पद्धति', 'pythagorean'),
      item('numerology', 'vedic', 'Vedic Numerology & Yantra', 'వైదిక సంఖ్యాశాస్త్రం & యంత్రం', 'वैदिक अंक ज्योतिष', 'vedic'),
      item('numerology', 'loshu', 'Lo Shu Grid', 'లో షు గ్రిడ్', 'लो शू ग्रिड', 'loshu'),
      item('numerology', 'name-analysis', 'Name / Mobile / Business / Vehicle', 'పేరు / వ్యాపార / మొబైల్ / వాహన సంఖ్య', 'नाम विश्लेषण', 'name'),
      item('numerology', 'personal-year', 'Personal Year / Month / Day', 'వ్యక్తిగత సంవత్సరం / మాసం / దినం', 'व्यक्तिगत वर्ष', 'personal-year'),
      item('numerology', 'reports', 'Numerology Report', 'సంఖ్యాశాస్త్ర నివేదిక', 'अंक रिपोर्ट', 'report'),
    ],
  },
  {
    id: 'wf-18',
    code: '18',
    group: 'workflow',
    catSlug: 'remedies',
    labelEn: 'Remedies',
    labelTe: 'పరిహారాలు',
    labelHi: 'उपाय',
    icon: 'Flame',
    pageKey: 'remedies',
    defaultSubSlug: 'overview',
    items: [
      item('remedies', 'overview', 'Chart-Linked Remedies', 'జాతక ఆధారిత పరిహారాలు', 'कुंडली आधारित उपाय', 'overview'),
      item('remedies', 'mantra', 'Mantra & Stotra', 'గ్రహ మంత్రాలు & స్తోత్రాలు', 'मंत्र व स्तोत्र', 'mantra'),
      item('remedies', 'daan', 'Daan & Charitable Remedies', 'దాన ధర్మాలు', 'दान', 'daan'),
      item('remedies', 'rudraksha', 'Rudraksha Guidance', 'రుద్రాక్ష ధారణ', 'रुद्राक्ष', 'rudraksha'),
      item('remedies', 'puja', 'Puja, Vrata & Temple', 'పూజ, వ్రత & ఆలయ దర్శనం', 'पूजा और व्रत', 'puja'),
      item('remedies', 'lal-kitab', 'Lal Kitab Upay', 'లాల్ కితాబ్ ఉపాయాలు', 'लाल किताब', 'lalkitab'),
      item('remedies', 'vastu', 'Vastu Guidance', 'వాస్తు మార్గదర్శనం', 'वास्तु', 'vastu'),
      item('remedies', 'references', 'Traditional Remedial References', 'సంప్రదాయ ఆధార గ్రంథాలు', 'पारंपरिक संदर्भ', 'references'),
    ],
  },
  {
    id: 'wf-19',
    code: '19',
    group: 'workflow',
    catSlug: 'gemstones',
    labelEn: 'Gemstone Recommendations',
    labelTe: 'అదృష్ట రత్నాలు',
    labelHi: 'रत्न सुझाव',
    icon: 'Gem',
    pageKey: 'gemstones',
    defaultSubSlug: 'recommendations',
    items: [
      item('gemstones', 'recommendations', 'Chart-Evaluated Gemstones', 'జాతక ఆధారిత రత్న పరిశీలన', 'रत्न विश्लेषण', 'recommendations', ['ratna', 'ruby', 'emerald', 'sapphire']),
      item('gemstones', 'wearing-protocol', '20-Point Wearing Protocol', '20-సూత్ర రత్న ధారణ విధానం', 'रत्न धारण विधि', 'protocol'),
    ],
  },
  {
    id: 'wf-20',
    code: '20',
    group: 'workflow',
    catSlug: 'japa',
    labelEn: 'Mantra Japa 108',
    labelTe: 'జపం 108',
    labelHi: 'मंत्र जप 108',
    icon: 'HeartPulse',
    pageKey: 'japa',
    defaultSubSlug: 'tracker',
    items: [
      item('japa', 'tracker', '108-Bead Interactive Mala', '108 పూసల మంత్ర జప ట్రాకర్', '108 माला जप', 'tracker', ['mantra', 'mala', 'bead']),
      item('japa', 'library', 'Authentic Navagraha & Vedic Mantras', 'నవగ్రహ & వేద మంత్ర కోశం', 'मंत्र संग्रह', 'library'),
      item('japa', 'logs', 'Practice History & Goals', 'జప సాధన చరిత్ర & లక్ష్యాలు', 'जप इतिहास', 'logs'),
    ],
  },
  {
    id: 'wf-21',
    code: '21',
    group: 'workflow',
    catSlug: 'verification',
    labelEn: 'Verification & Implementation Status',
    labelTe: 'ధ్రువీకరణ మరియు అమలు స్థితి',
    labelHi: 'सत्यापन और कार्यान्वयन स्थिति',
    icon: 'ShieldCheck',
    pageKey: 'verification',
    defaultSubSlug: 'status',
    items: [
      item('verification', 'status', 'Chart Accuracy & Implementation Status', 'చక్ర ఖచ్చితత్వం & పరిహార అమలు స్థితి', 'सत्यापन स्थिति', 'status', ['tracking', 'checklist', 'review']),
      item('verification', 'timeline', 'Milestone & Review Timeline', 'సమీక్ష తేదీలు & చరిత్ర', 'समयरेखा', 'timeline'),
    ],
  },

  // ================= WORKSPACE & ADDITIONAL JYOTISHA MODULES =================
  {
    id: 'ut-01',
    code: 'U1',
    group: 'utility',
    catSlug: 'dashboard',
    labelEn: 'Dashboard',
    labelTe: 'డాష్‌బోర్డ్',
    labelHi: 'डैशबोर्ड',
    icon: 'LayoutDashboard',
    pageKey: 'dashboard',
    defaultSubSlug: 'overview',
    items: [
      item('dashboard', 'overview', 'Overview', 'సారాంశం', 'सारांश', 'overview', ['home', 'summary']),
      item('dashboard', 'recent-charts', 'Recent Charts', 'ఇటీవలి చక్రాలు', 'हाल की कुंडलियाँ', 'recent-charts', ['charts']),
      item('dashboard', 'recent-reports', 'Recent Reports', 'ఇటీవలి నివేదికలు', 'हाल की रिपोर्ट', 'recent-reports', ['reports']),
      item('dashboard', 'saved-profiles', 'Saved Profiles', 'సేవ్ చేసిన జాతకాలు', 'सहेजे प्रोफ़ाइल', 'saved-profiles', ['profiles']),
      item('dashboard', 'upcoming-transits', 'Upcoming Transits', 'రాబోయే గోచారాలు', 'आगामी गोचर', 'upcoming-transits', ['gochara']),
      item('dashboard', 'daily-panchanga', 'Daily Panchanga', 'దిన పంచాంగం', 'दैनिक पंचांग', 'daily-panchanga'),
      item('dashboard', 'favorites', 'Favorites', 'ఇష్టమైనవి', 'पसंदीदा', 'favorites', ['bookmarks']),
    ],
  },
  {
    id: 'ut-02',
    code: 'U2',
    group: 'utility',
    catSlug: 'birth-profiles',
    labelEn: 'Birth Profiles',
    labelTe: 'జన్మ ప్రొఫైల్స్',
    labelHi: 'जन्म प्रोफ़ाइल',
    icon: 'Users',
    pageKey: 'profiles',
    defaultSubSlug: 'all-profiles',
    items: [
      item('birth-profiles', 'all-profiles', 'All Profiles', 'అన్ని ప్రొఫైల్స్', 'सभी प्रोफ़ाइल', 'all-profiles', ['list']),
      item('birth-profiles', 'add-profile', 'Add New Profile', 'కొత్త ప్రొఫైల్ చేర్చు', 'नया प्रोफ़ाइल जोड़ें', 'add-profile', ['create', 'new']),
      item('birth-profiles', 'profile-comparison', 'Profile Comparison', 'ప్రొఫైల్ పోలిక', 'प्रोफ़ाइल तुलना', 'profile-comparison', ['compare']),
      item('birth-profiles', 'archived-profiles', 'Archived Profiles', 'ఆర్కైవ్ ప్రొఫైల్స్', 'संग्रहीत प्रोफ़ाइल', 'archived-profiles'),
    ],
  },
  {
    id: 'ut-03',
    code: 'U3',
    group: 'utility',
    catSlug: 'planetary-strength',
    labelEn: 'Planetary Strength (Shadbala)',
    labelTe: 'షడ్బలం & వింశోపక',
    labelHi: 'षड्बल एवं भावबल',
    icon: 'BarChart3',
    pageKey: 'strength',
    defaultSubSlug: 'shadbala',
    items: [
      item('planetary-strength', 'shadbala', 'Shadbala', 'షడ్బలం', 'षड्बल', 'shadbala', ['virupa', 'rupa']),
      item('planetary-strength', 'bhava-bala', 'Bhava Bala', 'భావ బలం', 'भाव बल', 'bhava-bala'),
      item('planetary-strength', 'vimsopaka-bala', 'Vimsopaka Bala', 'వింశోపక బలం', 'विंशोपक बल', 'vimsopaka-bala'),
      item('planetary-strength', 'ishta-phala', 'Ishta & Kashta Phala', 'ఇష్ట & కష్ట ఫలం', 'इष्ट-कष्ट फल', 'ishta-phala'),
    ],
  },
  {
    id: 'ut-04',
    code: 'U4',
    group: 'utility',
    catSlug: 'yogas-doshas',
    labelEn: 'Yogas & Doshas',
    labelTe: 'యోగాలు & దోషాలు',
    labelHi: 'योग और दोष',
    icon: 'Sparkles',
    pageKey: 'yogas',
    defaultSubSlug: 'overview',
    items: [
      item('yogas-doshas', 'overview', 'Yoga & Dosha Overview', 'యోగ & దోష సారాంశం', 'योग सारांश', 'overview'),
      item('yogas-doshas', 'raja-yoga', 'Raja & Dhana Yogas', 'రాజ & ధన యోగాలు', 'राजयोग', 'raja'),
      item('yogas-doshas', 'kuja-dosha', 'Kuja / Kala Sarpa Dosha', 'కుజ / కాలసర్ప దోషం', 'मांगलिक दोष', 'kuja'),
      item('yogas-doshas', 'cancellations', 'Cancellation & Exceptions', 'దోష భంగ నియమాలు', 'दोष भंग नियम', 'cancellations'),
    ],
  },
  {
    id: 'ut-05',
    code: 'U5',
    group: 'utility',
    catSlug: 'nakshatra',
    labelEn: 'Nakshatra',
    labelTe: 'నక్షత్రాలు',
    labelHi: 'नक्षत्र',
    icon: 'Star',
    pageKey: 'nakshatra',
    defaultSubSlug: 'birth-nakshatra',
    items: [
      item('nakshatra', 'birth-nakshatra', 'Birth Nakshatra', 'జన్మ నక్షత్రం', 'जन्म नक्षत्र', 'birth'),
      item('nakshatra', '27-nakshatras', '27 Nakshatras', '27 నక్షత్రాల పట్టిక', '27 नक्षत्र', 'all27'),
      item('nakshatra', 'pada', 'Nakshatra Pada (108)', 'నక్షత్ర పాదాలు (108)', 'नक्षत्र पद', 'pada'),
      item('nakshatra', 'tara-bala', 'Tara & Chandra Bala', 'తారా & చంద్ర బలం', 'तारा बल', 'tara'),
    ],
  },
  {
    id: 'ut-06',
    code: 'U6',
    group: 'utility',
    catSlug: 'jaimini',
    labelEn: 'Jaimini Astrology',
    labelTe: 'జైమినీ జ్యోతిషం',
    labelHi: 'जैमिनी ज्योतिष',
    icon: 'Layers',
    pageKey: 'jaimini',
    defaultSubSlug: 'overview',
    items: [
      item('jaimini', 'overview', 'Jaimini Overview', 'జైమినీ సారాంశం', 'जैमिनी सारांश', 'overview'),
      item('jaimini', 'chara-karakas', 'Chara Karakas (7 / 8)', 'చర కారకులు', 'चर कारक', 'karakas'),
      item('jaimini', 'karakamsha', 'Karakamsha & Swamsha', 'కారకాంశ & స్వాంశ', 'कारकांश', 'karakamsha'),
      item('jaimini', 'arudha-lagna', 'Arudha Padas (AL, UL, A1–A12)', 'ఆరూఢ పదాలు', 'आरूढ़ पद', 'arudhas'),
      item('jaimini', 'argala', 'Argala & Virodha Argala', 'అర్గళ విశ్లేషణ', 'अर्गला', 'argala'),
      item('jaimini', 'chara-dasha', 'Chara & Narayana Dasha', 'చర & నారాయణ దశ', 'चर दशा', 'chara-dasha'),
    ],
  },
  {
    id: 'ut-07',
    code: 'U7',
    group: 'utility',
    catSlug: 'western',
    labelEn: 'Western Astrology',
    labelTe: 'పాశ్చాత్య జ్యోతిషం',
    labelHi: 'पाश्चात्य ज्योतिष',
    icon: 'Globe',
    pageKey: 'western',
    defaultSubSlug: 'natal-chart',
    items: [
      item('western', 'natal-chart', 'Western Natal Chart', 'సాయన జన్మ చక్రం', 'पाश्चात्य जन्म कुंडली', 'natal'),
      item('western', 'positions', 'Outer Planets & Cusps', 'బాహ్య గ్రహాలతో స్థితులు', 'ग्रह स्थिति', 'positions'),
      item('western', 'aspects', 'Planetary Aspects (0–180°)', 'పాశ్చాత్య దృష్టులు', 'दृष्टि विश्लेषण', 'aspects'),
      item('western', 'wheel', 'Birth Wheel', 'వృత్తాకార చక్రం', 'जन्म चक्र', 'wheel'),
    ],
  },
  {
    id: 'ut-08',
    code: 'U8',
    group: 'utility',
    catSlug: 'ai-astrologer',
    labelEn: 'AI Astrologer',
    labelTe: 'AI జ్యోతిష పండితుడు',
    labelHi: 'AI ज्योतिषी',
    icon: 'Bot',
    pageKey: 'ai',
    defaultSubSlug: 'chat',
    items: [
      item('ai-astrologer', 'chat', 'AI Chat', 'AI చాట్', 'AI चैट', 'chat'),
      item('ai-astrologer', 'chart-qa', 'Chart-based Questions', 'జాతక ఆధారిత ప్రశ్నలు', 'कुंडली प्रश्न', 'prompt-chart'),
      item('ai-astrologer', 'saved', 'Saved Conversations', 'సేవ్ చేసిన సంభాషణలు', 'सहेजी बातचीत', 'saved'),
    ],
  },
  {
    id: 'ut-09',
    code: 'U9',
    group: 'utility',
    catSlug: 'reports',
    labelEn: 'Professional Reports',
    labelTe: 'ప్రొఫెషనల్ నివేదికలు (3 స్థాయిలు)',
    labelHi: 'व्यावसायिक रिपोर्ट',
    icon: 'FileText',
    pageKey: 'reports',
    defaultSubSlug: 'dashboard',
    items: [
      item('reports', 'dashboard', 'Report Center (Quick / Detailed / Complete)', 'నివేదికల కేంద్రం', 'रिपोर्ट डैशबोर्ड', 'dashboard'),
      item('reports', 'complete-horoscope', 'Complete Horoscope', 'సంపూర్ణ జాతక నివేదిక', 'संपूर्ण कुंडली', 'type:complete-horoscope'),
      item('reports', 'parashari-reading', 'Parashari Report', 'పరాశరీ నివేదిక', 'पाराशरी रिपोर्ट', 'type:parashari-reading'),
      item('reports', 'kp-report', 'KP Report', 'KP నివేదిక', 'के.पी. रिपोर्ट', 'type:kp-report'),
      item('reports', 'jaimini-report', 'Jaimini Report', 'జైమినీ నివేదిక', 'जैमिनी रिपोर्ट', 'type:jaimini-report'),
      item('reports', 'marriage-report', 'Marriage & Compatibility Report', 'వివాహ & పొంతన నివేదిక', 'विवाह रिपोर्ट', 'type:marriage-report'),
      item('reports', 'saved-reports', 'Saved Reports', 'సేవ్ చేసిన నివేదికలు', 'सहेजी रिपोर्ट', 'saved'),
    ],
  },
  {
    id: 'ut-10',
    code: 'U10',
    group: 'utility',
    catSlug: 'knowledge',
    labelEn: 'Knowledge Library',
    labelTe: 'శాస్త్ర గ్రంథాలయం',
    labelHi: 'ज्ञान पुस्तकालय',
    icon: 'Library',
    pageKey: 'knowledge',
    defaultSubSlug: 'encyclopedia',
    items: [
      item('knowledge', 'encyclopedia', 'Jyotisha Encyclopedia', 'జ్యోతిష విజ్ఞాన కోశం', 'ज्योतिष विश्वकोश', 'all'),
      item('knowledge', 'classical', 'Classical Texts (BPHS / Jaimini)', 'ప్రాచీన జ్యోతిష గ్రంథాలు', 'शास्त्रीय ज्योतिष', 'cat:Classical Jyotisha'),
      item('knowledge', 'vedic', 'Vedas, Upanishads & Gita', 'వేద వాఙ్మయం', 'वैदिक ज्ञान', 'cat:వేదాలు'),
      item('knowledge', 'glossary', 'Sanskrit & Telugu Glossary', 'పారిభాషిక పదకోశం', 'शब्दावली', 'glossary'),
    ],
  },
  {
    id: 'ut-11',
    code: 'U11',
    group: 'utility',
    catSlug: 'settings',
    labelEn: 'Administration & Settings',
    labelTe: 'సెట్టింగ్స్ & అడ్మిన్',
    labelHi: 'प्रशासन और सेटिंग्स',
    icon: 'Settings',
    pageKey: 'admin',
    defaultSubSlug: 'preferences',
    items: [
      item('settings', 'preferences', 'Application Preferences', 'యాప్ ప్రాధాన్యతలు', 'ऐप प्राथमिकताएँ', 'preferences'),
      item('settings', 'calculation', 'Calculation Settings', 'గణిత నియమాలు', 'गणना सेटिंग्स', 'calculation'),
      item('settings', 'ai-config', 'AI Configuration', 'AI సేవ స్థితి', 'AI विन्यास', 'ai-config'),
      item('settings', 'data-management', 'Data Management', 'డేటా నిర్వహణ', 'डेटा प्रबंधन', 'data'),
      item('settings', 'admin-dashboard', 'Admin Dashboard', 'అడ్మిన్ డాష్‌బోర్డ్', 'एडमिन डैशबोर्ड', 'admin-dashboard'),
      item('settings', 'audit-logs', 'Audit & System Health', 'ఆడిట్ & సిస్టమ్ ఆరోగ్యం', 'ऑडिट लॉग', 'health'),
    ],
  },
];

export function navLabel(itemOrCat: { labelEn: string; labelTe: string; labelHi: string }, lang: Language): string {
  if (lang === 'te') return itemOrCat.labelTe;
  if (lang === 'hi') return itemOrCat.labelHi;
  return itemOrCat.labelEn;
}

export function resolveNavRoute(catSlug: string, subSlug?: string): { cat: NavCategory; sub: NavSubItem } {
  // Legacy slug backward-compatibility mappings
  let resolvedCatSlug = catSlug;
  let resolvedSubSlug = subSlug;

  if (catSlug === 'horoscope' && subSlug === 'planetary-relationships') {
    resolvedCatSlug = 'relationships';
    resolvedSubSlug = 'panchadha-maitri';
  } else if (catSlug === 'parashari' && (subSlug === 'graha-drishti' || subSlug === 'rashi-drishti')) {
    resolvedCatSlug = 'insights';
    resolvedSubSlug = subSlug;
  } else if (catSlug === 'parashari' && subSlug === 'yogakaraka') {
    resolvedCatSlug = 'analysis';
    resolvedSubSlug = 'twelve-bhavas';
  } else if (catSlug === 'remedies' && subSlug === 'gemstone') {
    resolvedCatSlug = 'gemstones';
    resolvedSubSlug = 'recommendations';
  }

  const cat = NAV_CATEGORIES.find((c) => c.catSlug === resolvedCatSlug) || NAV_CATEGORIES[0];
  const sub =
    (resolvedSubSlug ? cat.items.find((s) => s.subSlug === resolvedSubSlug) : undefined) ||
    cat.items.find((s) => s.subSlug === cat.defaultSubSlug) ||
    cat.items[0];
  return { cat, sub };
}
