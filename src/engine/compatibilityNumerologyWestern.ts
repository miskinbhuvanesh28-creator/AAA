import { NAK_NAMES, PLANET_NAMES, SIGN_LORDS, SIGN_NAMES } from './constants.ts';
import { CU, N, P, signedDiff } from './ephemeris.ts';
import type { ComputedChart, PlanetId } from './types.ts';

const mod = (x: number, n: number) => ((x % n) + n) % n;

// ---- Ashtakoota 36-Guna Matchmaking ----
const YONI_MATRIX = [
  [4,2,3,2,2,3,3,3,0,1,3,2,2,1],[2,4,3,2,2,3,3,3,3,2,2,2,2,0],[3,3,4,3,2,3,1,3,3,1,3,0,3,1],[2,2,3,4,2,2,1,1,2,2,2,2,0,2],
  [2,2,2,2,4,1,1,2,2,1,0,2,2,1],[2,2,3,2,1,4,0,2,2,1,2,2,2,2],[2,2,2,1,1,0,4,2,2,2,2,2,2,1],[3,2,3,1,2,2,2,4,3,0,3,2,3,1],
  [0,3,3,2,2,2,2,3,4,1,2,2,2,3],[1,2,1,2,1,1,2,0,1,4,2,1,2,2],[3,2,3,2,0,2,2,3,2,1,4,2,2,2],[2,3,0,2,2,2,2,2,2,1,2,4,2,3],
  [2,2,3,0,2,2,2,3,2,2,2,2,4,2],[1,0,1,2,1,2,1,1,3,2,2,2,2,4],
];
const YMAP = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
const GANA = [0,2,2,1,0,1,0,0,2,2,2,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
const NADI = [0,2,1,2,1,0,0,1,2,0,1,2,0,1,2,2,1,0,0,1,2,2,2,0,1,1,2];
const SIGN_VARNA = [1,2,3,0,1,2,3,0,1,2,3,0];
const VASH = [1,1,0,2,1,0,0,3,0,1,2,2];
const VASH_M = [[2,0.5,0.5,1],[0.5,2,2,2],[0.5,2,2,2],[1,2,2,2]];
const GM = [[5,5,5,4,5,0,0],[5,5,4,1,4,0.5,0.5],[5,4,5,0.5,5,3,0.5],[4,1,0.5,5,0.5,5,4],[5,4,5,0.5,5,0.5,3],[0,0.5,3,5,0.5,5,5],[0,0.5,0.5,4,3,5,5]];
const GINDEX: Record<number, number> = { 0: 0, 1: 1, 2: 2, 6: 3, 4: 4, 8: 5, 5: 6 };
const GANA_M = [[6, 5, 1], [6, 6, 0], [0, 0, 6]];

// Rajju classifications per nakshatra: 0=Pada, 1=Kati, 2=Nabhi, 3=Kantha, 4=Siro
const RAJJU = [0,1,2,3,4,3,2,1,0, 0,1,2,3,4,3,2,1,0, 0,1,2,3,4,3,2,1,0];
const RAJJU_NAMES = ['Pada (Foot)', 'Kati (Waist)', 'Nabhi (Navel)', 'Kantha (Neck)', 'Siro (Head)'];
const RAJJU_NAMES_TE = ['పాద రజ్జు', 'కటి రజ్జు', 'నాభి రజ్జు', 'కంఠ రజ్జు', 'శిరో రజ్జు'];

// Vedha pairs (mutually incompatible nakshatras)
const VEDHA_PAIRS: [number, number][] = [
  [0,17],[1,16],[2,15],[3,14],[5,21],[6,20],[7,19],[8,18],[9,26],[10,25],[11,24],[12,23],[4,13],[4,22],[13,22],
];

export function computeAshtakoota(brideNk: number, bridePada: number, groomNk: number, groomPada: number) {
  const bs = Math.floor(((groomNk * 4 + groomPada - 1) * 10) / 3 / 30);
  const gs = Math.floor(((brideNk * 4 + bridePada - 1) * 10) / 3 / 30);
  const varna = SIGN_VARNA[bs] >= SIGN_VARNA[gs] ? 1 : 0;
  const vashya = VASH_M[VASH[bs]][VASH[gs]];
  const t1 = mod(brideNk - groomNk, 27) + 1;
  const t2 = mod(groomNk - brideNk, 27) + 1;
  const tar1 = mod(t1 - 1, 9) + 1;
  const tar2 = mod(t2 - 1, 9) + 1;
  const goodTara = (x: number) => ![3, 5, 7].includes(x);
  const tara = goodTara(tar1) && goodTara(tar2) ? 3 : goodTara(tar1) || goodTara(tar2) ? 1.5 : 0;
  const yoni = YONI_MATRIX[YMAP[groomNk]][YMAP[brideNk]];
  const gl1 = GINDEX[SIGN_LORDS[bs]];
  const gl2 = GINDEX[SIGN_LORDS[gs]];
  const maitri = GM[gl1][gl2];
  const gana = GANA_M[GANA[groomNk]][GANA[brideNk]];
  const dist = mod(gs - bs, 12) + 1;
  const bhakootBad = [2, 12, 5, 9, 6, 8].includes(dist);
  const bhakoot = bhakootBad ? 0 : 7;
  const nadiBad = NADI[groomNk] === NADI[brideNk];
  const nadi = nadiBad ? 0 : 8;

  const exceptions: string[] = [];
  const exceptionsTe: string[] = [];
  if (bhakootBad && (gl1 === gl2 || maitri >= 4)) {
    exceptions.push('Bhakoot cancellation: Moon sign lords are same or mutual friends');
    exceptionsTe.push('భకూట దోష పరిహారం: ఇరువురి రాశ్యాధిపతులు ఒక్కరే లేదా పరస్పర మిత్రులు');
  }
  if (groomNk === brideNk && bs !== gs) {
    exceptions.push('Same Nakshatra in different signs — traditional Nadi/Gana exception in classical texts');
    exceptionsTe.push('ఒకే నక్షత్రం కానీ వేరువేరు రాశులు — శాస్త్రోక్త నాడీ/గణ దోష మినహాయింపు');
  }
  if (bs === gs && groomNk !== brideNk) {
    exceptions.push('Same Moon sign with different Nakshatras — partial Nadi/Gana mitigation');
    exceptionsTe.push('ఒకే చంద్ర రాశి, వేరువేరు నక్షత్రాలు — పాక్షిక నాడీ/గణ శాంతి');
  }
  if (groomNk === brideNk && bs === gs && groomPada !== bridePada) {
    exceptions.push('Same star & sign with distinct Padas — check Shastras before rejecting');
    exceptionsTe.push('ఒకే రాశి–నక్షత్రం కానీ వేరువేరు పాదాలు — శాస్త్ర పట్టిక ప్రకారం పరిశీలించాలి');
  }

  const items = [
    { name: 'Varna (వర్ణ)', nameTe: 'వర్ణ కూటం', max: 1, score: varna, note: 'Temperamental & spiritual ego alignment', noteTe: 'స్వభావ మరియు ఆధ్యాత్మిక సమన్వయం' },
    { name: 'Vashya (వశ్య)', nameTe: 'వశ్య కూటం', max: 2, score: vashya, note: 'Mutual attraction & adaptability', noteTe: 'పరస్పర ఆకర్షణ మరియు అనుకూలత' },
    { name: 'Tara (తారా)', nameTe: 'తారా కూటం', max: 3, score: tara, note: 'Longevity, luck & star harmony', noteTe: 'ఆయురారోగ్యం, భాగ్యం మరియు నక్షత్ర బలం' },
    { name: 'Yoni (యోని)', nameTe: 'యోని కూటం', max: 4, score: yoni, note: 'Instinctual & physical compatibility', noteTe: 'సహజ ప్రవృత్తి మరియు దాంపత్య పొంతన' },
    { name: 'Graha Maitri (గ్రహ మైత్రి)', nameTe: 'గ్రహ మైత్రి', max: 5, score: maitri, note: 'Mental & intellectual rapport of Rashi lords', noteTe: 'రాశ్యాధిపతుల మానసిక స్నేహ సంబంధం' },
    { name: 'Gana (గణ)', nameTe: 'గణ కూటం', max: 6, score: gana, note: 'Deva / Manushya / Rakshasa nature', noteTe: 'దేవ / మనుష్య / రాక్షస గణ సామరస్యం' },
    { name: 'Bhakoot (భకూట)', nameTe: 'భకూట కూటం', max: 7, score: bhakoot, note: `Emotional & family prosperity (Rashi rel: ${dist}/${14 - dist})`, noteTe: `కుటుంబ సౌఖ్యం & సంపద (రాశి దూరం: ${dist}/${14 - dist})` },
    { name: 'Nadi (నాడి)', nameTe: 'నాడీ కూటం', max: 8, score: nadi, note: 'Health, progeny & genetic vitality', noteTe: 'ఆరోగ్యం, సంతానం & వంశాభివృద్ధి' },
  ];

  // Dashakoota (South Indian 10 Poruthams)
  const dinaOk = tara > 0;
  const ganaOk = gana >= 5;
  const mahendraDist = mod(groomNk - brideNk, 27) + 1;
  const mahendraOk = [4, 7, 10, 13, 16, 19, 22, 25].includes(mahendraDist);
  const streeDeerghaOk = mahendraDist > 13;
  const yoniOk = yoni >= 2;
  const rashiOk = !bhakootBad;
  const rashyadhipatiOk = maitri >= 4;
  const vasyaOk = vashya >= 1;
  const rajjuMatch = RAJJU[brideNk] !== RAJJU[groomNk];
  const vedhaConflict = VEDHA_PAIRS.some(([a, b]) => (a === brideNk && b === groomNk) || (b === brideNk && a === groomNk));

  const dashakoota = [
    { name: 'Dina Porutham', nameTe: 'దిన పొంతన', ok: dinaOk, note: 'Daily health & well-being', noteTe: 'నిత్య ఆరోగ్యం & శుభం' },
    { name: 'Gana Porutham', nameTe: 'గణ పొంతన', ok: ganaOk, note: 'Temperamental harmony', noteTe: 'గుణగణ సామరస్యం' },
    { name: 'Mahendra Porutham', nameTe: 'మహేంద్ర పొంతన', ok: mahendraOk, note: `Distance ${mahendraDist} stars`, noteTe: `${mahendraDist} నక్షత్రాల దూరం` },
    { name: 'Stree Deergha', nameTe: 'స్త్రీ దీర్ఘ పొంతన', ok: streeDeerghaOk, note: 'Overall prosperity & longevity', noteTe: 'సౌభాగ్యం & దీర్ఘకాల ఐక్యత' },
    { name: 'Yoni Porutham', nameTe: 'యోని పొంతన', ok: yoniOk, note: `Score ${yoni}/4`, noteTe: `స్కోరు ${yoni}/4` },
    { name: 'Rashi Porutham', nameTe: 'రాశి పొంతన', ok: rashiOk, note: 'Moon sign harmony', noteTe: 'చంద్ర రాశి అనుకూలత' },
    { name: 'Rashyadhipati', nameTe: 'రాశ్యాధిపతి పొంతన', ok: rashyadhipatiOk, note: `Maitri ${maitri}/5`, noteTe: `మైత్రి ${maitri}/5` },
    { name: 'Vasya Porutham', nameTe: 'వశ్య పొంతన', ok: vasyaOk, note: `Score ${vashya}/2`, noteTe: `స్కోరు ${vashya}/2` },
    { name: 'Rajju Porutham', nameTe: 'రజ్జు పొంతన', ok: rajjuMatch, note: rajjuMatch ? 'No Rajju Dosha' : `Same Rajju: ${RAJJU_NAMES[RAJJU[brideNk]]}`, noteTe: rajjuMatch ? 'రజ్జు దోషం లేదు' : `సమాన రజ్జు: ${RAJJU_NAMES_TE[RAJJU[brideNk]]}` },
    { name: 'Vedha Porutham', nameTe: 'వేధ పొంతన', ok: !vedhaConflict, note: vedhaConflict ? 'Vedha Dosha present' : 'No Vedha Dosha', noteTe: vedhaConflict ? 'వేధ దోషం ఉంది' : 'వేధ దోషం లేదు' },
  ];

  return {
    total: items.reduce((a, x) => a + x.score, 0),
    items,
    bhakootBad,
    nadiBad,
    exceptions,
    exceptionsTe,
    dashakoota,
    dashakootaCount: dashakoota.filter((d) => d.ok).length,
  };
}

export function compareHoroscopes(groomChart: ComputedChart, brideChart: ComputedChart) {
  const gMo = groomChart.rows.find((r) => r.id === 1)!;
  const bMo = brideChart.rows.find((r) => r.id === 1)!;
  const koota = computeAshtakoota(bMo.nk, bMo.pada, gMo.nk, gMo.pada);

  const kujaCheck = (c: ComputedChart) => {
    const m = c.s[2];
    const hL = ((m - c.lagS + 12) % 12) + 1;
    const hM = ((m - c.s[1] + 12) % 12) + 1;
    const hV = ((m - c.s[8] + 12) % 12) + 1;
    const bad = new Set([1, 2, 4, 7, 8, 12]);
    return { fromLagna: hL, fromMoon: hM, fromVenus: hV, count: [hL, hM, hV].filter((h) => bad.has(h)).length };
  };

  const g7Lord = SIGN_LORDS[(groomChart.lagS + 6) % 12];
  const b7Lord = SIGN_LORDS[(brideChart.lagS + 6) % 12];
  const g7Row = groomChart.rows.find((r) => r.id === g7Lord)!;
  const b7Row = brideChart.rows.find((r) => r.id === b7Lord)!;
  const gVe = groomChart.rows.find((r) => r.id === 8)!;
  const bVe = brideChart.rows.find((r) => r.id === 8)!;
  const gJu = groomChart.rows.find((r) => r.id === 4)!;
  const bJu = brideChart.rows.find((r) => r.id === 4)!;

  const d9Harmony =
    gMo.d9 === bMo.d9 ||
    [0, 4, 6, 8].includes(((bMo.d9 - gMo.d9 + 12) % 12));

  return {
    koota,
    groomKuja: kujaCheck(groomChart),
    brideKuja: kujaCheck(brideChart),
    groomLagna: SIGN_NAMES.en[groomChart.lagS],
    groomLagnaTe: SIGN_NAMES.te[groomChart.lagS],
    brideLagna: SIGN_NAMES.en[brideChart.lagS],
    brideLagnaTe: SIGN_NAMES.te[brideChart.lagS],
    groomMoon: `${SIGN_NAMES.en[gMo.sign]} (${NAK_NAMES.en[gMo.nk]} P${gMo.pada})`,
    groomMoonTe: `${SIGN_NAMES.te[gMo.sign]} (${NAK_NAMES.te[gMo.nk]} పాదం ${gMo.pada})`,
    brideMoon: `${SIGN_NAMES.en[bMo.sign]} (${NAK_NAMES.en[bMo.nk]} P${bMo.pada})`,
    brideMoonTe: `${SIGN_NAMES.te[bMo.sign]} (${NAK_NAMES.te[bMo.nk]} పాదం ${bMo.pada})`,
    groom7thLord: PLANET_NAMES.en[g7Lord],
    groom7thLordTe: PLANET_NAMES.te[g7Lord],
    bride7thLord: PLANET_NAMES.en[b7Lord],
    bride7thLordTe: PLANET_NAMES.te[b7Lord],
    extendedChecks: {
      d9Harmony,
      d9NoteTe: d9Harmony ? 'D9 నవాంశ చంద్రుల మధ్య 1/5/7/9 శుభ సమన్వయం' : 'D9 నవాంశ స్థానం పరస్పరం భిన్నంగా ఉంది (సూక్ష్మ పరిశీలన అవసరం)',
      d9NoteEn: d9Harmony ? 'D9 Navamsha Moons align constructively (1/5/7/9)' : 'D9 Navamsha Moons are in non-trine/oppositional relationship',
      groom7thStrengthTe: `7వ అధిపతి ${PLANET_NAMES.te[g7Lord]} H${g7Row.house} (${g7Row.dig}) · శుక్రుడు H${gVe.house} (${gVe.dig}) · గురు H${gJu.house}`,
      bride7thStrengthTe: `7వ అధిపతి ${PLANET_NAMES.te[b7Lord]} H${b7Row.house} (${b7Row.dig}) · శుక్రుడు H${bVe.house} (${bVe.dig}) · గురు H${bJu.house}`,
      groom7thStrengthEn: `7th Lord ${PLANET_NAMES.en[g7Lord]} in H${g7Row.house} (${g7Row.digKey}) · Venus H${gVe.house} · Jupiter H${gJu.house}`,
      bride7thStrengthEn: `7th Lord ${PLANET_NAMES.en[b7Lord]} in H${b7Row.house} (${b7Row.digKey}) · Venus H${bVe.house} · Jupiter H${bJu.house}`,
    },
  };
}

// ---- Numerology ----
const CHALDEAN: Record<string, number> = {
  A:1,I:1,J:1,Q:1,Y:1, B:2,K:2,R:2, C:3,G:3,L:3,S:3, D:4,M:4,T:4, E:5,H:5,N:5,X:5, U:6,V:6,W:6, O:7,Z:7, F:8,P:8,
};
const PYTHAGOREAN: Record<string, number> = {
  A:1,J:1,S:1, B:2,K:2,T:2, C:3,L:3,U:3, D:4,M:4,V:4, E:5,N:5,W:5, F:6,O:6,X:6, G:7,P:7,Y:7, H:8,Q:8,Z:8, I:9,R:9,
};
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export function reduceDigit(n: number, keepMaster = false): number {
  let x = Math.abs(Math.floor(n));
  while (x > 9 && (!keepMaster || (x !== 11 && x !== 22 && x !== 33))) {
    x = String(x).split('').reduce((a, c) => a + Number(c), 0);
  }
  return x;
}

export function computeNumerology(name: string, y: number, m: number, d: number, refYear = new Date().getFullYear()) {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  let chSum = 0, pySum = 0, vowelSum = 0, consSum = 0;
  for (const ch of clean) {
    chSum += CHALDEAN[ch] || 0;
    const pv = PYTHAGOREAN[ch] || 0;
    pySum += pv;
    if (VOWELS.has(ch)) vowelSum += pv;
    else consSum += pv;
  }

  const moolank = reduceDigit(d, false);
  const bhagyank = reduceDigit(Number(`${y}${m}${d}`), false);
  const lifePath = reduceDigit(reduceDigit(y, true) + reduceDigit(m, true) + reduceDigit(d, true), true);
  const expression = reduceDigit(pySum, true);
  const soulUrge = reduceDigit(vowelSum, true);
  const personality = reduceDigit(consSum, true);
  const chaldeanCompound = chSum;
  const chaldeanRoot = reduceDigit(chSum, false);
  const now = new Date();
  const refMonth = now.getMonth() + 1;
  const refDay = now.getDate();
  const personalYear = reduceDigit(d + m + reduceDigit(refYear, false), false);
  const personalMonth = reduceDigit(personalYear + refMonth, false);
  const personalDay = reduceDigit(personalMonth + refDay, false);

  const NUM_COMPAT: Record<number, { compat: number[]; chall: number[]; colTe: string; colEn: string; metalTe: string; metalEn: string; dirTe: string; dirEn: string }> = {
    1: { compat: [1, 2, 3, 5, 9], chall: [6, 8], colTe: 'బంగారు, నారింజ, లేత పసుపు', colEn: 'Gold, Saffron, Orange', metalTe: 'రాగి / బంగారు రేకు', metalEn: 'Copper or Gold plate', dirTe: 'తూర్పు', dirEn: 'East' },
    2: { compat: [1, 2, 3, 5], chall: [8, 9], colTe: 'తెలుపు, క్రీమ్, లేత ఆకుపచ్చ', colEn: 'White, Cream, Pale Green', metalTe: 'వెండి రేకు', metalEn: 'Silver plate', dirTe: 'వాయువ్యం', dirEn: 'North-West' },
    3: { compat: [1, 2, 3, 9], chall: [5, 6], colTe: 'పసుపు, కేసరి, ఊదా', colEn: 'Yellow, Saffron, Violet', metalTe: 'బంగారు / ఇత్తడి రేకు', metalEn: 'Gold or Brass plate', dirTe: 'ఈశాన్యం', dirEn: 'North-East' },
    4: { compat: [1, 5, 6, 7], chall: [4, 8, 9], colTe: 'నీలం, బూడిద, ఖాకీ', colEn: 'Electric Blue, Grey', metalTe: 'పరచు/రాగి రేకు లేదా భూర్జపత్రం', metalEn: 'Bhojpatra or Copper', dirTe: 'నైరుతి', dirEn: 'South-West' },
    5: { compat: [1, 5, 6, 3], chall: [2, 9], colTe: 'ఆకుపచ్చ, తెలుపు', colEn: 'Emerald Green, White', metalTe: 'భూర్జపత్రం / వెండి రేకు', metalEn: 'Bhojpatra or Silver', dirTe: 'ఉత్తరం', dirEn: 'North' },
    6: { compat: [4, 5, 6, 8], chall: [1, 2], colTe: 'తెలుపు, లేత నీలం, గులాబీ', colEn: 'White, Pastel Blue, Pink', metalTe: 'వెండి రేకు', metalEn: 'Silver plate', dirTe: 'ఆగ్నేయం', dirEn: 'South-East' },
    7: { compat: [1, 2, 4, 6], chall: [7, 8], colTe: 'లేత పసుపు, ఆకుపచ్చ, తెలుపు', colEn: 'Light Yellow, Cream, Green', metalTe: 'భూర్జపత్రం / బంగారు పతకం', metalEn: 'Bhojpatra or Gold', dirTe: 'ఈశాన్యం', dirEn: 'North-East' },
    8: { compat: [5, 6, 8], chall: [1, 2, 9], colTe: 'ముదురు నీలం, నలుపు, ఊదా', colEn: 'Navy Blue, Charcoal, Violet', metalTe: 'ఇనుము / పంచలోహ రేకు', metalEn: 'Iron or Panchdhatu', dirTe: 'పశ్చిమం', dirEn: 'West' },
    9: { compat: [1, 2, 3, 6], chall: [4, 8], colTe: 'ఎరుపు, కెంపు, నారింజ', colEn: 'Crimson Red, Coral', metalTe: 'రాగి రేకు', metalEn: 'Copper plate', dirTe: 'దక్షిణం', dirEn: 'South' },
  };
  const info = NUM_COMPAT[moolank] || NUM_COMPAT[1];

  // Lo Shu 3x3 Grid: [[4,9,2],[3,5,7],[8,1,6]]
  const digits = `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`.split('').map(Number).filter((x) => x > 0);
  const counts: Record<number, number> = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 };
  for (const x of digits) counts[x]++;
  const missing = Object.entries(counts).filter(([, c]) => c === 0).map(([k]) => Number(k));

  return {
    moolank, bhagyank, lifePath, expression, soulUrge, personality,
    chaldeanCompound, chaldeanRoot, personalYear, personalMonth, personalDay,
    compatibleNumbers: info.compat,
    challengingNumbers: info.chall,
    luckyColorsTe: info.colTe,
    luckyColorsEn: info.colEn,
    yantraSpec: {
      metalTe: info.metalTe,
      metalEn: info.metalEn,
      inkTe: 'అష్టగంధం / కుంకుమ / దానిమ్మ కొమ్మ కలం (లేదా లోహంపై చెక్కడ)',
      inkEn: 'Ashtagandha / Saffron ink with pomegranate twig (or clean metal engraving)',
      directionTe: `${info.dirTe} ముఖంగా కూర్చొని`,
      directionEn: `Facing ${info.dirEn} during Shukla Paksha morning`,
    },
    loShuCounts: counts,
    loShuMissing: missing,
    loShuGrid: [[4, 9, 2], [3, 5, 7], [8, 1, 6]],
  };
}

