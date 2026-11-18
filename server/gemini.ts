import { GoogleGenAI } from '@google/genai';

export interface GeminiChatInput {
  messages: { role: 'user' | 'assistant'; content: string }[];
  chartContextSummary: string;
  language: 'te' | 'en' | 'hi';
  focusTopic?: string;
}

export interface GeminiChatOutput {
  reply: string;
  model: string;
  tokensUsed: number;
}

const DEFAULT_MODEL = 'gemini-4-hydrogen';

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY');
}

export async function generateAstrologyReply(input: GeminiChatInput): Promise<GeminiChatOutput> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error('GEMINI_API_KEY is not configured in environment secrets.');
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const langHint =
    input.language === 'te'
      ? 'Respond primarily in clear, respectful Telugu (తెలుగు) using authentic Jyotisha terminology, with English parenthetical terms where helpful.'
      : input.language === 'hi'
        ? 'Respond primarily in clear, respectful Hindi (हिन्दी) using authentic Jyotisha terminology.'
        : 'Respond in clear, scholarly English with accurate Sanskrit/Vedic Jyotisha terminology.';

  const systemInstruction = [
    'You are the ASTROJYOTISH PRO AI Jyotisha Research Assistant.',
    langHint,
    'Anchor every observation strictly to the supplied astronomical chart calculations (Lagna, Rashi, Nakshatra, Pada, planetary houses/dignities, active Dashas, Yogas, Ashtakavarga, KP sub-lords, Jaimini Karakas).',
    'Never invent planetary placements not present in the chart context.',
    'Clearly distinguish calculated astronomical factors from traditional scriptural interpretations or remedies.',
    input.focusTopic ? `Active consultation focus: ${input.focusTopic}.` : '',
    '',
    'ACTIVE CHART CONTEXT:',
    input.chartContextSummary,
  ]
    .filter(Boolean)
    .join('\n');

  const transcript = input.messages
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'Seeker' : 'Jyotishi'}: ${m.content}`)
    .join('\n\n');

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: transcript,
    config: {
      systemInstruction,
    },
  });

  const reply = (response.text || '').trim();
  if (!reply) {
    throw new Error('Empty response returned from Gemini API.');
  }

  const tokensUsed =
    response.usageMetadata?.totalTokenCount ??
    Math.ceil((transcript.length + reply.length) / 4);

  return {
    reply,
    model: DEFAULT_MODEL,
    tokensUsed,
  };
}
