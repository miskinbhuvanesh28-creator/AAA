import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Download, Plus, Printer, Save, Send, Trash2 } from 'lucide-react';
import { useApp, type ThemeMode } from '../context/AppContext.tsx';
import { NAK_NAMES, pName, sName } from '../engine/constants.ts';
import { AYN } from '../engine/data/coreData.ts';
import { findActiveVimshottari } from '../engine/dasha.ts';
import { formatDms } from '../engine/ephemeris.ts';
import { tr } from '../engine/i18n.ts';
import { GLOSSARY_TERMS } from '../engine/knowledge.ts';
import {
  REPORT_TYPES,
  generateStructuredReport,
  renderReportHtml,
  type GeneratedReportDocument,
  type ReportDepth,
} from '../engine/reports.ts';
import type { ChartStyle, HouseSystem, Language, NodeType, PlanetId } from '../engine/types.ts';

function tx(lang: Language, te: string, en: string, hi?: string): string {
  if (lang === 'te') return te;
  if (lang === 'hi' && hi) return hi;
  return en;
}

export const AiAstrologerPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { activeProfile, chart, lang } = useApp();
  const isTe = lang === 'te';
  const [conversations, setConversations] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { id?: string; role: 'user' | 'assistant'; content: string; model?: string; tokens_used?: number }[]
  >([]);
  const [promptInput, setPromptInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusInfo, setStatusInfo] = useState<{ configured: boolean; model: string } | null>(null);

  const chartContextSummary = useMemo(() => {
    const activeDasha = findActiveVimshottari(chart.p[1], chart.t0);
    const activeYogas = chart.yogas.filter((y) => y.on && y.category !== 'dosha').map((y) => y.nEn).join(', ');
    const doshas = chart.yogas.filter((y) => y.on && y.category === 'dosha').map((y) => y.nEn).join(', ');
    const planets = chart.rows
      .map(
        (r) =>
          `${pName(r.id, 'en')}: ${sName(r.sign, 'en')} ${formatDms(r.degInSign)} (H${r.house}, ${NAK_NAMES.en[r.nk]} P${r.pada}, Sub=${pName(r.sub[1], 'en')}${r.retro ? ', Retro' : ''}${r.combust ? ', Combust' : ''})`,
      )
      .join(' | ');
    return [
      `Native: ${activeProfile.name} (${activeProfile.y}-${activeProfile.m}-${activeProfile.d} ${activeProfile.hh}:${activeProfile.mi}, ${activeProfile.place})`,
      `Lagna: ${sName(chart.lagS, 'en')} ${formatDms(chart.lag % 30)}`,
      `Moon Rashi: ${sName(chart.s[1], 'en')} · Nakshatra: ${NAK_NAMES.en[chart.pan.nk]} P${chart.rows[1].pada}`,
      `Vimshottari Active: ${pName(activeDasha.maha.lord as PlanetId, 'en')} MD / ${pName(activeDasha.antar.lord as PlanetId, 'en')} AD / ${pName(activeDasha.pratyantar.lord as PlanetId, 'en')} PD`,
      `Planets: ${planets}`,
      `Active Yogas: ${activeYogas || 'None'}`,
      `Active Doshas: ${doshas || 'None'}`,
      `Karakas: ${chart.karakas.map((k) => `${k.roleEn}=${pName(k.planet, 'en')}`).join(', ')}`,
    ].join('\n');
  }, [activeProfile, chart]);

  const loadConversations = async () => {
    const [stRes, listRes] = await Promise.all([fetch('/api/gemini/status'), fetch('/api/gemini/conversations')]);
    if (stRes.ok) setStatusInfo((await stRes.json()) as { configured: boolean; model: string });
    if (listRes.ok) {
      const data = (await listRes.json()) as { conversations: typeof conversations };
      setConversations(data.conversations || []);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    const presetPromptsEn: Record<string, string> = {
      'prompt-chart': 'Analyze my overall birth chart, Lagna strength, and primary life themes.',
      'prompt-dasha': 'Explain what my current Mahadasha and Antardasha signify for upcoming milestones.',
      'prompt-career': 'Evaluate my 10th house, Dashamsha, and Amatyakaraka for career progression.',
      'prompt-marriage': 'Analyze my 7th house, Navamsha, Upapada, and relationship timing.',
      'prompt-finance': 'Inspect Dhana Yogas, 2nd/11th lords, and wealth potential in this chart.',
      'prompt-transit': 'How do current Saturn and Jupiter transits interact with my natal Moon and Lagna?',
      'prompt-kp': 'Use my KP Cusp Sub-Lords to evaluate career and marriage promises.',
      'prompt-jaimini': 'Analyze my Atmakaraka, Karakamsha, and Arudha Lagna using Jaimini principles.',
      'prompt-numerology': 'Synthesize my birth date numerology alongside planetary rulers.',
      'prompt-dharma': 'Share relevant philosophical guidance from the Bhagavad Gita and Upanishads for my path.',
      'prompt-report': 'Write a structured executive astrology summary based on my active chart.',
    };
    const presetPromptsTe: Record<string, string> = {
      'prompt-chart': 'నా జన్మ కుండలిలోని లగ్న బలం, చంద్ర స్థితి మరియు ప్రధాన జీవిత అంశాలను విశ్లేషించండి.',
      'prompt-dasha': 'ప్రస్తుతం నడుస్తున్న మహాదశ మరియు అంతర్దశ రాబోయే కాలానికి ఎలాంటి ఫలితాలు ఇస్తాయో వివరించండి.',
      'prompt-career': 'నా 10వ భావం, D10 దశాంశ మరియు అమాత్యకారకుడి ఆధారంగా వృత్తి పురోగతిని అంచనా వేయండి.',
      'prompt-marriage': '7వ భావం, D9 నవాంశ మరియు ఉపపద లగ్నం ప్రకారం వివాహ & దాంపత్య ఫలితాలు వివరించండి.',
      'prompt-finance': 'ధన యోగాలు, 2వ/11వ భావాధిపతులు మరియు ఆర్థిక స్థిరత్వాన్ని విశ్లేషించండి.',
      'prompt-transit': 'ప్రస్తుత శని మరియు గురు గోచారాలు నా జన్మ రాశి & లగ్నంతో ఎలా పనిచేస్తున్నాయి?',
      'prompt-kp': 'నా KP కస్ప్ సబ్-లార్డ్‌ల ఆధారంగా వృత్తి మరియు వివాహ ఫలితాలను వివరించండి.',
      'prompt-jaimini': 'జైమినీ సూత్రాల ప్రకారం నా ఆత్మకారక, కారకాంశ మరియు ఆరూఢ లగ్నాన్ని విశ్లేషించండి.',
      'prompt-numerology': 'నా జన్మ తేదీ సంఖ్యాశాస్త్రం మరియు గ్రహాధిపతుల సమన్వయాన్ని వివరించండి.',
      'prompt-dharma': 'నా మార్గానికి అనుగుణంగా భగవద్గీత మరియు ఉపనిషత్తుల నుండి ధార్మిక మార్గదర్శనం అందించండి.',
      'prompt-report': 'నా ప్రస్తుత జాతక చక్రం ఆధారంగా సంక్షిప్త సమగ్ర నివేదికను తయారుచేయండి.',
    };
    if (subTab === 'new') {
      setActiveConvId(null);
      setMessages([]);
    } else if (presetPromptsEn[subTab]) {
      setPromptInput(isTe ? presetPromptsTe[subTab] : presetPromptsEn[subTab]);
    }
  }, [subTab, isTe]);

  const openConversation = async (id: string) => {
    setActiveConvId(id);
    setErrorMsg('');
    const res = await fetch(`/api/gemini/conversations/${id}`);
    if (res.ok) {
      const d = (await res.json()) as { messages: typeof messages };
      setMessages(d.messages || []);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = promptInput.trim();
    if (!q || sending) return;
    setErrorMsg('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setPromptInput('');

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId || undefined,
          profileId: activeProfile.id,
          message: q,
          chartContextSummary,
          language: lang,
          focusTopic: subTab,
        }),
      });
      const data = (await res.json()) as {
        conversationId?: string;
        reply?: string;
        model?: string;
        tokensUsed?: number;
        error?: string;
      };
      if (!res.ok) {
        if (data.conversationId) setActiveConvId(data.conversationId);
        throw new Error(data.error || tx(lang, 'Gemini AI అభ్యర్థన విఫలమైంది.', 'Gemini AI request failed.'));
      }
      if (data.conversationId) setActiveConvId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || '', model: data.model, tokens_used: data.tokensUsed },
      ]);
      void loadConversations();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Saved Threads Rail */}
      <div className="lg:col-span-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{tx(lang, 'సేవ్ చేసిన సంభాషణలు', 'Saved Conversations')}</h2>
          <button
            type="button"
            onClick={() => {
              setActiveConvId(null);
              setMessages([]);
              setErrorMsg('');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 text-white font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{tx(lang, 'కొత్తది', 'New')}</span>
          </button>
        </div>

        {statusInfo && !statusInfo.configured && (
          <div className="p-2.5 rounded border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
            {tx(
              lang,
              'AI సమాధానాల కోసం Settings > Secrets లో GEMINI_API_KEY అవసరం. స్థానిక జ్యోతిష గణనలు యథాతథంగా పనిచేస్తాయి.',
              'AI responses require GEMINI_API_KEY in Settings > Secrets. Local chart calculations remain active.',
            )}
          </div>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="py-3 text-slate-500">{tx(lang, 'ఇంకా సంభాషణలు లేవు.', 'No saved conversations yet.')}</p>
          ) : (
            conversations.map((c) => (
              <div key={c.id} className="py-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => void openConversation(c.id)}
                  className={`flex-1 text-left truncate ${
                    activeConvId === c.id ? 'text-amber-700 dark:text-amber-300 font-semibold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {c.title}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/gemini/conversations/${c.id}`, { method: 'DELETE' });
                    if (activeConvId === c.id) {
                      setActiveConvId(null);
                      setMessages([]);
                    }
                    void loadConversations();
                  }}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <details className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-300">
            {tx(lang, 'జతచేసిన జాతక వివరాలు', 'Attached Chart Context')} ({activeProfile.name})
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-950 p-2 rounded">
            {chartContextSummary}
          </pre>
        </details>
      </div>

      {/* Chat Viewport */}
      <div className="lg:col-span-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col min-h-[520px]">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 text-xs">
          {[
            [
              tx(lang, 'కుండలి సారాంశం', 'Chart Overview'),
              isTe
                ? 'ఈ జన్మ కుండలిలోని లగ్నం, చంద్ర రాశి మరియు ముఖ్య యోగాలను విశ్లేషించండి.'
                : 'Analyze my Lagna, Moon sign, and dominant Yogas in this birth chart.',
            ],
            [
              tx(lang, 'ప్రస్తుత దశ', 'Active Dasha'),
              isTe
                ? 'నా ప్రస్తుత వింశోత్తరి మహాదశ మరియు అంతర్దశ ఫలితాలను వివరించండి.'
                : 'Interpret my current Vimshottari Mahadasha and Antardasha effects.',
            ],
            [
              tx(lang, 'వృత్తి & ధనం', 'Career & Finance'),
              isTe
                ? 'వృత్తి అభివృద్ధి కోసం 10వ భావం, D10 దశాంశ మరియు ధన యోగాలను అంచనా వేయండి.'
                : 'Assess my 10th house, D10 Dashamsha, and Dhana Yogas for career growth.',
            ],
            [
              tx(lang, 'వివాహం & నవాంశ', 'Marriage & Synastry'),
              isTe
                ? '7వ భావం, నవాంశ D9 మరియు వివాహ సమయాన్ని విశ్లేషించండి.'
                : 'Analyze my 7th house, Navamsha D9, and relationship timing.',
            ],
            [
              tx(lang, 'KP సబ్-లార్డులు', 'KP Significators'),
              isTe
                ? 'నా KP కస్ప్ సబ్-లార్డుల ద్వారా కనిపించే ముఖ్య ఫలితాలను సంగ్రహించండి.'
                : 'Summarize key promises visible through my KP Cusp Sub-Lords.',
            ],
          ].map(([label, q]) => (
            <button
              key={label}
              type="button"
              onClick={() => setPromptInput(q)}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-600 dark:text-slate-300"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[440px] text-xs">
          {messages.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              {tx(
                lang,
                `${activeProfile.name} గారి జాతకం ఆధారంగా ఏ ప్రశ్ననైనా అడగండి.`,
                `Ask any question grounded in ${activeProfile.name}'s calculated horoscope.`,
              )}
            </div>
          )}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg max-w-[90%] whitespace-pre-wrap leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-amber-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              {m.content}
              {m.tokens_used ? (
                <div className="mt-1.5 text-[10px] opacity-60 font-mono">
                  {m.model} · {m.tokens_used} tokens
                </div>
              ) : null}
            </div>
          ))}
          {errorMsg && (
            <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={tx(
              lang,
              'దశ, KP, జైమినీ, వృత్తి, వివాహం లేదా సనాతన ధర్మంపై ప్రశ్న అడగండి…',
              'Ask about Dasha, KP, Jaimini, Career, Marriage, or Sanatana Dharma…',
            )}
            className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs focus:outline-none focus:border-amber-600"
          />
          <button
            type="submit"
            disabled={sending || !promptInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{sending ? tx(lang, 'విశ్లేషిస్తోంది…', 'Analyzing…') : tx(lang, 'అడగండి', 'Ask AI')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export const ReportsPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { activeProfile, chart, lang, selectedReportType, setSelectedReportType, refreshReports } = useApp();
  const isTe = lang === 'te';
  const defaultType = isTe ? 'telugu-jathakam' : 'complete-horoscope';
  const initialType = selectedReportType || (subTab.startsWith('type:') ? subTab.replace('type:', '') : defaultType);
  const [reportType, setReportType] = useState(initialType);
  const [depth, setDepth] = useState<ReportDepth>('detailed');
  const [doc, setDoc] = useState<GeneratedReportDocument>(() =>
    generateStructuredReport(initialType, activeProfile, chart, 'detailed', lang),
  );
  const [savedList, setSavedList] = useState<{ id: string; title: string; depth: string; updated_at: string }[]>([]);
  const [loadedReportId, setLoadedReportId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (selectedReportType) {
      if (savedList.some((sr) => sr.id === selectedReportType)) {
        void fetch(`/api/reports/${selectedReportType}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { report?: { id: string; report_type?: string; content: GeneratedReportDocument } } | null) => {
            if (d?.report?.content) {
              setDoc(d.report.content);
              setLoadedReportId(d.report.id);
              if (d.report.report_type) setReportType(d.report.report_type);
            }
          });
      } else if (REPORT_TYPES.some((r) => r.id === selectedReportType)) {
        setReportType(selectedReportType);
        setDoc(generateStructuredReport(selectedReportType, activeProfile, chart, depth, lang));
        setLoadedReportId(null);
      }
      setSelectedReportType(null);
    }
  }, [selectedReportType, savedList, activeProfile, chart, depth, lang, setSelectedReportType]);

  useEffect(() => {
    if (subTab.startsWith('type:')) {
      const nextT = subTab.replace('type:', '');
      setReportType(nextT);
      setDoc(generateStructuredReport(nextT, activeProfile, chart, depth, lang));
      setLoadedReportId(null);
    }
  }, [subTab, activeProfile, chart, depth, lang]);

  const loadSaved = async () => {
    const res = await fetch('/api/reports');
    if (res.ok) {
      const d = (await res.json()) as { reports: typeof savedList };
      setSavedList(d.reports || []);
    }
  };

  useEffect(() => {
    void loadSaved();
  }, []);

  const regenerate = (t = reportType, dp = depth) => {
    setDoc(generateStructuredReport(t, activeProfile, chart, dp, lang));
    setLoadedReportId(null);
    setSaveMsg('');
  };

  const saveReport = async () => {
    const method = loadedReportId ? 'PUT' : 'POST';
    const url = loadedReportId ? `/api/reports/${loadedReportId}` : '/api/reports';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: activeProfile.id,
        reportType: doc.reportType,
        title: doc.title,
        depth: doc.depth,
        language: doc.language,
        content: doc,
      }),
    });
    if (res.ok) {
      const d = (await res.json()) as { id?: string; version?: number };
      if (d.id) setLoadedReportId(d.id);
      setSaveMsg(
        d.version
          ? tx(lang, `సవరణ v${d.version} సేవ్ అయింది`, `Saved revision v${d.version}`)
          : tx(lang, 'నివేదిక ఆర్కైవ్‌లో సేవ్ అయింది', 'Saved to report archive'),
      );
      await Promise.all([loadSaved(), refreshReports()]);
    }
  };

  const downloadHtml = () => {
    const html = renderReportHtml(doc);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.reportType}-${activeProfile.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.reportType}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Generator Toolbar */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              regenerate(e.target.value, depth);
            }}
            className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 font-medium"
          >
            {REPORT_TYPES.map((r) => (
              <option key={r.id} value={r.id}>
                {isTe ? r.titleTe : r.titleEn}
              </option>
            ))}
          </select>

          <select
            value={depth}
            onChange={(e) => {
              const dp = e.target.value as ReportDepth;
              setDepth(dp);
              regenerate(reportType, dp);
            }}
            className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
          >
            <option value="quick">{tx(lang, 'సంక్షిప్త సారాంశం', 'Quick Summary')}</option>
            <option value="detailed">{tx(lang, 'సమగ్ర నివేదిక', 'Detailed Professional')}</option>
            <option value="research">{tx(lang, 'పరిశోధన స్థాయి (23 వర్గాలు సహా)', 'Research (Incl. 23 Vargas)')}</option>
          </select>

          {saveMsg && <span className="text-emerald-700 dark:text-emerald-400 font-medium">{saveMsg}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void saveReport()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 text-white font-medium hover:bg-amber-700"
          >
            <Save className="h-3.5 w-3.5" />
            <span>
              {loadedReportId ? tx(lang, 'కొత్త వెర్షన్ సేవ్', 'Save Version') : tx(lang, 'నివేదిక సేవ్ చేయి', 'Save Report')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{tr(lang, 'printPdf')}</span>
          </button>
          <button
            type="button"
            onClick={downloadHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>HTML</span>
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span>JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Saved Reports List */}
        <div className="lg:col-span-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 text-xs print:hidden">
          <h3 className="text-sm font-semibold">
            {tx(lang, 'సేవ్ చేసిన నివేదికలు', 'Saved Reports')} ({savedList.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {savedList.length === 0 ? (
              <p className="py-3 text-slate-500">
                {tx(lang, 'నివేదికను సేవ్ చేయడానికి పై బటన్ నొక్కండి.', 'Click Save Report to archive & version reports.')}
              </p>
            ) : (
              savedList.map((sr) => (
                <div key={sr.id} className="py-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch(`/api/reports/${sr.id}`);
                      if (res.ok) {
                        const d = (await res.json()) as { report: { id: string; content: GeneratedReportDocument } };
                        setDoc(d.report.content);
                        setLoadedReportId(d.report.id);
                      }
                    }}
                    className="text-left flex-1 truncate hover:text-amber-700 dark:hover:text-amber-300 font-medium"
                  >
                    {sr.title}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/reports/${sr.id}`, { method: 'DELETE' });
                      await Promise.all([loadSaved(), refreshReports()]);
                    }}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editable A4 Document Sheet */}
        <div className="lg:col-span-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 print:border-0 print:p-0">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <input
              value={doc.title}
              onChange={(e) => setDoc({ ...doc, title: e.target.value })}
              className="w-full text-xl font-semibold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
            />
            <div className="mt-1 text-xs text-slate-500">
              {doc.profileName} · {tx(lang, 'స్థాయి:', 'Depth:')} {doc.depth.toUpperCase()} ·{' '}
              {doc.generatedAt.slice(0, 16).replace('T', ' ')}
            </div>
          </div>

          {doc.sections.map((sec, idx) => (
            <section key={sec.id} className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">{sec.heading}</h2>
              <textarea
                rows={2}
                value={sec.summary}
                onChange={(e) => {
                  const next = [...doc.sections];
                  next[idx] = { ...sec, summary: e.target.value };
                  setDoc({ ...doc, sections: next });
                }}
                className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded p-1 focus:outline-none focus:border-amber-500"
              />
              {sec.table && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                      <tr>
                        {sec.table.headers.map((h) => (
                          <th key={h} className="px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-800">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                      {sec.table.rows.map((r, rIdx) => (
                        <tr key={rIdx}>
                          {r.map((cell, cIdx) => (
                            <td key={cIdx} className="px-2.5 py-1.5">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export const KnowledgeLibraryPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const { knowledgeArticles, bookmarks, toggleBookmark, lang } = useApp();
  const isTe = lang === 'te';
  const [search, setSearch] = useState(subTab.startsWith('q:') ? subTab.replace('q:', '') : '');
  const [catFilter, setCatFilter] = useState(subTab.startsWith('cat:') ? subTab.replace('cat:', '') : 'ALL');
  const [viewGlossary, setViewGlossary] = useState(subTab === 'glossary');

  useEffect(() => {
    if (subTab === 'glossary') {
      setViewGlossary(true);
    } else if (subTab === 'all') {
      setViewGlossary(false);
      setCatFilter('ALL');
      setSearch('');
    } else if (subTab.startsWith('q:')) {
      setViewGlossary(false);
      setSearch(subTab.replace('q:', ''));
      setCatFilter('ALL');
    } else if (subTab.startsWith('cat:')) {
      setViewGlossary(false);
      setCatFilter(subTab.replace('cat:', ''));
      setSearch('');
    }
  }, [subTab]);

  const categories = useMemo(
    () => Array.from(new Set(knowledgeArticles.map((a) => (isTe ? a.cat : a.catEn)))),
    [knowledgeArticles, isTe],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return knowledgeArticles.filter((a) => {
      if (catFilter !== 'ALL' && a.catEn !== catFilter && a.cat !== catFilter) return false;
      if (!q) return true;
      return (
        a.titleEn.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.subEn.toLowerCase().includes(q) ||
        a.sub.toLowerCase().includes(q) ||
        a.bodyEn.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [knowledgeArticles, catFilter, search]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx(
              lang,
              'పరాశరీ, జైమినీ, KP, వేదాలు, ఉపనిషత్తులు, దర్శనాలు వెతకండి…',
              'Search BPHS, Jaimini, KP, Vedas, Upanishads, Darshanas…',
            )}
            className="w-72 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5"
          />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
          >
            <option value="ALL">
              {tx(lang, 'అన్ని విభాగాలు', 'All Categories')} ({knowledgeArticles.length})
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setViewGlossary((v) => !v)}
          className={`px-3 py-1.5 rounded font-medium ${
            viewGlossary ? 'bg-amber-600 text-white' : 'border border-slate-200 dark:border-slate-700'
          }`}
        >
          {viewGlossary
            ? tx(lang, 'గ్రంథ వ్యాసాలు చూపించు', 'Show Articles')
            : tx(lang, `సంస్కృత / తెలుగు పదకోశం (${GLOSSARY_TERMS.length})`, `Sanskrit / Telugu Glossary (${GLOSSARY_TERMS.length})`)}
        </button>
      </div>

      {viewGlossary ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-2.5">{tx(lang, 'సంస్కృత పదం', 'Term (Sanskrit/Eng)')}</th>
                <th className="px-4 py-2.5">{tx(lang, 'తెలుగు అర్థం', 'Telugu')}</th>
                <th className="px-4 py-2.5">{tx(lang, 'వివరణ', 'Definition')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {GLOSSARY_TERMS.filter(
                (g) =>
                  !search ||
                  g.sanskrit.toLowerCase().includes(search.toLowerCase()) ||
                  g.en.toLowerCase().includes(search.toLowerCase()) ||
                  g.te.toLowerCase().includes(search.toLowerCase()),
              ).map((g) => (
                <tr key={g.sanskrit}>
                  <td className="px-4 py-2 font-semibold">{g.sanskrit}</td>
                  <td className="px-4 py-2">{g.te}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{isTe ? g.te : g.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => {
            const isBookmarked = bookmarks.some((b) => b.item_type === 'knowledge' && b.item_id === a.id);
            return (
              <article
                key={a.id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      {isTe ? a.cat : a.catEn} · {a.src}
                    </div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {isTe ? a.title : a.titleEn}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleBookmark('knowledge', a.id, isTe ? a.title : a.titleEn, isTe ? a.cat : a.catEn)}
                    aria-label={tx(lang, 'వ్యాసాన్ని బుక్‌మార్క్ చేయి', 'Bookmark article')}
                    className={`p-1.5 rounded border ${
                      isBookmarked
                        ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="font-medium text-slate-600 dark:text-slate-300">{isTe ? a.sub : a.subEn}</div>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                  {isTe ? a.body : a.bodyEn}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AdminSettingsPage: React.FC<{ subTab: string }> = ({ subTab }) => {
  const {
    user,
    refreshAuth,
    lang,
    setLang,
    theme,
    setTheme,
    chartStyle,
    setChartStyle,
    calcConfig,
    updateCalcConfig,
    refreshKnowledge,
    setAuthModalOpen,
  } = useApp();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [usageData, setUsageData] = useState<{
    plan?: { name: string; daily_ai_limit: number; max_profiles: number; max_reports: number };
    plans?: { id: string; name: string; description: string; daily_ai_limit: number; price_monthly_inr: number }[];
    todayUsage?: { ai_calls: number; tokens_used: number; reports_generated: number };
  }>({});
  const [adminData, setAdminData] = useState<{
    users?: { id: string; email: string; name: string; role: string; plan_id: string }[];
    auditLogs?: { id: string; action: string; resource: string; details: string; created_at: string }[];
    stats?: Record<string, number>;
    geminiConfigured?: boolean;
  } | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [newArtTitle, setNewArtTitle] = useState('');
  const [newArtBody, setNewArtBody] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    setDisplayName(user?.name || '');
  }, [user]);

  useEffect(() => {
    void fetch('/api/usage')
      .then((r) => (r.ok ? r.json() : {}))
      .then(setUsageData);
    void fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then(setHealth);
    if (user?.role === 'admin') {
      void fetch('/api/admin/overview')
        .then((r) => (r.ok ? r.json() : null))
        .then(setAdminData);
    }
  }, [user]);

  const updateAccountName = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: displayName }),
    });
    if (res.ok) {
      setStatusMsg(tx(lang, 'ఖాతా పేరు సేవ్ అయింది.', 'Account display name saved.'));
      await refreshAuth();
    }
  };

  const updateUserRole = async (uid: string, role: string, planId: string) => {
    await fetch(`/api/admin/users/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, planId }),
    });
    const res = await fetch('/api/admin/overview');
    if (res.ok) setAdminData((await res.json()) as typeof adminData);
  };

  const addKnowledgeArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtTitle.trim() || !newArtBody.trim()) return;
    await fetch('/api/admin/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newArtTitle,
        titleEn: newArtTitle,
        cat: 'శాస్త్ర గ్రంథాలు',
        catEn: 'Classical Jyotisha',
        sub: 'విద్వాంసుల ప్రత్యేక నోట్',
        subEn: 'Custom Scholarly Note',
        body: newArtBody,
        bodyEn: newArtBody,
        tags: ['custom'],
      }),
    });
    setNewArtTitle('');
    setNewArtBody('');
    setStatusMsg(tx(lang, 'శాస్త్ర వ్యాసం ప్రచురించబడింది.', 'Knowledge article added.'));
    await refreshKnowledge();
  };

  return (
    <div className="space-y-6 text-xs">
      {statusMsg && (
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200">
          {statusMsg}
        </div>
      )}

      {/* Account & Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={updateAccountName}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {tx(lang, 'వినియోగదారు ఖాతా & పాత్ర', 'User Account & Role')} ({subTab})
            </h2>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="text-amber-700 dark:text-amber-300 hover:underline"
            >
              {tx(lang, 'ఖాతా మార్చండి / లాగిన్', 'Switch Account / Login')}
            </button>
          </div>
          <label className="block">
            <span className="text-slate-500">{tx(lang, 'ప్రదర్శన పేరు', 'Display Name')}</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5"
            />
          </label>
          <div className="text-slate-500">
            {tx(lang, 'ఈమెయిల్:', 'Email:')} {user?.email || '—'} · {tx(lang, 'పాత్ర:', 'Role:')}{' '}
            <span className="font-semibold">{user?.role}</span> · {tx(lang, 'ప్లాన్:', 'Plan:')}{' '}
            <span className="font-semibold">{user?.planId}</span>
          </div>
          <button type="submit" className="px-4 py-1.5 rounded bg-amber-600 text-white font-medium">
            {tx(lang, 'పేరు సేవ్ చేయి', 'Save Account Name')}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-sm font-semibold">
            {tx(lang, 'యాప్ ప్రాధాన్యతలు & గణన డిఫాల్ట్‌లు', 'Application Preferences & Calculation Defaults')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-slate-500">{tx(lang, 'భాష', 'Language')}</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
              >
                <option value="te">తెలుగు (Telugu)</option>
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-500">{tx(lang, 'థీమ్', 'Theme')}</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeMode)}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
              >
                <option value="light">{tr(lang, 'themeLight')}</option>
                <option value="dark">{tr(lang, 'themeDark')}</option>
                <option value="system">{tr(lang, 'themeSystem')}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-500">{tr(lang, 'chartStyle')}</span>
              <select
                value={chartStyle}
                onChange={(e) => setChartStyle(e.target.value as ChartStyle)}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
              >
                <option value="south">{tr(lang, 'southIndian')}</option>
                <option value="north">{tr(lang, 'northIndian')}</option>
                <option value="western">{tr(lang, 'westernWheel')}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-500">{tr(lang, 'ayanamsha')}</span>
              <select
                value={calcConfig.ay}
                onChange={(e) => updateCalcConfig({ ay: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
              >
                {AYN.map((name, id) => (name ? <option key={id} value={id}>{name}</option> : null))}
              </select>
            </label>
            <label className="block">
              <span className="text-slate-500">{tr(lang, 'houseSystem')}</span>
              <select
                value={calcConfig.houseSystem}
                onChange={(e) => updateCalcConfig({ houseSystem: e.target.value as HouseSystem })}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
              >
                <option value="placidus">Placidus</option>
                <option value="whole">Whole Sign</option>
                <option value="equal">Equal</option>
                <option value="sripati">Sripati</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-500">{tr(lang, 'nodeType')}</span>
              <select
                value={calcConfig.nodeType}
                onChange={(e) => updateCalcConfig({ nodeType: e.target.value as NodeType })}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
              >
                <option value="mean">{tx(lang, 'సగటు రాహు-కేతు (Mean)', 'Mean Node')}</option>
                <option value="true">{tx(lang, 'నిజ రాహు-కేతు (True)', 'True Node')}</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Subscription & Usage + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h3 className="text-sm font-semibold">{tx(lang, 'సభ్యత్వ ప్లాన్‌లు & రోజువారీ కోటా', 'Subscription Plans & Daily Quotas')}</h3>
          <div className="text-slate-600 dark:text-slate-300 tabular-nums">
            {tx(lang, 'నేడు:', 'Today:')} {usageData.todayUsage?.ai_calls ?? 0} / {usageData.plan?.daily_ai_limit ?? 100}{' '}
            {tx(lang, 'AI ప్రశ్నలు', 'AI Consultations')} · {usageData.todayUsage?.tokens_used ?? 0} tokens ·{' '}
            {usageData.todayUsage?.reports_generated ?? 0} {tx(lang, 'నివేదికలు', 'reports')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(usageData.plans || []).map((pl) => (
              <div key={pl.id} className="p-3 rounded border border-slate-200 dark:border-slate-800">
                <div className="font-semibold">{pl.name}</div>
                <div className="font-mono text-amber-700 dark:text-amber-300 mt-0.5">₹{pl.price_monthly_inr}/mo</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {pl.daily_ai_limit} {tx(lang, 'AI కాల్స్/రోజు', 'AI calls/day')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
          <h3 className="text-sm font-semibold">{tx(lang, 'సిస్టమ్ & AI సేవా స్థితి', 'System & AI Service Health')}</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
            <div className="py-1.5 flex justify-between">
              <span className="font-sans">{tx(lang, 'సర్వర్ రన్‌టైమ్', 'Server Runtime')}</span>
              <span>{health?.ok ? tx(lang, 'సక్రియం', 'Healthy') : tx(lang, 'పరిశీలిస్తోంది', 'Checking')}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans">{tx(lang, 'SQLite డేటాబేస్', 'SQLite Persistence')}</span>
              <span>{String(health?.sqlite || 'node:sqlite')}</span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="font-sans">{tx(lang, 'సర్వర్-సైడ్ Gemini AI', 'Server-Side Gemini AI')}</span>
              <span>
                {health?.geminiConfigured
                  ? tx(lang, 'సిద్ధం (Configured)', 'Configured (gemini-4-hydrogen)')
                  : tx(lang, 'Secrets లో కీ లేదు', 'Key Not Set in Secrets')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Management Panel (visible to admin role) */}
      {adminData && (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{tx(lang, 'అడ్మిన్ కన్సోల్ — వినియోగదారులు & పాత్రలు', 'Admin Console — Users & Roles')}</h3>
              <span className="text-slate-500 tabular-nums">
                {tx(lang, 'వినియోగదారులు:', 'Users:')} {adminData.stats?.users} · {tx(lang, 'ప్రొఫైల్స్:', 'Profiles:')}{' '}
                {adminData.stats?.profiles} · {tx(lang, 'నివేదికలు:', 'Reports:')} {adminData.stats?.reports}
              </span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="px-3 py-2">{tx(lang, 'పేరు', 'Name')}</th>
                  <th className="px-3 py-2">{tx(lang, 'ఈమెయిల్', 'Email')}</th>
                  <th className="px-3 py-2">{tx(lang, 'పాత్ర', 'Role')}</th>
                  <th className="px-3 py-2">{tx(lang, 'ప్లాన్', 'Plan')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(adminData.users || []).map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2 font-medium">{u.name}</td>
                    <td className="px-3 py-2 font-mono">{u.email}</td>
                    <td className="px-3 py-2">
                      <select
                        value={u.role}
                        onChange={(e) => void updateUserRole(u.id, e.target.value, u.plan_id)}
                        className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1"
                      >
                        <option value="user">user</option>
                        <option value="astrologer">astrologer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={u.plan_id}
                        onChange={(e) => void updateUserRole(u.id, u.role, e.target.value)}
                        className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1"
                      >
                        <option value="seeker">seeker</option>
                        <option value="pro">pro</option>
                        <option value="enterprise">enterprise</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              onSubmit={addKnowledgeArticle}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5"
            >
              <h3 className="text-sm font-semibold">
                {tx(lang, 'శాస్త్ర గ్రంథాలయ నిర్వహణ — కొత్త వ్యాసం జోడించండి', 'Knowledge Management — Add Reference Article')}
              </h3>
              <input
                value={newArtTitle}
                onChange={(e) => setNewArtTitle(e.target.value)}
                placeholder={tx(lang, 'వ్యాసం శీర్షిక', 'Article Title')}
                className="w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
              />
              <textarea
                rows={3}
                value={newArtBody}
                onChange={(e) => setNewArtBody(e.target.value)}
                placeholder={tx(lang, 'శాస్త్రోక్త వివరణ…', 'Classical reference text…')}
                className="w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5"
              />
              <button type="submit" className="px-3 py-1.5 rounded bg-amber-600 text-white font-medium">
                {tx(lang, 'ప్రచురించు', 'Publish Article')}
              </button>
            </form>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-2">{tx(lang, 'ఇటీవలి ఆడిట్ లాగ్‌లు', 'Recent Audit Logs')}</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {(adminData.auditLogs || []).slice(0, 15).map((al) => (
                  <div key={al.id} className="py-1.5 flex justify-between gap-2">
                    <span className="font-semibold">{al.action}</span>
                    <span className="truncate text-slate-500">{al.details}</span>
                    <span className="text-slate-400 shrink-0">{al.created_at.slice(11, 19)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
