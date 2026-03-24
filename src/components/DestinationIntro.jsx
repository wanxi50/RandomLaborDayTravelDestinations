import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import textConfig from '../data/text-config.json';

const T = textConfig.destinationIntro;

export default function DestinationIntro({ province, city, onNext }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchIntro = async () => {
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ province, city }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(T.errorFallback);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) setText((prev) => prev + content);
              } catch {}
            }
          }
        }

        setLoading(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchIntro();
    return () => controller.abort();
  }, [province, city]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-700 text-center mb-2">{T.heading}</h2>
        <h1 className="text-3xl font-bold text-center mb-8" style={{ color: '#7ab678' }}>
          {province} {city}
        </h1>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm min-h-[160px]">
          {error ? (
            <p className="text-red-400 text-center">{error}</p>
          ) : (
            <div className={`text-gray-600 leading-relaxed prose prose-sm max-w-none ${loading ? 'typing-cursor' : ''}`}>
              {text ? <Markdown>{text}</Markdown> : (loading ? <p>{T.loading}</p> : null)}
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className="text-center mt-8 animate-fade-in">
            <button
              onClick={onNext}
              className="px-6 py-2 text-white rounded-full shadow-md transition-colors"
              style={{ backgroundColor: '#a58ac7' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#8f74b3')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#a58ac7')}
            >
              {T.nextButton}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
