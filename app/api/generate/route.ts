import Groq from 'groq-sdk';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const TONES: Record<string, string> = {
  professional:       'measured, business-focused language with a clear value lens',
  'thought-provoking':'nuanced, raises a challenging question or overlooked angle',
  supportive:         'warm, personally endorsing the idea with genuine enthusiasm',
  playful:            'witty and lighter, still on-topic and professional',
  contrarian:         'respectfully pushes back with a well-reasoned alternative view',
};

function buildPrompt(postText: string, tones: string[], perspective: string): string {
  const toneInstructions = tones
    .map((t, i) => `Option ${String.fromCharCode(65 + i)} — ${t} (${TONES[t] ?? t})`)
    .join('\n');

  const perspectiveNote = perspective
    ? `\nWrite all options ${perspective}.`
    : '';

  return `You are helping a professional draft a personal thought to share when reposting a LinkedIn post. The thought should feel authentic, not like marketing copy.

LinkedIn post:
"""
${postText}
"""

Write ${tones.length} reshare thought option${tones.length > 1 ? 's' : ''}, one for each tone below:
${toneInstructions}
${perspectiveNote}

Rules:
- Each option: 3–5 sentences maximum
- Open with a hook (NOT "Great post!" or "This resonates")
- Add genuine value: unique insight, personal angle, or a provocation
- End with a question or call to engagement (optional but recommended)
- Do NOT include hashtags
- Label each option clearly as "**Option A — [Tone]**" etc.

Write only the options, no preamble.`;
}

export async function POST(req: NextRequest) {
  const { postText, tones, perspective } = await req.json();

  if (!postText || !tones?.length) {
    return new Response(JSON.stringify({ error: 'Missing postText or tones' }), { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), { status: 500 });
  }

  const groq = new Groq({ apiKey });

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: buildPrompt(postText, tones, perspective ?? '') }],
    stream: true,
    max_tokens: 800,
    temperature: 0.8,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