export function analyzeNumberString(str: string) {
  const digits = str.replace(/[^0-9]/g, '');
  const letters = str.toUpperCase().replace(/[^A-Z]/g, '');
  let sum = 0;
  for (const d of digits) sum += Number(d);
  for (const l of letters) sum += CHALDEAN[l] || 0;
  const root = reduceDigit(sum, false);
  const rulers: Record<number, { en: string; te: string }> = {
    1: { en: 'Sun — Leadership & Vitality', te: 'సూర్యుడు — నాయకత్వం & ఆత్మబలం' },
    2: { en: 'Moon — Harmony & Partnerships', te: 'చంద్రుడు — సామరస్యం & మనోబలం' },
    3: { en: 'Jupiter — Wisdom & Growth', te: 'గురుడు — వివేకం & పురోగతి' },
    4: { en: 'Rahu — Innovation & Breakthroughs', te: 'రాహువు — నూతన ఆలోచనలు & మార్పులు' },
    5: { en: 'Mercury — Commerce & Communication', te: 'బుధుడు — వ్యాపారం & వాక్చాతుర్యం' },
    6: { en: 'Venus — Luxury, Arts & Attraction', te: 'శుక్రుడు — కళలు, సౌఖ్యం & ఆకర్షణ' },
    7: { en: 'Ketu — Research & Spirituality', te: 'కేతువు — పరిశోధన & ఆధ్యాత్మికత' },
    8: { en: 'Saturn — Discipline & Justice', te: 'శని — క్రమశిక్షణ & న్యాయం' },
    9: { en: 'Mars — Energy, Drive & Courage', te: 'కుజుడు — ధైర్యం, శక్తి & కృషి' },
  };
  return {
    total: sum,
    root,
    ruler: rulers[root]?.en || 'Balanced',
    rulerTe: rulers[root]?.te || 'సమతుల్యం',
    favorable: [1, 3, 5, 6].includes(root),
  };
}

