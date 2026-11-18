import { AYN, AYC, CITIES } from './data/coreData.ts';
import { MNT_B64, PLT_B64 } from './data/ephemTables.ts';
import type { HouseSystem, OuterPlanetKey, PlanetId } from './types.ts';

const R = Math.PI / 180;
export const N = (x: number): number => ((x % 360) + 360) % 360;
export const signedDiff = (a: number, b: number): number => N(a - b + 180) - 180;
const S = Math.sin;
const C = Math.cos;

// Orbital elements for Keplerian baseline (Sun..Saturn + outer Uranus, Neptune, Pluto)
const EL: Record<string, number[]> = {
  Me: [0.38709843, 0, 0.20563661, 0.00002123, 7.00559432, -0.00590158, 252.25166724, 149472.67486623, 77.45771895, 0.15940013, 48.33961819, -0.12214182],
  Ve: [0.72332102, -0.00000026, 0.00676399, -0.00005107, 3.39777545, 0.00043494, 181.9797085, 58517.8156026, 131.76755713, 0.05679648, 76.67261496, -0.27274174],
  Ea: [1.00000018, -0.00000003, 0.01673163, -0.00003661, -0.00054346, -0.01337178, 100.46691572, 35999.37306329, 102.93005885, 0.3179526, -5.11260389, -0.24123856],
  Ma: [1.52371243, 0.00000097, 0.09336511, 0.00009149, 1.85181869, -0.00724757, -4.56813164, 19140.29934243, -23.91744784, 0.45223625, 49.71320984, -0.26852431],
  Ju: [5.20248019, -0.00002864, 0.0485359, 0.00018026, 1.29861416, -0.00322699, 34.33479152, 3034.90371757, 14.27495244, 0.18199196, 100.29282654, 0.13024619],
  Sa: [9.54149883, -0.00003065, 0.05550825, -0.00032044, 2.49424102, 0.00451969, 50.07571329, 1222.11494724, 92.86136063, 0.54179478, 113.63998702, -0.25015002],
  Ur: [19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.9542763, 0.40805281, 74.01692503, 0.04240589],
  Ne: [30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664],
  Pl: [39.48211675, -0.00031596, 0.2488273, 0.0000517, 17.14001206, 0.00004818, 238.92903833, 145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482],
};

function hel3(k: string, T: number): [number, number, number] {
  const e = EL[k];
  const v = (i: number) => e[i] + e[i + 1] * T;
  const a = v(0);
  const ec = v(2);
  const I = v(4) * R;
  const L = v(6);
  const w = v(8);
  const O = v(10) * R;
  const M = N(L - w) * R;
  let E = M + ec * S(M);
  for (let i = 0; i < 9; i++) {
    E -= (E - ec * S(E) - M) / (1 - ec * C(E));
  }
  const xp = a * (C(E) - ec);
  const yp = a * Math.sqrt(1 - ec * ec) * S(E);
  const o = (w - v(10)) * R;
  const co = C(o), so = S(o), cO = C(O), sO = S(O), cI = C(I), sI = S(I);
  const x = (co * cO - so * sO * cI) * xp + (-so * cO - co * sO * cI) * yp;
  const y = (co * sO + so * cO * cI) * xp + (-so * sO + co * cO * cI) * yp;
  const z = (so * sI) * xp + (co * sI) * yp;
  return [x, y, z];
}

const MT: [number, number, number, number, number][] = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618],
  [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066],
  [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528], [0, 0, 1, -2, 10980],
  [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665], [0, 1, -2, 0, -2689],
];

export function moonMean(T: number): number {
  const L = 218.3164477 + 481267.88123421 * T;
  const D = (297.8501921 + 445267.1114034 * T) * R;
  const M = (357.5291092 + 35999.0502909 * T) * R;
  const P = (134.9633964 + 477198.8675055 * T) * R;
  const F = (93.272095 + 483202.0175233 * T) * R;
  let s = 0;
  for (const t of MT) s += t[4] * S(t[0] * D + t[1] * M + t[2] * P + t[3] * F);
  return N(L + s / 1e6);
}

