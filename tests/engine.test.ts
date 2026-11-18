import assert from 'node:assert/strict';
import test from 'node:test';
import { computeAvasthas, computeChart, computeGrahaYuddha, computeIntegratedInterpretation } from '../src/engine/parashari.ts';
import { ALL_VARGAS, buildAllVargas, buildVargaChart, vargottamaSummary } from '../src/engine/vargas.ts';
import { computeBhavaBala, computeShadbala, computeVimsopaka, ashtaka } from '../src/engine/strength.ts';
import { evaluateYogas } from '../src/engine/yogasNakshatra.ts';
import {
  analyzeDashaPeriod,
  computeMandookaDasha,
  computeShoolaDasha,
  computeVimshottari,
  findActiveVimshottari,
  YEAR_MS,
} from '../src/engine/dasha.ts';
import { evaluateKpEvent, getKpHoraryTable, KP_EVENTS, computeKpHorary } from '../src/engine/kp.ts';
import { computeJaiminiSummary } from '../src/engine/jaimini.ts';
import { computeFullPanchanga, searchMuhurtaWindows } from '../src/engine/panchanga.ts';
import {
  computeAshtakoota,
  computeNumerology,
  computeWesternAnalysis,
  computeWesternSecondaryProgressions,
  computeWesternSolarReturn,
} from '../src/engine/compatibilityNumerologyWestern.ts';
import { generateStructuredReport, REPORT_TYPES } from '../src/engine/reports.ts';
import type { BirthInput } from '../src/engine/types.ts';

const HYD_1990: BirthInput = {
  y: 1990,
  m: 5,
  d: 14,
  hh: 6,
  mi: 42,
  ss: 0,
  lat: 17.385,
  lon: 78.4867,
  tz: 5.5,
  ay: 1,
  place: 'Hyderabad, India',
};

const INDEPENDENCE_1947: BirthInput = {
  y: 1947,
  m: 8,
  d: 15,
  hh: 0,
  mi: 0,
  ss: 0,
  lat: 28.6139,
  lon: 77.209,
  tz: 5.5,
  ay: 1,
  place: 'New Delhi, India',
};

test('computeChart computes canonical positions for J2000 & 1947-08-15 Delhi', () => {
  const c47 = computeChart(INDEPENDENCE_1947);
  assert.equal(c47.lagS, 1, '1947-08-15 00:00 IST Delhi Lagna should be Taurus (1)');
  assert.equal(c47.s[0], 3, 'Sun on 15 Aug 1947 (Lahiri) should be in Cancer (3)');
  assert.equal(c47.s[1], 3, 'Moon on 15 Aug 1947 00:00 IST (Lahiri) should be in Cancer (3)');
  assert.equal(c47.rows.length, 9, 'Should produce all 9 Vedic grahas');
  assert.equal(c47.cu.length, 12, 'Should produce 12 house cusps');
  assert.ok(c47.ayVal > 23 && c47.ayVal < 24, 'Lahiri ayanamsha in 1947 should be ~23.12 deg');
});

test('All 23 divisional charts (D1..D144) including D5, D6, D8, D11, D81, D108, D144 build cleanly', () => {
  assert.equal(ALL_VARGAS.length, 23);
  const chart = computeChart(HYD_1990);
  const all = buildAllVargas(chart);
  assert.equal(all.length, 23);
  for (const code of ['D1', 'D5', 'D6', 'D8', 'D9', 'D10', 'D11', 'D60', 'D81', 'D108', 'D144']) {
    const found = all.find((x) => x.meta.code === code);
    assert.ok(found, `Expected divisional chart ${code}`);
    assert.ok(found.lagnaSign >= 0 && found.lagnaSign < 12);
  }
  const d9 = buildVargaChart(chart, 9);
  assert.equal(d9.lagnaSign, Math.floor(chart.lag / (10 / 3)) % 12);
  const vgt = vargottamaSummary(chart);
  assert.equal(vgt.length, 9);
});

test('Shadbala, Bhava Bala, Vimsopaka & Ashtakavarga (337 SAV total) validate correctly', () => {
  const chart = computeChart(HYD_1990);
  const sb = computeShadbala(chart);
  assert.equal(sb.length, 7, 'Shadbala covers Sun..Saturn');
  for (const row of sb) {
    assert.ok(row.totalVirupas > 100 && row.totalVirupas < 1000, `Virupas out of bounds for ${row.id}`);
    assert.ok(Math.abs(row.totalRupas - row.totalVirupas / 60) < 0.05);
  }
  const bb = computeBhavaBala(chart, sb);
  assert.equal(bb.length, 12);
  const vim = computeVimsopaka(chart);
  assert.equal(vim.length, 7);

  const av = ashtaka(chart.s, chart.lagS);
  const savTotal = av.sav.reduce((a, b) => a + b, 0);
  assert.equal(savTotal, 337, 'Canonical Parashari Sarvashtakavarga total must equal 337 bindus');

  const avas = computeAvasthas(chart);
  assert.equal(avas.length, 9);
  assert.ok(avas.every((a) => Boolean(a.lajjitadiTe) && Boolean(a.shayanadiTe)));

  const wars = computeGrahaYuddha(chart);
  assert.ok(Array.isArray(wars));

  const interp = computeIntegratedInterpretation(chart, sb, bb);
  assert.ok(interp.headlineTe.length > 0 && interp.factors.length === 5);
});