export function buildMagicSquare(n: number): number[][] {
  // Odd-order Siamese method or 4x4 doubly-even standard
  if (n % 2 === 1) {
    const grid = Array.from({ length: n }, () => Array(n).fill(0));
    let i = 0, j = Math.floor(n / 2);
    for (let num = 1; num <= n * n; num++) {
      grid[i][j] = num;
      const ni = (i - 1 + n) % n;
      const nj = (j + 1) % n;
      if (grid[ni][nj] !== 0) i = (i + 1) % n;
      else { i = ni; j = nj; }
    }
    return grid;
  }
  if (n === 4) {
    return [[16, 2, 3, 13], [5, 11, 10, 8], [9, 7, 6, 12], [4, 14, 15, 1]];
  }
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1));
}

// ---- Western Astrology Subsystem (Tropical, Outer Planets, Aspects, Synastry, Composite, Progressions, Solar Return) ----
export type WesternAspectType =
  | 'Conjunction'
  | 'Sextile'
  | 'Square'
  | 'Trine'
  | 'Opposition'
  | 'Semi-sextile'
  | 'Semi-square'
  | 'Sesquiquadrate'
  | 'Quincunx';

export interface WesternAspect {
  p1: string;
  p1Te?: string;
  p2: string;
  p2Te?: string;
  type: WesternAspectType;
  typeTe: string;
  angle: number;
  orb: number;
  harmony: 'Major' | 'Harmonious' | 'Tense' | 'Minor';
}