export function moonLatitude(T: number): number {
  const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) * R;
  const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) * R;
  const F = (93.272095 + 483202.0175233 * T - 0.0036539 * T * T) * R;
  return (
    5.128189 * S(F) +
    0.280606 * S(Mp + F) +
    0.277693 * S(Mp - F) +
    0.173238 * S(2 * D - F) +
    0.055413 * S(2 * D + F - Mp) +
    0.046272 * S(2 * D - F - Mp) +
    0.032573 * S(2 * D + F) +
    0.017198 * S(2 * Mp + F) +
    0.009267 * S(2 * D + Mp - F) +
    0.008823 * S(2 * Mp - F)
  );
}

function decodeInt16(src: string | Record<string, string>): Int16Array {
  const b64 = typeof src === 'string' ? src : Object.values(src)[0];
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(b64, 'base64');
    return new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2));
  }
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Int16Array(u.buffer);
}

const PLT = decodeInt16(PLT_B64);
const MNT = decodeInt16(MNT_B64);

const J0 = 2415020.5;
const NP = 14611;
const NMT = 292201;
const CM: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 6: 4, 8: 5, 3: 6 };

function lerp(a: Int16Array, off: number, n: number, x: number): number {
  if (x < 0 || x >= n - 1) return 0;
  const i = Math.floor(x);
  const f = x - i;
  return (a[off + i] * (1 - f) + a[off + i + 1] * f) * 2e-4;
}

export function cr(i: number, jd: number): number {
  if (i === 1) return lerp(MNT, 0, NMT, (jd - J0) * 4);
  return i in CM ? lerp(PLT, CM[i] * NP, NP, (jd - J0) / 5) : 0;
}

export function AYM(T: number, m: number): number {
  const c = AYC[m] ?? AYC[1]!;
  return c.reduceRight((a, x) => a * T + x, 0);
}

export function getAyanamshaList(): { id: number; name: string }[] {
  const list: { id: number; name: string }[] = [];
  for (let i = 0; i < AYN.length; i++) {
    if (AYN[i] && AYC[i]) list.push({ id: i, name: AYN[i]! });
  }
  return list;
}

export function rawTropical(jd: number): number[] {
  const T = (jd - 2451545) / 36525;
  const pr = 1.3969713 * T;
  const [ex, ey] = hel3('Ea', T);
  const g = (k: string) => {
    const [p, q] = hel3(k, T);
    return N(Math.atan2(q - ey, p - ex) / R + pr);
  };
  const t = [
    N(Math.atan2(-ey, -ex) / R + pr),
    moonMean(T),
    g('Ma'),
    N(125.04452 - 1934.136261 * T),
    g('Ju'),
    g('Sa'),
    g('Me'),
    0,
    g('Ve'),
  ];
  t[7] = N(t[3] + 180);
  return t;
}

export function trueNodeTropical(jd: number): number {
  const T = (jd - 2451545) / 36525;
  const D = N(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + (T * T * T) / 545868);
  const M = N(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + (T * T * T) / 24490000);
  const Mp = N(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + (T * T * T) / 69699);
  const F = N(93.272095 + 483202.0175233 * T - 0.0036539 * T * T - (T * T * T) / 3526000);
  const mean = N(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441);
  const corr =
    -1.4979 * S(2 * (D - F) * R) -
    0.15 * S(M * R) -
    0.1226 * S(2 * D * R) +
    0.1176 * S(2 * F * R) -
    0.0801 * S(2 * (Mp - F) * R);
  return N(mean + corr);
}

export function tropicalPlanets(jd: number, useTrueNode = false): number[] {
  const t = rawTropical(jd);
  const p = t.map((x, i) => N(x + cr(i, jd)));
  if (useTrueNode) {
    p[3] = trueNodeTropical(jd);
  }
  p[7] = N(p[3] + 180);
  return p;
}

export function P(jd: number, ayIdx: number, sidereal = true, useTrueNode = false): number[] {
  const T = (jd - 2451545) / 36525;
  const ay = sidereal ? AYM(T, ayIdx) : 0;
  const trop = tropicalPlanets(jd, useTrueNode);
  const p = trop.map((x) => N(x - ay));
  p[7] = N(p[3] + 180);
  return p;
}

