import { GEMSTONE_MAP, LAL_KITAB_PAKKA, RUDRAKSHA_MAP } from './compatibilityNumerologyWestern.ts';
import { ORDER, PLANET_NAMES, SIGN_LORDS } from './constants.ts';
import type { DeepPlanetInsight } from './deepInsights.ts';
import { getFunctionalNature } from './parashari.ts';
import type { ShadbalaPlanet } from './strength.ts';
import type { ComputedChart, PlanetId } from './types.ts';

export type GemstoneVerdict =
  | 'Strongly Supportive'
  | 'Conditional (Trial Recommended)'
  | 'Not Recommended (Amplifies Dusthana/Maraka)';

export interface GemstoneRecommendation {
  planetId: PlanetId;
  verdict: GemstoneVerdict;
  verdictTe: string;
  gemNameEn: string;
  gemNameTe: string;
  substituteEn: string;
  substituteTe: string;
  rationaleTe: string;
  rationaleEn: string;
  isIllustrativeArtwork: true;
  palette: { primary: string; secondary: string; highlight: string; stroke: string };
  shape: 'oval' | 'emerald-cut' | 'cushion' | 'round';
  protocol: {
    caratRange: string;
    metal: string;
    finger: string;
    hand: string;
    weekday: string;
    muhurtaTiming: string;
    purificationSteps: string[];
    pranaPratishthaNote: string;
    mantraTe: string;
    mantraIast: string;
    trialProtocol: string;
    recheckPrecautions: string[];
  };
}

const GEM_ARTWORK_META: Record<
  number,
  {
    subEn: string;
    subTe: string;
    carat: string;
    hand: string;
    palette: { primary: string; secondary: string; highlight: string; stroke: string };
    shape: GemstoneRecommendation['shape'];
    mantraTe: string;
    mantraIast: string;
  }