const MAJOR_ASPECT_DEFS: { name: WesternAspectType; nameTe: string; deg: number; orb: number; harmony: WesternAspect['harmony'] }[] = [
  { name: 'Conjunction', nameTe: 'యుతి (0°)', deg: 0, orb: 8, harmony: 'Major' },
  { name: 'Opposition', nameTe: 'ప్రతియుతి (180°)', deg: 180, orb: 8, harmony: 'Tense' },
  { name: 'Trine', nameTe: 'త్రికోణ (120°)', deg: 120, orb: 7, harmony: 'Harmonious' },
  { name: 'Square', nameTe: 'చతురస్ర (90°)', deg: 90, orb: 7, harmony: 'Tense' },
  { name: 'Sextile', nameTe: 'షష్ఠ (60°)', deg: 60, orb: 5, harmony: 'Harmonious' },
];

const MINOR_ASPECT_DEFS: { name: WesternAspectType; nameTe: string; deg: number; orb: number; harmony: WesternAspect['harmony'] }[] = [
  { name: 'Quincunx', nameTe: 'షష్టాష్టక (150°)', deg: 150, orb: 2.5, harmony: 'Minor' },
  { name: 'Sesquiquadrate', nameTe: 'సెసిక్వాడ్రేట్ (135°)', deg: 135, orb: 2, harmony: 'Minor' },
  { name: 'Semi-square', nameTe: 'అర్ధ-వర్గ (45°)', deg: 45, orb: 2, harmony: 'Minor' },
  { name: 'Semi-sextile', nameTe: 'అర్ధ-షష్ఠ (30°)', deg: 30, orb: 2, harmony: 'Minor' },
];

