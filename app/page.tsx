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
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Linkedin size={20} className="text-blue-600" />
          <span className="font-semibold text-lg tracking-tight text-gray-900">Emilia</span>
          <span className="text-xs text-gray-400 ml-1">LinkedIn reshare writer</span>
        </div>
        {(output || postText) && (
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 max-w-6xl mx-auto w-full p-6 gap-6">
        {/* Left — Input */}
        <div className="flex flex-col gap-5 lg:w-1/2">
          {/* Post input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Paste the LinkedIn post</label>
            <textarea
              className="bg-white border border-gray-300 rounded-xl p-4 text-sm text-black placeholder-gray-400 resize-y min-h-48 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-sm"
              placeholder="Paste the post content here…"
              value={postText}
              onChange={e => setPostText(e.target.value)}
            />
          </div>

          {/* Tone selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Tone(s)</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => toggleTone(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedTones.includes(t.value)
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-gray-300 text-black hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional angle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Your angle <span className="text-gray-400">(optional)</span></label>
            <input
              type="text"
              className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-sm"
              placeholder="e.g. startup founder, operations leader…"
              value={perspective}
              onChange={e => setPerspective(e.target.value)}
            />
          </div>

          {/* Accenture toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setAccenture(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${accenture ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${accenture ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
              Accenture perspective <span className="text-gray-400">(optional)</span>
            </span>
          </label>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !postText.trim()}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                <label className="text-sm font-medium text-gray-600">Your drafts</label>
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {copied ? <><Check size={12} className="text-green-500" /> Copied</> : <><Copy size={12} /> Copy all</>}
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap flex-1 min-h-64 shadow-sm">
                {output}
                {loading && <span className="inline-block w-2 h-4 bg-purple-600 ml-1 animate-pulse rounded-sm" />}
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-64 bg-white border border-dashed border-gray-300 rounded-xl flex items-center justify-center shadow-sm">
              <p className="text-gray-400 text-sm text-center px-8">
                Paste a post and hit <strong className="text-gray-500">Generate drafts</strong> —<br />your reshare thoughts will appear here live.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