> = {
  0: {
    subEn: 'Red Garnet / Sunstone',
    subTe: 'తామ్ర/సూర్యకాంత రాయి',
    carat: '3.25 – 5.25 Ratti (3–5 Carats)',
    hand: 'Right Hand (or Working Hand)',
    palette: { primary: '#b91c1c', secondary: '#ef4444', highlight: '#fecaca', stroke: '#7f1d1d' },
    shape: 'oval',
    mantraTe: 'ఓం హ్రాం హ్రీం హ్రౌం సః సూర్యాయ నమః',
    mantraIast: 'Om hram hrim hraum sah Suryaya namah',
  },
  1: {
    subEn: 'Moonstone / White Coral',
    subTe: 'చంద్రకాంత రాయి',
    carat: '4.25 – 6.25 Ratti (4–6 Carats)',
    hand: 'Right Hand',
    palette: { primary: '#e2e8f0', secondary: '#cbd5e1', highlight: '#ffffff', stroke: '#94a3b8' },
    shape: 'round',
    mantraTe: 'ఓం శ్రాం శ్రీం శ్రౌం సః చంద్రమసే నమః',
    mantraIast: 'Om sram srim sraum sah Chandramase namah',
  },
  2: {
    subEn: 'Carnelian / Red Jasper',
    subTe: 'కార్నేలియన్ / ఎర్ర హకీక్',
    carat: '5.25 – 7.25 Ratti (5–7 Carats)',
    hand: 'Right Hand',
    palette: { primary: '#dc2626', secondary: '#ea580c', highlight: '#fed7aa', stroke: '#9a3412' },
    shape: 'oval',
    mantraTe: 'ఓం క్రాం క్రీం క్రౌం సః భౌమాయ నమః',
    mantraIast: 'Om kram krim kraum sah Bhaumaya namah',
  },
  6: {
    subEn: 'Peridot / Green Tourmaline',
    subTe: 'పెరిడాట్ / ఆకుపచ్చ ఒనిక్స్',
    carat: '3.25 – 5.25 Ratti (3–5 Carats)',
    hand: 'Right Hand',
    palette: { primary: '#047857', secondary: '#10b981', highlight: '#a7f3d0', stroke: '#064e3b' },
    shape: 'emerald-cut',
    mantraTe: 'ఓం బ్రాం బ్రీం బ్రౌం సః బుధాయ నమః',
    mantraIast: 'Om bram brim braum sah Budhaya namah',
  },
  4: {
    subEn: 'Yellow Citrine / Topaz',
    subTe: 'సునేలా / పసుపు టోపాజ్',
    carat: '4.25 – 6.25 Ratti (4–6 Carats)',
    hand: 'Right Hand',
    palette: { primary: '#d97706', secondary: '#f59e0b', highlight: '#fef3c7', stroke: '#92400e' },
    shape: 'cushion',
    mantraTe: 'ఓం గ్రాం గ్రీం గ్రౌం సః గురవే నమః',
    mantraIast: 'Om gram grim graum sah Gurave namah',
  },
  8: {
    subEn: 'Zircon / White Topaz',
    subTe: 'జెర్కాన్ / స్పటికం',
    carat: '1.00 – 2.50 Carats (Topaz 5 Ratti)',
    hand: 'Right Hand',
    palette: { primary: '#f8fafc', secondary: '#bae6fd', highlight: '#ffffff', stroke: '#64748b' },
    shape: 'round',
    mantraTe: 'ఓం ద్రాం ద్రీం ద్రౌం సః శుక్రాయ నమః',
    mantraIast: 'Om dram drim draum sah Shukraya namah',
  },
  5: {
    subEn: 'Amethyst / Lapis Lazuli',
    subTe: 'జమునియా (కటేలా) / నీలి లాపిస్',
    carat: '3.25 – 5.25 Ratti (3–5 Carats)',
    hand: 'Right Hand',
    palette: { primary: '#1d4ed8', secondary: '#3b82f6', highlight: '#bfdbfe', stroke: '#1e3a8a' },
    shape: 'cushion',
    mantraTe: 'ఓం ప్రాం ప్రీం ప్రౌం సః శనైశ్చరాయ నమః',
    mantraIast: 'Om pram prim praum sah Shanaishcharaya namah',
  },
  3: {
    subEn: 'Spessartite / Orange Zircon',
    subTe: 'స్పెసర్టైట్ గార్నెట్',
    carat: '4.25 – 6.25 Ratti (4–6 Carats)',
    hand: 'Right Hand',
    palette: { primary: '#92400e', secondary: '#d97706', highlight: '#fde68a', stroke: '#78350f' },
    shape: 'oval',
    mantraTe: 'ఓం భ్రాం భ్రీం భ్రౌం సః రాహవే నమః',
    mantraIast: 'Om bhram bhrim bhraum sah Rahave namah',
  },
  7: {
    subEn: "Tiger's Eye / Chrysoberyl",
    subTe: 'టైగర్స్ ఐ',
    carat: '4.25 – 6.25 Ratti (4–6 Carats)',
    hand: 'Right Hand',
    palette: { primary: '#a16207', secondary: '#eab308', highlight: '#fef9c3', stroke: '#713f12' },
    shape: 'oval',
    mantraTe: 'ఓం స్రాం స్రీం స్రౌం సః కేతవే నమః',
    mantraIast: 'Om sram srim sraum sah Ketave namah',
  },
};