export function computeWesternAnalysis(chart: ComputedChart, includeMinor = false) {
  const bodies = [
    ...chart.rows.filter((r) => r.id !== 3 && r.id !== 7).map((r) => ({ name: PLANET_NAMES.en[r.id], nameTe: PLANET_NAMES.te[r.id], lon: r.tropicalLon, sign: Math.floor(r.tropicalLon / 30), retro: r.retro })),
    ...chart.outerPlanets.map((o) => ({ name: o.nameEn, nameTe: o.nameTe, lon: o.tropicalLon, sign: Math.floor(o.tropicalLon / 30), retro: o.retro })),
  ];

  const defs = includeMinor ? [...MAJOR_ASPECT_DEFS, ...MINOR_ASPECT_DEFS] : MAJOR_ASPECT_DEFS;
  const aspects: WesternAspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let k = i + 1; k < bodies.length; k++) {
      const diff = Math.abs(signedDiff(bodies[i].lon, bodies[k].lon));
      for (const a of defs) {
        const orb = Math.abs(diff - a.deg);
        if (orb <= a.orb) {
          aspects.push({
            p1: bodies[i].name,
            p1Te: bodies[i].nameTe,
            p2: bodies[k].name,
            p2Te: bodies[k].nameTe,
            type: a.name,
            typeTe: a.nameTe,
            angle: a.deg,
            orb,
            harmony: a.harmony,
          });
          break;
        }
      }
    }
  }

  const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modalities = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  const elKeys = ['Fire', 'Earth', 'Air', 'Water'] as const;
  const modKeys = ['Cardinal', 'Fixed', 'Mutable'] as const;
  for (const b of bodies) {
    elements[elKeys[b.sign % 4]]++;
    modalities[modKeys[b.sign % 3]]++;
  }

  return {
    bodies,
    aspects,
    elements,
    modalities,
    tropicalAsc: N(chart.lag + chart.ay),
    tropicalMc: N(chart.mc + chart.ay),
  };
}