export function outerPlanets(jd: number, ayIdx: number, sidereal = true): Record<OuterPlanetKey, { tropical: number; sidereal: number }> {
  const T = (jd - 2451545) / 36525;
  const ay = sidereal ? AYM(T, ayIdx) : 0;
  const pr = 1.3969713 * T;
  const [ex, ey] = hel3('Ea', T);
  const g = (k: OuterPlanetKey) => {
    const [px, py] = hel3(k, T);
    const trop = N(Math.atan2(py - ey, px - ex) / R + pr);
    return { tropical: trop, sidereal: N(trop - ay) };
  };
  return { Ur: g('Ur'), Ne: g('Ne'), Pl: g('Pl') };
}

export function planetLatitude(id: number, jd: number): number {
  const T = (jd - 2451545) / 36525;
  if (id === 0 || id === 3 || id === 7) return 0;
  if (id === 1) return moonLatitude(T);
  const map: Record<number, string> = { 2: 'Ma', 4: 'Ju', 5: 'Sa', 6: 'Me', 8: 'Ve' };
  const k = map[id];
  if (!k) return 0;
  const [ex, ey, ez] = hel3('Ea', T);
  const [px, py, pz] = hel3(k, T);
  const dx = px - ex, dy = py - ey, dz = pz - ez;
  return Math.atan2(dz, Math.sqrt(dx * dx + dy * dy)) / R;
}

export function eclipticToEquatorial(lonDeg: number, latDeg: number, jd: number): { ra: number; dec: number } {
  const T = (jd - 2451545) / 36525;
  const eps = (23.4392911 - 0.0130042 * T) * R;
  const lam = lonDeg * R;
  const beta = latDeg * R;
  const ra = N(Math.atan2(S(lam) * C(eps) - Math.tan(beta) * S(eps), C(lam)) / R);
  const dec = Math.asin(Math.max(-1, Math.min(1, S(beta) * C(eps) + C(beta) * S(eps) * S(lam)))) / R;
  return { ra, dec };
}

// Placidus cusps (with high-latitude safe clamp so polar charts don't produce NaN)
export function plac(ramc: number, eps: number, lat: number): number[] {
  const safeLat = Math.max(-65.5, Math.min(65.5, lat));
  const e = eps * R;
  const t = Math.tan(safeLat * R);
  const asc = N(Math.atan2(C(ramc * R), -(S(ramc * R) * C(e) + t * S(e))) / R);
  const mc = N(Math.atan2(S(ramc * R), C(ramc * R) * C(e)) / R);
  const f = (a0: number, fr: number, noc: number) => {
    let ra = a0;
    let lm = 0;
    for (let i = 0; i < 12; i++) {
      lm = Math.atan2(S(ra * R), C(ra * R) * C(e));
      const d = Math.asin(S(e) * S(lm));
      const H = Math.acos(Math.max(-1, Math.min(1, -t * Math.tan(d)))) / R;
      ra = noc ? ramc + 180 - fr * (180 - H) : ramc + fr * H;
    }
    return N(
      lm / R +
        (C(ra * R) < 0 && C(lm) > 0 ? 180 : 0) +
        (C(ra * R) >= 0 && C(lm) < 0 ? 180 : 0),
    );
  };
  const c: number[] = new Array(12).fill(0);
  c[0] = asc;
  c[9] = mc;
  c[10] = f(ramc + 30, 1 / 3, 0);
  c[11] = f(ramc + 60, 2 / 3, 0);
  c[1] = f(ramc + 120, 2 / 3, 1);
  c[2] = f(ramc + 150, 1 / 3, 1);
  c[3] = N(mc + 180);
  c[4] = N(c[10] + 180);
  c[5] = N(c[11] + 180);
  c[6] = N(asc + 180);
  c[7] = N(c[1] + 180);
  c[8] = N(c[2] + 180);
  return c;
}