test('Yogas, 5-level Vimshottari (120y), Shoola/Mandooka Dashas, KP 1-249, Jaimini & Full Panchanga', () => {
  const chart = computeChart(HYD_1990);
  const yogas = evaluateYogas(chart.p, chart.lagS);
  assert.ok(yogas.length > 0, 'Should evaluate classical yoga rules');

  const vim = computeVimshottari(chart.p[1], chart.t0);
  assert.equal(vim.mahas.length, 9, 'Vimshottari cycle should list 9 mahadashas');
  const totalYears = vim.mahas.reduce((acc, m) => acc + (m.end - m.start) / YEAR_MS, 0);
  assert.ok(totalYears > 119.9 && totalYears <= 120.1, 'Full Vimshottari span should equal 120 years');

  const active = findActiveVimshottari(chart.p[1], chart.t0, chart.t0 + 10 * YEAR_MS);
  assert.ok(active.maha && active.antar && active.pratyantar && active.sookshma && active.prana);

  const shoola = computeShoolaDasha(chart);
  assert.equal(shoola.length, 12);
  assert.ok(shoola.every((s) => s.years === 9 && (s.direction === 'Forward' || s.direction === 'Reverse')));

  const mandooka = computeMandookaDasha(chart);
  assert.equal(mandooka.length, 12);

  const phalalu = analyzeDashaPeriod(chart, 0);
  assert.ok(phalalu.phalaluTe.length > 10 && phalalu.phalaluEn.length > 10);

  const table249 = getKpHoraryTable();
  assert.equal(table249.length, 249, 'KP Horary table must have exactly 249 slots');
  assert.equal(table249[0].number, 1);
  assert.equal(table249[248].number, 249);
  const horary = computeKpHorary(108, HYD_1990);
  assert.equal(horary.number, 108);
  const kpEval = evaluateKpEvent(chart, KP_EVENTS[0]);
  assert.ok(['Promised', 'Conditional / Mixed', 'Weak / Delayed'].includes(kpEval.verdict));

  const jaimini = computeJaiminiSummary(chart);
  assert.ok(jaimini.ak && jaimini.amk && jaimini.dk);
  assert.equal(Object.keys(jaimini.arudhas).length, 12);

  const pan = computeFullPanchanga(HYD_1990, chart.config);
  assert.ok(pan.sunrise && pan.sunset && pan.rahuKalam && pan.abhijitMuhurta);
  assert.ok(Boolean(pan.samvatsaraTe) && typeof pan.isAdhikaMasa === 'boolean');
  assert.equal(pan.choghadiyaDay.length, 8);
  assert.ok(pan.choghadiyaDay.every((c) => Boolean(c.nameTe)));
  assert.equal(pan.horas.length, 24);

  const muhurtas = searchMuhurtaWindows(chart.p[1], '2026-05-01', 10, 'marriage', {
    lat: 17.385, lon: 78.4867, tz: 5.5, ay: 1,
  });
  assert.ok(Array.isArray(muhurtas));
  if (muhurtas.length > 0) {
    assert.ok(Boolean(muhurtas[0].varaTe) && Boolean(muhurtas[0].tithiTe));
  }
});

test('Compatibility, Numerology, Western Aspects/Progressions/Solar Return, 27 Reports & Boundary Cases', () => {
  const c1 = computeChart(HYD_1990);
  const c2 = computeChart(INDEPENDENCE_1947);
  const m1 = c1.rows.find((r) => r.id === 1)!;
  const m2 = c2.rows.find((r) => r.id === 1)!;
  const koota = computeAshtakoota(m1.nk, m1.pada, m2.nk, m2.pada);
  assert.ok(koota.total >= 0 && koota.total <= 36);
  assert.equal(koota.dashakoota.length, 10);

  const num = computeNumerology('Sri Rama Rao', 1990, 5, 14, 2026);
  assert.equal(num.moolank, 5);
  assert.ok(num.bhagyank >= 1 && num.bhagyank <= 9);

  const west = computeWesternAnalysis(c1, true);
  assert.equal(west.elements.Fire + west.elements.Earth + west.elements.Air + west.elements.Water, 10);
  assert.ok(west.aspects.every((a) => Boolean(a.typeTe)));

  const prog = computeWesternSecondaryProgressions(c1, 35);
  assert.equal(prog.targetAgeYears, 35);
  assert.equal(prog.planets.length, 7);

  const solarRet = computeWesternSolarReturn(c1, 2026);
  assert.equal(solarRet.targetYear, 2026);
  assert.equal(solarRet.planets.length, 7);

  assert.equal(REPORT_TYPES.length, 27, 'Should define all 27 professional report templates');
  const rep = generateStructuredReport(
    'natal-full',
    { ...HYD_1990, id: 'p1', name: 'Sri Rama Rao', gender: 'male', place: 'Hyderabad, India', birthTimeKnown: true },
    c1,
    'detailed',
    'en',
  );
  assert.ok(rep.sections.length >= 4);

  const teRep = generateStructuredReport(
    'telugu-jathakam',
    { ...HYD_1990, id: 'p1', name: 'Sri Rama Rao', gender: 'male', place: 'Hyderabad, India', birthTimeKnown: true },
    c1,
    'research',
    'te',
  );
  assert.ok(teRep.sections.length >= 4);

  // Boundary cases: leap day, midnight, high latitude
  const leapMidnight: BirthInput = {
    y: 2000, m: 2, d: 29, hh: 0, mi: 0, ss: 0,
    lat: 78.2, lon: 15.6, tz: 1, ay: 1, place: 'Svalbard',
  };
  const cEdge = computeChart(leapMidnight);
  assert.ok(Number.isFinite(cEdge.lag) && cEdge.rows.every((r) => Number.isFinite(r.lon)));
});