export function computeWesternSynastry(a: ComputedChart, b: ComputedChart) {
  const wa = computeWesternAnalysis(a);
  const wb = computeWesternAnalysis(b);
  const synastryAspects: WesternAspect[] = [];
  for (const ba of wa.bodies) {
    for (const bb of wb.bodies) {
      const diff = Math.abs(signedDiff(ba.lon, bb.lon));
      for (const asp of MAJOR_ASPECT_DEFS) {
        const orb = Math.abs(diff - asp.deg);
        if (orb <= asp.orb) {
          synastryAspects.push({
            p1: `A:${ba.name}`,
            p1Te: `A:${ba.nameTe}`,
            p2: `B:${bb.name}`,
            p2Te: `B:${bb.nameTe}`,
            type: asp.name,
            typeTe: asp.nameTe,
            angle: asp.deg,
            orb,
            harmony: asp.harmony,
          });
          break;
        }
      }
    }
  }

  const compositeBodies = wa.bodies.map((ba, idx) => {
    const bb = wb.bodies[idx];
    const mid = N(ba.lon + signedDiff(bb.lon, ba.lon) / 2);
    return { name: ba.name, nameTe: ba.nameTe, lon: mid, sign: Math.floor(mid / 30) };
  });

  return { synastryAspects, compositeBodies };
}