export function CU(jd: number, lat: number, lon: number, ayIdx: number, sidereal = true, system: HouseSystem = 'placidus'): number[] {
  const T = (jd - 2451545) / 36525;
  const ay = sidereal ? AYM(T, ayIdx) : 0;
  const eps = 23.4392911 - 0.0130042 * T;
  const gm = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T;
  const placidus = plac(N(gm + lon), eps, lat).map((x) => N(x - ay));
  if (system === 'placidus') return placidus;
  const asc = placidus[0];
  if (system === 'whole') {
    const base = Math.floor(asc / 30) * 30;
    return Array.from({ length: 12 }, (_, i) => N(base + i * 30));
  }
  if (system === 'equal') {
    return Array.from({ length: 12 }, (_, i) => N(asc + i * 30));
  }
  // Sripati / Porphyry trisection of quadrants
  const cs: number[] = new Array(12).fill(0);
  for (let q = 0; q < 4; q++) {
    const a = placidus[q * 3];
    const b = placidus[((q + 1) * 3) % 12];
    const arc = N(b - a);
    cs[q * 3] = a;
    cs[q * 3 + 1] = N(a + arc / 3);
    cs[q * 3 + 2] = N(a + (2 * arc) / 3);
  }
  return cs;
}

export function houseForLon(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i];
    const b = cusps[(i + 1) % 12];
    if (N(lon - a) < N(b - a)) return i + 1;
  }
  return 12;
}

