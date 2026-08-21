import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

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
  try {
    const { postText, tones, perspective } = await req.json();

    if (!postText || !tones?.length) {
      return new Response(JSON.stringify({ error: 'Missing postText or tones' }), { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), { status: 500 });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: buildPrompt(postText, tones, perspective ?? '') }],
        stream: false,
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error:', groqRes.status, errText);
      return new Response(JSON.stringify({ error: `Groq API error: ${groqRes.status}` }), { status: 500 });
    }

    const data = await groqRes.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('API error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