export function computeWesternSecondaryProgressions(chart: ComputedChart, targetAgeYears: number) {
  // Day-for-a-year secondary progression
  const clampedAge = Math.max(0, Math.min(120, targetAgeYears));
  const progJd = chart.jd + clampedAge;
  const progTrop = P(progJd, chart.config.ay, false, chart.config.nodeType === 'true');
  const progCusps = CU(progJd, chart.inp.lat, chart.inp.lon, chart.config.ay, false, chart.config.houseSystem);
  const planetIds: PlanetId[] = [0, 1, 2, 6, 4, 8, 5];

  const planets = planetIds.map((id) => {
    const lon = progTrop[id];
    const sign = Math.floor(lon / 30);
    const natalLon = chart.ptrop[id];
    const natalSign = Math.floor(natalLon / 30);
    return {
      id,
      progressedLon: lon,
      progressedSign: sign,
      degInSign: lon % 30,
      natalLon,
      natalSign,
      changedSign: sign !== natalSign,
    };
  });

  return {
    targetAgeYears: clampedAge,
    progressedAsc: progCusps[0],
    progressedAscSign: Math.floor(progCusps[0] / 30),
    progressedMc: progCusps[9],
    planets,
  };
}

export function computeWesternSolarReturn(chart: ComputedChart, targetYear: number) {
  // Tropical Solar Return: find exact JD when tropical Sun returns to natal ptrop[0]
  const targetSun = chart.ptrop[0];
  let jd = chart.jd + (targetYear - chart.inp.y) * 365.24219;
  for (let i = 0; i < 16; i++) {
    const cur = P(jd, chart.config.ay, false, false)[0];
    const diff = signedDiff(targetSun, cur);
    jd += diff / 0.985647;
    if (Math.abs(diff) < 1e-5) break;
  }
  const srTrop = P(jd, chart.config.ay, false, chart.config.nodeType === 'true');
  const srCusps = CU(jd, chart.inp.lat, chart.inp.lon, chart.config.ay, false, chart.config.houseSystem);
  const localIso = new Date((jd - 2440587.5) * 864e5 + chart.inp.tz * 36e5).toISOString().slice(0, 16).replace('T', ' ');
  return {
    targetYear,
    exactLocalTime: localIso,
    solarReturnAsc: srCusps[0],
    solarReturnAscSign: Math.floor(srCusps[0] / 30),
    solarReturnMc: srCusps[9],
    solarReturnMoonSign: Math.floor(srTrop[1] / 30),
    planets: ([0, 1, 2, 6, 4, 8, 5] as PlanetId[]).map((id) => ({
      id,
      lon: srTrop[id],
      sign: Math.floor(srTrop[id] / 30),
      degInSign: srTrop[id] % 30,
    })),
  };
}