export function Jd(y: number, m: number, d: number, hUtc: number): number {
  let yy = y;
  let mm = m;
  if (mm <= 2) {
    yy--;
    mm += 12;
  }
  const A = Math.floor(yy / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + B - 1524.5 + hUtc / 24;
}

export function sunpos(j: number): [number, number] {
  const T = (j - 2451545) / 36525;
  const l = rawTropical(j)[0] * R;
  const e = (23.4392911 - 0.0130042 * T) * R;
  return [Math.atan2(C(e) * S(l), C(l)) / R, Math.asin(S(e) * S(l)) / R];
}

export function sunEv(j0: number, lat: number, lon: number, k: 0 | 1 | 2): number {
  const w = (x: number) => (((x % 360) + 540) % 360) - 180;
  const lha = (jx: number) => w(280.46061837 + 360.98564736629 * (jx - 2451545) + lon - sunpos(jx)[0]);
  let j = j0;
  for (let i = 0; i < 5; i++) j -= lha(j) / 360.98564736629;
  if (k === 2) return j;
  const clampedLat = Math.max(-65.5, Math.min(65.5, lat));
  for (let i = 0; i < 6; i++) {
    const d = sunpos(j)[1] * R;
    const c = (S(-0.8333 * R) - S(clampedLat * R) * S(d)) / (C(clampedLat * R) * C(d));
    const H = Math.acos(Math.max(-1, Math.min(1, c))) / R;
    j -= w(lha(j) - (k ? H : -H)) / 360.98564736629;
  }
  return j;
}

export function dayInfo(J: number, lat: number, lon: number, tz: number): { sr: number; ss: number; sn: number; wd: number } {
  const ld = new Date((J - 2440587.5) * 864e5 + tz * 36e5);
  const mid = Date.UTC(ld.getUTCFullYear(), ld.getUTCMonth(), ld.getUTCDate()) / 864e5 + 2440587.5;
  let j0 = mid + 0.5 - lon / 360;
  let sr = sunEv(j0, lat, lon, 0);
  if (J < sr) {
    j0 -= 1;
    sr = sunEv(j0, lat, lon, 0);
  }
  return { sr, ss: sunEv(j0, lat, lon, 1), sn: sunEv(j0 + 1, lat, lon, 0), wd: (Math.floor(j0 + 1.5) % 7 + 7) % 7 };
}

export function getMoonriseMoonset(jd: number, lat: number, lon: number, tz: number): { type: 'rise' | 'set'; jd: number; localTime: string }[] {
  const localMid = Math.floor(jd + tz / 24 + 0.5) - 0.5 - tz / 24;
  const eps = (23.439291 - 0.0130042 * ((jd - 2451545) / 36525)) * R;
  const coords = (j: number) => {
    const T = (j - 2451545) / 36525;
    const lam = rawTropical(j)[1] * R;
    const beta = moonLatitude(T) * R;
    const ra = Math.atan2(S(lam) * C(eps) - Math.tan(beta) * S(eps), C(lam));
    const dec = Math.asin(S(beta) * C(eps) + C(beta) * S(eps) * S(lam));
    return { ra, dec };
  };
  const alt = (j: number) => {
    const c = coords(j);
    const T = (j - 2451545) / 36525;
    const gmst = N(280.46061837 + 360.98564736629 * (j - 2451545) + 0.000387933 * T * T - (T * T * T) / 38710000) * R;
    const H = gmst + lon * R - c.ra;
    const phi = Math.max(-65.5, Math.min(65.5, lat)) * R;
    return Math.asin(S(phi) * S(c.dec) + C(phi) * C(c.dec) * C(H)) / R;
  };
  const threshold = -0.13;
  const step = 1 / 48;
  const events: { type: 'rise' | 'set'; jd: number; localTime: string }[] = [];
  let t0 = localMid;
  let a0 = alt(t0) - threshold;
  for (let i = 1; i <= 48; i++) {
    const t1 = localMid + i * step;
    const a1 = alt(t1) - threshold;
    if ((a0 < 0 && a1 >= 0) || (a0 >= 0 && a1 < 0)) {
      let lo = t0;
      let hi = t1;
      const rising = a0 < 0;
      for (let k = 0; k < 18; k++) {
        const mid = (lo + hi) / 2;
        const v = alt(mid) - threshold;
        if ((v < 0) === rising) lo = mid;
        else hi = mid;
      }
      const evJd = (lo + hi) / 2;
      events.push({
        type: rising ? 'rise' : 'set',
        jd: evJd,
        localTime: new Date((evJd - 2440587.5) * 864e5 + tz * 36e5).toISOString().slice(11, 16),
      });
    }
    t0 = t1;
    a0 = a1;
  }
  return events;
}

// Vimshottari lord sequence for KP star/sub/sub-sub calculation
export const KO: PlanetId[] = [7, 8, 0, 1, 2, 3, 4, 5, 6];
export const YR: Record<PlanetId, number> = { 7: 7, 8: 20, 0: 6, 1: 10, 2: 7, 3: 18, 4: 16, 5: 19, 6: 17 };

export function kpSub(lon: number): [PlanetId, PlanetId, PlanetId] {
  const s = Math.floor(N(lon) / (40 / 3));
  const lord = KO[s % 9];
  let r = N(lon) - s * (40 / 3);
  const i = KO.indexOf(lord);
  let q = lord;
  for (let k = 0; k < 9; k++) {
    q = KO[(i + k) % 9];
    const w = ((40 / 3) * YR[q]) / 120;
    if (r < w || k === 8) break;
    r -= w;
  }
  const w = ((40 / 3) * YR[q]) / 120;
  const j = KO.indexOf(q);
  let z = q;
  for (let k = 0; k < 9; k++) {
    z = KO[(j + k) % 9];
    const u = (w * YR[z]) / 120;
    if (r < u || k === 8) break;
    r -= u;
  }
  return [lord, q, z];
}

export function formatDms(deg: number): string {
  const d = Math.floor(deg);
  const mf = (deg - d) * 60;
  const m = Math.floor(mf);
  const s = Math.round((mf - m) * 60);
  if (s === 60) return `${d}°${String(m + 1).padStart(2, '0')}'00"`;
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}

export function formatDm(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}'`;
}

export function jdToLocalString(jd: number, tz: number): string {
  const dt = new Date((jd - 2440587.5) * 864e5 + tz * 36e5);
  return dt.toISOString().slice(0, 16).replace('T', ' ');
}

export function jdToLocalTime(jd: number, tz: number): string {
  const dt = new Date((jd - 2440587.5) * 864e5 + tz * 36e5);
  return dt.toISOString().slice(11, 16);
}

export function jdToLocalDate(jd: number, tz: number): string {
  const dt = new Date((jd - 2440587.5) * 864e5 + tz * 36e5);
  return dt.toISOString().slice(0, 10);
}

export { AYN, CITIES };
