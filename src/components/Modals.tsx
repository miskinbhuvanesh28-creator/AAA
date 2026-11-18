import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { tr } from '../engine/i18n.ts';
import type { BirthProfile } from '../engine/types.ts';
import { LocationSearchInput } from './LocationSearchInput.tsx';

export const ProfileModal: React.FC = () => {
  const { lang, profileModal, closeProfileModal, saveProfile, refreshProfiles } = useApp();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [dateStr, setDateStr] = useState('1990-05-14');
  const [timeStr, setTimeStr] = useState('06:42:00');
  const [place, setPlace] = useState('Hyderabad, Telangana');
  const [lat, setLat] = useState(17.385);
  const [lon, setLon] = useState(78.4867);
  const [tz, setTz] = useState(5.5);
  const [timezoneId, setTimezoneId] = useState('Asia/Kolkata');
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');
  const [importJson, setImportJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!profileModal.open) return;
    setErr('');
    if (profileModal.mode === 'edit' && profileModal.target) {
      const p = profileModal.target;
      setName(p.name);
      setGender(p.gender || 'male');
      setDateStr(`${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`);
      setTimeStr(`${String(p.hh).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}:${String(p.ss ?? 0).padStart(2, '0')}`);
      setPlace(p.place);
      setLat(p.lat);
      setLon(p.lon);
      setTz(p.tz);
      setTimezoneId(p.timezoneId || 'Asia/Kolkata');
      setBirthTimeKnown(p.birthTimeKnown !== false);
      setIsDefault(Boolean(p.isDefault));
      setNotes(p.notes || '');
    } else {
      setName('');
      setGender('male');
      setDateStr('1992-01-15');
      setTimeStr('08:30:00');
      setPlace('Hyderabad, Telangana');
      setLat(17.385);
      setLon(78.4867);
      setTz(5.5);
      setTimezoneId('Asia/Kolkata');
      setBirthTimeKnown(true);
      setIsDefault(false);
      setNotes('');
    }
  }, [profileModal]);

  if (!profileModal.open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      if (profileModal.mode === 'import') {
        const parsed = JSON.parse(importJson) as unknown;
        const res = await fetch('/api/profiles/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });
        if (!res.ok) throw new Error('Import JSON failed');
        await refreshProfiles();
        closeProfileModal();
        return;
      }

      const [y, m, d] = dateStr.split('-').map(Number);
      const [hh, mi, ss = 0] = timeStr.split(':').map(Number);
      if (!name.trim() || !y || !m || !d) {
        setErr('Name and valid birth date are required.');
        setSaving(false);
        return;
      }
      const payload: Partial<BirthProfile> = {
        name: name.trim(),
        gender,
        y,
        m,
        d,
        hh: birthTimeKnown ? hh || 0 : 12,
        mi: birthTimeKnown ? mi || 0 : 0,
        ss: birthTimeKnown ? ss || 0 : 0,
        lat: Number(lat),
        lon: Number(lon),
        tz: Number(tz),
        place: place.trim() || 'Hyderabad',
        timezoneId,
        birthTimeKnown,
        isDefault,
        notes,
      };
      const saved = await saveProfile(payload, profileModal.mode === 'edit' ? profileModal.target?.id : undefined);
      if (!saved) throw new Error('Failed to save profile');
      closeProfileModal();
    } catch (error) {
      setErr((error as Error).message || 'Could not save birth profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {profileModal.mode === 'edit'
              ? lang === 'te' ? 'జన్మ ప్రొఫైల్ సవరణ' : 'Edit Birth Profile'
              : profileModal.mode === 'import'
                ? lang === 'te' ? 'ప్రొఫైల్స్ దిగుమతి (JSON)' : 'Import Birth Profiles (JSON)'
                : lang === 'te' ? 'కొత్త జన్మ ప్రొఫైల్' : 'New Birth Profile'}
          </h2>
          <button
            type="button"
            onClick={closeProfileModal}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[82vh] overflow-y-auto">
          {err && (
            <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
              {err}
            </div>
          )}

          {profileModal.mode === 'import' ? (
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'te' ? 'JSON ప్రొఫైల్ ఆబ్జెక్ట్ లేదా జాబితా పేస్ట్ చేయండి' : 'Paste JSON Profile Object or Array'}
              </label>
              <textarea
                rows={8}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{"name":"Sita Devi","y":1995,"m":4,"d":12,"hh":9,"mi":15,"lat":17.385,"lon":78.4867,"tz":5.5,"place":"Hyderabad"}'
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 font-mono text-xs"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="sm:col-span-2 block">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {lang === 'te' ? 'పూర్తి పేరు' : 'Full Name'}
                  </span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'te' ? 'ఉదా. శ్రీ రామ రావు' : 'e.g. Sri Rama Rao'}
                    className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {lang === 'te' ? 'లింగం' : 'Gender'}
                  </span>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                    className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
                  >
                    <option value="male">{lang === 'te' ? 'పురుషుడు' : 'Male'}</option>
                    <option value="female">{lang === 'te' ? 'స్త్రీ' : 'Female'}</option>
                    <option value="other">{lang === 'te' ? 'ఇతరులు' : 'Other'}</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{tr(lang, 'birthDate')}</span>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {tr(lang, 'birthTime')} (HH:MM:SS)
                  </span>
                  <input
                    type="time"
                    step="1"
                    disabled={!birthTimeKnown}
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 tabular-nums disabled:opacity-50"
                  />
                </label>
              </div>

              <LocationSearchInput
                lang={lang}
                label={lang === 'te' ? 'జన్మ స్థలం వెతకండి (OpenStreetMap & ప్రధాన నగరాలు)' : 'Search Any Birthplace Worldwide (Nominatim OSM)'}
                value={place}
                onSelect={(loc) => {
                  setPlace(loc.place);
                  setLat(loc.lat);
                  setLon(loc.lon);
                  setTz(loc.tz);
                  if (loc.timezoneId) setTimezoneId(loc.timezoneId);
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <label className="sm:col-span-2 block">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{tr(lang, 'birthPlace')}</span>
                  <input
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {lang === 'te' ? 'అక్షాంశం (Lat)' : 'Latitude'}
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {lang === 'te' ? 'రేఖాంశం (Lon)' : 'Longitude'}
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lon}
                    onChange={(e) => setLon(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 tabular-nums"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <label className="block">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {lang === 'te' ? 'UTC టైమ్‌జోన్ (గం.)' : 'UTC Offset (Hours)'}
                  </span>
                  <input
                    type="number"
                    step="0.25"
                    value={tz}
                    onChange={(e) => setTz(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 tabular-nums"
                  />
                </label>
                <div className="space-y-1.5 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={birthTimeKnown}
                      onChange={(e) => setBirthTimeKnown(e.target.checked)}
                    />
                    <span>
                      {lang === 'te'
                        ? 'ఖచ్చిత జన్మ సమయం తెలుసు (లేనిచో మధ్యాహ్న సూర్య లగ్నం)'
                        : 'Exact birth time known (uses 12:00 Surya Lagna if unchecked)'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                    <span>{lang === 'te' ? 'ప్రధాన జాతకంగా ఉంచు' : 'Set as default workspace profile'}</span>
                  </label>
                </div>
              </div>

              <label className="block">
                <span className="font-medium text-slate-700 dark:text-slate-300">{tr(lang, 'notes')}</span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
                />
              </label>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={closeProfileModal}
              className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              {tr(lang, 'cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {saving
                ? lang === 'te' ? 'సేవ్ అవుతోంది…' : 'Saving…'
                : profileModal.mode === 'import'
                  ? tr(lang, 'importJson')
                  : tr(lang, 'save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AuthModal: React.FC = () => {
  const { lang, authModalOpen, setAuthModalOpen, user, refreshAuth } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@astrojyotish.pro');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!authModalOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { email, name, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      await refreshAuth();
      setAuthModalOpen(false);
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const switchDemo = async (role: 'admin' | 'user') => {
    setBusy(true);
    await fetch('/api/auth/switch-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    await refreshAuth();
    setBusy(false);
    setAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {lang === 'te' ? 'ఖాతా & హోదా ప్రవేశం' : 'Account & Role Access'}
          </h2>
          <button type="button" onClick={() => setAuthModalOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {user && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                <div className="text-slate-500">
                  {user.email} · {user.role} · {user.planId}
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  await refreshAuth();
                  setAuthModalOpen(false);
                }}
                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {lang === 'te' ? 'సెషన్ రీసెట్' : 'Reset Session'}
              </button>
            </div>
          )}

          <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 rounded-md font-medium ${
                mode === 'login' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              }`}
            >
              {tr(lang, 'signIn')}
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 rounded-md font-medium ${
                mode === 'register' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              }`}
            >
              {tr(lang, 'register')}
            </button>
          </div>

          {err && (
            <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <label className="block">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {lang === 'te' ? 'ప్రదర్శన పేరు' : 'Display Name'}
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
                />
              </label>
            )}
            <label className="block">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {lang === 'te' ? 'ఇమెయిల్' : 'Email'}
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
              />
            </label>
            <label className="block">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {lang === 'te' ? 'పాస్‌వర్డ్' : 'Password'}
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {busy
                ? lang === 'te' ? 'పని చేస్తోంది…' : 'Working…'
                : mode === 'login' ? tr(lang, 'signIn') : tr(lang, 'register')}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-[11px] text-slate-500">
              {lang === 'te' ? 'త్వరిత హోదా మార్పు' : 'Quick Workspace Role Switch'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void switchDemo('admin')}
                className="py-1.5 px-2.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              >
                {lang === 'te' ? 'అడ్మిన్ కార్యక్షేత్రం' : 'Admin Workspace'}
              </button>
              <button
                type="button"
                onClick={() => void switchDemo('user')}
                className="py-1.5 px-2.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              >
                {lang === 'te' ? 'సాధారణ వినియోగదారు' : 'Standard User'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