export function evaluateGemstoneRecommendations(
  chart: ComputedChart,
  shadbala: ShadbalaPlanet[],
): GemstoneRecommendation[] {
  const fn = getFunctionalNature(chart.lagS);
  const lagLord = SIGN_LORDS[chart.lagS];
  const fifthLord = SIGN_LORDS[(chart.lagS + 4) % 12];
  const ninthLord = SIGN_LORDS[(chart.lagS + 8) % 12];

  const order: PlanetId[] = [lagLord, fifthLord, ninthLord, 0, 1, 2, 6, 4, 8, 5, 3, 7].filter(
    (v, i, arr) => arr.indexOf(v) === i,
  ) as PlanetId[];

  return order.map((id) => {
    const info = fn.byPlanet[id];
    const row = chart.rows.find((r) => r.id === id)!;
    const sb = shadbala.find((s) => s.id === id);
    const meta = GEMSTONE_MAP[id];
    const art = GEM_ARTWORK_META[id];
    const isTrikona = id === lagLord || id === fifthLord || id === ninthLord;
    const isDusthanaOnly =
      info && info.houses.length > 0 && info.houses.every((h) => [6, 8, 12].includes(h)) && !isTrikona;
    const isMarakaOrBadhaka = info?.role === 'Maraka' || info?.badhaka;

    let verdict: GemstoneVerdict = 'Conditional (Trial Recommended)';
    let verdictTe = 'పరిశీలించి / ట్రయల్ తర్వాత ధారణ';
    let rationaleTe = '';
    let rationaleEn = '';

    if (isTrikona && !info?.badhaka && (info?.role === 'Yogakaraka' || info?.role === 'Benefic' || id === lagLord)) {
      verdict = 'Strongly Supportive';
      verdictTe = 'అత్యంత అనుకూలం (శుభ త్రికోణ/లగ్నాధిపతి)';
      rationaleTe = `${PLANET_NAMES.te[id]} లగ్న/త్రికోణాధిపతిగా (${info?.houses.map((h) => `H${h}`).join(', ')}) శుభకారకుడు; ప్రస్తుత స్థితి H${row.house}${sb ? ` (${sb.ratioPct.toFixed(0)}% షడ్బలం)` : ''}.`;
      rationaleEn = `${PLANET_NAMES.en[id]} rules Lagna/Trikona (${info?.houses.map((h) => `H${h}`).join(', ')}) and supports chart vitality (currently H${row.house}).`;
    } else if (id === 3 || id === 7 || isDusthanaOnly || isMarakaOrBadhaka) {
      verdict = 'Not Recommended (Amplifies Dusthana/Maraka)';
      verdictTe = 'సూచించబడదు (దుస్థాన/మారక/ఛాయా గ్రహ బలవృద్ధి)';
      rationaleTe =
        id === 3 || id === 7
          ? `${PLANET_NAMES.te[id]} ఛాయా గ్రహం అయినందున నేరుగా రత్నధారణ కంటే మంత్ర–దాన శాంతులు శ్రేయస్కరం.`
          : `${PLANET_NAMES.te[id]} ${info?.badhaka ? 'బాధక' : 'దుస్థాన/మారక'} స్థానాలను సూచిస్తున్నందున రత్న బలవృద్ధి అనుకూలం కాదు.`;
      rationaleEn =
        id === 3 || id === 7
          ? `${PLANET_NAMES.en[id]} is a shadow node; mantra and charitable upayas are preferred over gemstone amplification.`
          : `${PLANET_NAMES.en[id]} governs Dusthana/Maraka/Badhaka roles (${info?.houses.join(', ')}); boosting it with a gemstone is not advised.`;
    } else {
      rationaleTe = `${PLANET_NAMES.te[id]} మిశ్రమ కారకత్వం కలిగి ఉన్నందున, శుభ దశా కాలంలో మాత్రమే 7 రోజుల ట్రయల్ తర్వాత ధరించవచ్చు.`;
      rationaleEn = `${PLANET_NAMES.en[id]} holds mixed lordships (${info?.houses.join(', ') || `H${row.house}`}); test via 7-day cloth-wrapped trial during its active Dasha.`;
    }

    return {
      planetId: id,
      verdict,
      verdictTe,
      gemNameEn: meta.gem,
      gemNameTe: meta.gemTe,
      substituteEn: art.subEn,
      substituteTe: art.subTe,
      rationaleTe,
      rationaleEn,
      isIllustrativeArtwork: true,
      palette: art.palette,
      shape: art.shape,
      protocol: {
        caratRange: art.carat,
        metal: meta.metal,
        finger: meta.finger,
        hand: art.hand,
        weekday: `${meta.day} (Shukla Paksha)`,
        muhurtaTiming: 'First Hora after Sunrise in Shukla Paksha when Moon is strong',
        purificationSteps: [
          'Soak ring overnight or 15 mins in clean raw cow milk / Ganga jal / pure water.',
          'Rinse gently with clean potable water and wipe dry with a fresh cloth.',
          'Offer incense, flowers, and recite 108 times (1 mala) before wearing.',
        ],
        pranaPratishthaNote: 'Traditional Sankalpa & 1-mala Mantra energization facing East/North.',
        mantraTe: art.mantraTe,
        mantraIast: art.mantraIast,
        trialProtocol:
          id === 5 || id === 3 || id === 7
            ? 'Mandatory 7-day pocket/cloth trial before setting into permanent jewelry; remove if sleep or mood disturbs.'
            : 'Optional 3–7 day trial in yellow/white cloth before permanent ring setting.',
        recheckPrecautions: [
          'Remove during severe illness discomfort if sensitivity occurs.',
          'Avoid wearing cracked, dyed, or heavily heated synthetic stones for Vedic use.',
          'Periodic inspection every 6–12 months for cleanliness and mounting security.',
        ],
      },
    };
  });
}