// ---- Traditional Remedies Guide (Explicitly tagged traditional/belief-based) ----
export const GEMSTONE_MAP: Record<PlanetId, { gem: string; gemTe: string; metal: string; finger: string; day: string }> = {
  0: { gem: 'Ruby (Manikya)', gemTe: 'మాణిక్యం', metal: 'Gold', finger: 'Ring', day: 'Sunday' },
  1: { gem: 'Natural Pearl (Moti)', gemTe: 'ముత్యం', metal: 'Silver', finger: 'Little', day: 'Monday' },
  2: { gem: 'Red Coral (Moonga)', gemTe: 'పగడం', metal: 'Copper / Gold', finger: 'Ring', day: 'Tuesday' },
  3: { gem: 'Hessonite (Gomed)', gemTe: 'గోమేధికం', metal: 'Silver / Panchdhatu', finger: 'Middle', day: 'Saturday' },
  4: { gem: 'Yellow Sapphire (Pukhraj)', gemTe: 'పుష్యరాగం', metal: 'Gold', finger: 'Index', day: 'Thursday' },
  5: { gem: 'Blue Sapphire (Neelam)', gemTe: 'నీలం (విధిగా పరీక్షించి)', metal: 'Silver / Iron', finger: 'Middle', day: 'Saturday' },
  6: { gem: 'Emerald (Panna)', gemTe: 'పచ్చ', metal: 'Gold', finger: 'Little', day: 'Wednesday' },
  7: { gem: "Cat's Eye (Lehsunia)", gemTe: 'వైఢూర్యం', metal: 'Silver', finger: 'Little', day: 'Tuesday / Saturday' },
  8: { gem: 'Diamond / White Sapphire', gemTe: 'వజ్రం / స్ఫటికం', metal: 'Platinum / Silver', finger: 'Middle / Ring', day: 'Friday' },
};

export const RUDRAKSHA_MAP: Record<PlanetId, { mukhi: number; mantra: string; deity: string }> = {
  0: { mukhi: 1, mantra: 'Om Hreem Namah', deity: 'Shiva / Surya' },
  1: { mukhi: 2, mantra: 'Om Namah', deity: 'Ardhanarishvara' },
  2: { mukhi: 3, mantra: 'Om Kleem Namah', deity: 'Agni / Skanda' },
  3: { mukhi: 8, mantra: 'Om Hum Namah', deity: 'Ganesha' },
  4: { mukhi: 5, mantra: 'Om Hreem Namah', deity: 'Kalagni Rudra / Dakshinamurthy' },
  5: { mukhi: 7, mantra: 'Om Hum Namah', deity: 'Mahalakshmi / Saptarishi' },
  6: { mukhi: 4, mantra: 'Om Hreem Namah', deity: 'Brahma' },
  7: { mukhi: 9, mantra: 'Om Hreem Hum Namah', deity: 'Navadurga' },
  8: { mukhi: 6, mantra: 'Om Hreem Hum Namah', deity: 'Kartikeya' },
};

export const LAL_KITAB_PAKKA: Record<PlanetId, { pakkaHouses: number[]; remedyTe: string; remedyEn: string }> = {
  0: { pakkaHouses: [1], remedyTe: 'సూర్యోదయ ఆర్ఘ్యం; ఆదివారం గోధుమ/బెల్లం దానం', remedyEn: 'Water offering at sunrise; donate wheat/jaggery on Sundays' },
  1: { pakkaHouses: [4], remedyTe: 'సోమవారం శివాభిషేకం; తల్లి ఆశీర్వాదం', remedyEn: 'Monday milk/water offering; respect mother & keep silver coin' },
  2: { pakkaHouses: [3, 8], remedyTe: 'మంగళవారం ఎర్ర పప్పు/బెల్లం దానం', remedyEn: 'Red lentils donation on Tuesdays; sweet disposition with siblings' },
  3: { pakkaHouses: [12], remedyTe: 'పక్షులకు ఆహారం; శనివారం నల్ల నువ్వులు', remedyEn: 'Feed birds; Saturday black sesame or coconut charity' },
  4: { pakkaHouses: [2], remedyTe: 'గురువారం పసుపు/శనగపప్పు; గురు సేవ', remedyEn: 'Yellow turmeric/gram charity on Thursdays; saffron tilak' },
  5: { pakkaHouses: [10], remedyTe: 'శనివారం నల్ల నువ్వులు; శ్రమజీవులకు సహాయం', remedyEn: 'Black sesame/oil charity; fair treatment of workers' },
  6: { pakkaHouses: [7], remedyTe: 'బుధవారం పెసలు/ఆవుకు పచ్చ గడ్డి', remedyEn: 'Green moong charity on Wednesdays; keep speech measured' },
  7: { pakkaHouses: [6], remedyTe: 'కుక్కలకు ఆహారం; దుప్పటి దానం', remedyEn: 'Feed stray dogs; blanket charity on Tuesdays' },
  8: { pakkaHouses: [7], remedyTe: 'శుక్రవారం తెల్ల వస్తువుల దానం; శుభ్రత', remedyEn: 'White rice/curd charity on Fridays; respect spouse' },
};
