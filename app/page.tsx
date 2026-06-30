'use client';

import { useState, useRef } from 'react';
import { Sparkles, Copy, Check, RotateCcw, Linkedin } from 'lucide-react';

const TONES = [
  { value: 'professional',       label: 'Professional',       emoji: '💼' },
  { value: 'thought-provoking',  label: 'Thought-provoking',  emoji: '🧠' },
  { value: 'supportive',         label: 'Supportive',         emoji: '🤝' },
  { value: 'playful',            label: 'Playful',            emoji: '😄' },
  { value: 'contrarian',         label: 'Contrarian',         emoji: '⚡' },
];

export default function Home() {
  const [postText, setPostText]           = useState('');
  const [selectedTones, setSelectedTones] = useState<string[]>(['professional', 'thought-provoking']);
  const [accenture, setAccenture]         = useState(false);
  const [perspective, setPerspective]     = useState('');
  const [output, setOutput]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [copied, setCopied]               = useState(false);
  const abortRef                          = useRef<AbortController | null>(null);

  const toggleTone = (t: string) => {
    setSelectedTones(prev =>
      prev.includes(t)
        ? prev.length > 1 ? prev.filter(x => x !== t) : prev
        : [...prev, t]
    );
  };

  const generate = async () => {
    if (!postText.trim()) { setError('Please paste a LinkedIn post first.'); return; }
    setError(''); setOutput(''); setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const effectivePerspective = [
      perspective.trim(),
      accenture ? 'from an Accenture perspective' : '',
    ].filter(Boolean).join(', ');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postText: postText.trim(), tones: selectedTones, perspective: effectivePerspective }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setOutput(result);
      }
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setError('Something went wrong. Please try again.');
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    abortRef.current?.abort();
    setPostText(''); setOutput(''); setError(''); setLoading(false);
    setSelectedTones(['professional', 'thought-provoking']);
    setAccenture(false); setPerspective('');
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Linkedin size={20} className="text-blue-400" />
          <span className="font-semibold text-lg tracking-tight">Emilia</span>
          <span className="text-xs text-gray-500 ml-1">LinkedIn reshare writer</span>
        </div>
        {(output || postText) && (
          <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 max-w-6xl mx-auto w-full p-6 gap-6">
        {/* Left — Input */}
        <div className="flex flex-col gap-5 lg:w-1/2">
          {/* Post input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-400">Paste the LinkedIn post</label>
            <textarea
              className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-gray-100 placeholder-gray-600 resize-y min-h-48 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="Paste the post content here…"
              value={postText}
              onChange={e => setPostText(e.target.value)}
            />
          </div>

          {/* Tone selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-400">Tone(s)</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => toggleTone(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedTones.includes(t.value)
                      ? 'bg-green-500 border-green-500 text-gray-950'
                      : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional angle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-400">Your angle <span className="text-gray-600">(optional)</span></label>
            <input
              type="text"
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
              placeholder="e.g. startup founder, operations leader…"
              value={perspective}
              onChange={e => setPerspective(e.target.value)}
            />
          </div>

          {/* Accenture toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setAccenture(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${accenture ? 'bg-green-500' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${accenture ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              Accenture perspective <span className="text-gray-600">(optional)</span>
            </span>
          </label>

          {/* Error */}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !postText.trim()}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-semibold rounded-xl py-3 transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                Drafting…
              </span>
            ) : (
              <>
                <Sparkles size={16} />
                Generate drafts
              </>
            )}
          </button>
        </div>

        {/* Right — Output */}
        <div className="lg:w-1/2 flex flex-col gap-3">
          {output ? (
            <>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-400">Your drafts</label>
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {copied ? <><Check size={12} className="text-green-400" /> Copied</> : <><Copy size={12} /> Copy all</>}
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap flex-1 min-h-64">
                {output}
                {loading && <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse rounded-sm" />}
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-64 bg-gray-900/50 border border-dashed border-gray-800 rounded-xl flex items-center justify-center">
              <p className="text-gray-600 text-sm text-center px-8">
                Paste a post and hit <strong className="text-gray-500">Generate drafts</strong> —<br />your reshare thoughts will appear here live.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