export interface ChartRemedyItem {
  id: string;
  planetId: PlanetId;
  tradition: 'Vedic / Classical' | 'Lal Kitab';
  category: 'Mantra & Stotra' | 'Daan (Charity)' | 'Vrata & Puja' | 'Rudraksha & Vastu' | 'Lal Kitab Upaya';
  titleTe: string;
  titleEn: string;
  evidenceTe: string;
  evidenceEn: string;
  materialsTe: string;
  materialsEn: string;
  frequencyTe: string;
  frequencyEn: string;
  durationTe: string;
  durationEn: string;
  precautionsTe: string;
  precautionsEn: string;
  attribution: string;
  priority: 'High' | 'Supportive';
}

export function evaluateChartRemedies(
  chart: ComputedChart,
  shadbala: ShadbalaPlanet[],
  insights: DeepPlanetInsight[],
): ChartRemedyItem[] {
  const out: ChartRemedyItem[] = [];

  for (const ins of insights) {
    const isNeeded =
      ins.verdictCategory === 'Weak / Struggling' ||
      ins.verdictCategory === 'Significant Affliction / Needs Care' ||
      ins.verdictCategory === 'Afflicted but Mitigated';
    const sb = shadbala.find((s) => s.id === ins.id);
    const priority: ChartRemedyItem['priority'] =
      ins.verdictCategory === 'Significant Affliction / Needs Care' || ins.verdictCategory === 'Weak / Struggling'
        ? 'High'
        : 'Supportive';

    if (!isNeeded && (sb ? sb.ratioPct >= 100 : true)) continue;

    const rud = RUDRAKSHA_MAP[ins.id];
    const lk = LAL_KITAB_PAKKA[ins.id];

    out.push({
      id: `vedic-mantra-${ins.id}`,
      planetId: ins.id,
      tradition: 'Vedic / Classical',
      category: 'Mantra & Stotra',
      titleTe: `${PLANET_NAMES.te[ins.id]} శాంతి మంత్ర జపం (108 మాల)`,
      titleEn: `${PLANET_NAMES.en[ins.id]} Navagraha Mantra Japa`,
      evidenceTe: `${ins.verdictCategoryTe}${sb ? ` · షడ్బలం ${sb.ratioPct.toFixed(0)}%` : ''}`,
      evidenceEn: `${ins.verdictCategory}${sb ? ` · Shadbala ${sb.ratioPct.toFixed(0)}%` : ''}`,
      materialsTe: 'తులసి / రుద్రాక్ష మాల (108 పూసలు), స్వచ్ఛమైన ఆసనం',
      materialsEn: 'Rudraksha or Tulasi 108-bead mala, quiet clean mat',
      frequencyTe: 'ప్రతిరోజూ 1 మాల (108 సార్లు) లేదా వారంలో సంబంధిత రోజున',
      frequencyEn: '1 mala (108 counts) daily or on planet weekday morning',
      durationTe: '40 రోజుల మండల దీక్ష లేదా సంబంధిత దశా/అంతర్దశ కాలం',
      durationEn: '40-day Mandala cycle or active Dasha/Antardasha',
      precautionsTe: 'శుచి శుభ్రతతో ప్రశాంత మనస్సుతో పఠించాలి; భయంతో కాదు.',
      precautionsEn: 'Chant calmly with sincerity; never treat remedies as fear-driven compulsion.',
      attribution: 'Brihat Parashara Hora Shastra / Navagraha Stotra Tradition',
      priority,
    });

    out.push({
      id: `vedic-rudra-${ins.id}`,
      planetId: ins.id,
      tradition: 'Vedic / Classical',
      category: 'Rudraksha & Vastu',
      titleTe: `${rud.mukhi}-ముఖి రుద్రాక్ష & ${rud.deity} ఆరాధన`,
      titleEn: `${rud.mukhi}-Mukhi Rudraksha & ${rud.deity} Worship`,
      evidenceTe: `${PLANET_NAMES.te[ins.id]} ధారణ–ధ్యాన సమతుల్యత`,
      evidenceEn: `Balancing ${PLANET_NAMES.en[ins.id]} through classical Rudraksha tradition`,
      materialsTe: `సహజమైన ${rud.mukhi}-ముఖి రుద్రాక్ష (ఎర్ర దారం లేదా వెండిలో)`,
      materialsEn: `Natural ${rud.mukhi}-Mukhi Rudraksha bead on red silk or silver`,
      frequencyTe: `ధరించేటప్పుడు 108 సార్లు "${rud.mantra}" జపం`,
      frequencyEn: `Chant "${rud.mantra}" 108 times while wearing`,
      durationTe: 'నిరంతరం లేదా దశా కాలంలో',
      durationEn: 'Ongoing or during ruling Dasha',
      precautionsTe: 'రాత్రి నిద్రకు ముందు మరియు స్నాన సమయాల్లో శుభ్రంగా భద్రపరచవచ్చు.',
      precautionsEn: 'Keep clean; remove before bathing if using silk thread.',
      attribution: 'Shiva Purana / Padma Purana Rudraksha Tradition',
      priority: 'Supportive',
    });

    if (lk) {
      out.push({
        id: `lalkitab-${ins.id}`,
        planetId: ins.id,
        tradition: 'Lal Kitab',
        category: 'Lal Kitab Upaya',
        titleTe: `లాల్ కితాబ్ సూచన — ${PLANET_NAMES.te[ins.id]} (పక్కా భావం ${lk.pakkaHouses.join('/')})`,
        titleEn: `Lal Kitab Upaya — ${PLANET_NAMES.en[ins.id]} (Pakka H${lk.pakkaHouses.join('/')})`,
        evidenceTe: `${PLANET_NAMES.te[ins.id]} H${ins.house} స్థితికి ప్రత్యామ్నాయ సేవా పరిహారం`,
        evidenceEn: `Symbolic behavioral charity for ${PLANET_NAMES.en[ins.id]} in H${ins.house}`,
        materialsTe: lk.remedyTe,
        materialsEn: lk.remedyEn,
        frequencyTe: 'వారంలో ఒకసారి సూర్యోదయ తర్వాత',
        frequencyEn: 'Once weekly during daytime hours',
        durationTe: '43 రోజులు (లాల్ కితాబ్ సంప్రదాయ కాలం)',
        durationEn: '43 consecutive days / weekly cycle (traditional Lal Kitab norm)',
        precautionsTe: 'సూర్యాస్తమయం తర్వాత లేదా బలవంతంగా కాకుండా స్వచ్ఛంద సేవగా చేయాలి.',
        precautionsEn: 'Performed voluntarily in daylight hours as charitable service.',
        attribution: 'Traditional Lal Kitab (Distinct Folk-Remedial Tradition, Separated from Parashari)',
        priority,
      });
    }
  }

  // Always add baseline Satvik Daan if chart is very clean
  if (out.length === 0) {
    for (const id of ORDER.slice(0, 2)) {
      const lk = LAL_KITAB_PAKKA[id];
      out.push({
        id: `baseline-${id}`,
        planetId: id,
        tradition: 'Vedic / Classical',
        category: 'Vrata & Puja',
        titleTe: `${PLANET_NAMES.te[id]} అనుకూలత పెంపు — సంధ్యా ప్రార్థన`,
        titleEn: `${PLANET_NAMES.en[id]} Harmony & Gratitude Practice`,
        evidenceTe: 'చార్ట్ సుస్థిరంగా ఉంది — నిత్య ధర్మాచరణ శుభకరం',
        evidenceEn: 'Chart strength is solid — gentle daily alignment recommended',
        materialsTe: lk.remedyTe,
        materialsEn: lk.remedyEn,
        frequencyTe: 'వారానికి ఒకసారి',
        frequencyEn: 'Weekly',
        durationTe: 'నిరంతర శుభ ఆచారం',
        durationEn: 'Ongoing gentle practice',
        precautionsTe: 'నిత్యజీవితంలో సద్గుణాల పెంపే అత్యుత్తమ పరిహారం.',
        precautionsEn: 'Ethical conduct and compassion remain the highest classical remedy.',
        attribution: 'Brihat Parashara Hora Shastra',
        priority: 'Supportive',
      });
    }
  }

  return out;
}
