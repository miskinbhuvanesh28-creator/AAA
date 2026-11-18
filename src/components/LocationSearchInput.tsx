import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { CITIES } from '../engine/data/coreData.ts';
import type { Language } from '../engine/types.ts';

export interface LocationOption {
  place: string;
  fullDisplayName?: string;
  lat: number;
  lon: number;
  tz: number;
  timezoneId?: string;
  source?: 'nominatim' | 'local';
}

interface LocationSearchInputProps {
  value?: string;
  placeholder?: string;
  lang: Language;
  onSelect: (loc: LocationOption) => void;
  compact?: boolean;
  label?: string;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  value = '',
  placeholder,
  lang,
  onSelect,
  compact = false,
  label,
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [remoteResults, setRemoteResults] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const localMatches = useMemo<LocationOption[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CITIES.filter(
      (c) => c[0].toLowerCase().includes(q) || c[1].toLowerCase().includes(q),
    )
      .slice(0, 6)
      .map((c) => ({
        place: `${c[0]}, ${c[1]}`,
        lat: c[2],
        lon: c[3],
        tz: c[4],
        timezoneId: c[4] === 5.5 ? 'Asia/Kolkata' : `UTC${c[4] >= 0 ? '+' : ''}${c[4]}`,
        source: 'local',
      }));
  }, [query]);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setRemoteResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { results?: LocationOption[] };
        if (Array.isArray(data.results)) {
          setRemoteResults(data.results);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setRemoteResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, open]);

  const mergedOptions = useMemo<LocationOption[]>(() => {
    const seen = new Set<string>();
    const out: LocationOption[] = [];
    for (const r of [...remoteResults, ...localMatches]) {
      const k = `${r.place.toLowerCase().slice(0, 24)}:${r.lat.toFixed(2)}:${r.lon.toFixed(2)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }
    return out.slice(0, 10);
  }, [remoteResults, localMatches]);

  useEffect(() => {
    setHighlight(0);
  }, [mergedOptions.length, query]);

  const pick = (loc: LocationOption) => {
    setQuery(loc.place);
    setOpen(false);
    onSelect(loc);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!mergedOptions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % mergedOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + mergedOptions.length) % mergedOptions.length);
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      const target = mergedOptions[highlight] || mergedOptions[0];
      if (target) pick(target);
    }
  };

  const defaultPlaceholder =
    lang === 'te'
      ? 'నగరం / గ్రామం వెతకండి (ఉదా. Vijayawada, Tirupati, London…)'
      : lang === 'hi'
        ? 'शहर या गाँव खोजें…'
        : 'Search any city or town worldwide (Nominatim)…';

  return (
    <div className="relative">
      {label && (
        <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1 text-xs">
          {label}
        </span>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          className={`w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-7 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 ${
            compact ? 'py-1' : 'py-1.5'
          }`}
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery('');
              setRemoteResults([]);
              setOpen(true);
            }}
            aria-label="Clear location search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (query.trim().length >= 2 || mergedOptions.length > 0) && (
        <div className="absolute left-0 right-0 mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loading && mergedOptions.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-500">
              {lang === 'te' ? 'OpenStreetMap లో వెతుకుతోంది…' : 'Searching OpenStreetMap Nominatim…'}
            </div>
          ) : mergedOptions.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-500">
              {lang === 'te'
                ? 'సరిపోయే ప్రదేశాలు కనబడలేదు. ఇతర పేరు ప్రయత్నించండి.'
                : 'No matching locations found. Try another town/city name.'}
            </div>
          ) : (
            mergedOptions.map((opt, idx) => (
              <button
                key={`${opt.place}-${opt.lat}-${opt.lon}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(opt);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors ${
                  idx === highlight
                    ? 'bg-amber-50 dark:bg-amber-950/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="min-w-0 flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {opt.place}
                    </div>
                    {opt.fullDisplayName && opt.fullDisplayName !== opt.place && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[260px]">
                        {opt.fullDisplayName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                  <div>
                    {opt.lat.toFixed(3)}, {opt.lon.toFixed(3)}
                  </div>
                  <div>
                    UTC{opt.tz >= 0 ? '+' : ''}
                    {opt.tz} · {opt.source === 'nominatim' ? 'OSM' : lang === 'te' ? 'ప్రధాన' : 'Preset'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
