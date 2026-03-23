import { useState, useEffect } from 'react';

/**
 * AI 生成目的地介绍页
 * 流式展示文字，打字机效果
 */
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

        if (!response.ok) {
          throw new Error('AI 服务暂时不可用');
        }

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
                if (content) {
                  setText((prev) => prev + content);
                }
              } catch {
                // 跳过无法解析的行
              }
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
        <h2 className="text-2xl font-bold text-gray-700 text-center mb-2">
          我带你去
        </h2>
        <h1 className="text-3xl font-bold text-pink-500 text-center mb-8">
          {province} {city}
        </h1>

        {/* AI 生成的介绍文字 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm min-h-[160px]">
          {error ? (
            <p className="text-red-400 text-center">{error}</p>
          ) : (
            <p
              className={`text-gray-600 leading-relaxed whitespace-pre-wrap ${loading ? 'typing-cursor' : ''}`}
            >
              {text || (loading ? '正在为你写一段话...' : '')}
            </p>
          )}
        </div>

        {/* 继续按钮 - 加载完成后显示 */}
        {!loading && !error && (
          <div className="text-center mt-8 animate-fade-in">
            <button
              onClick={onNext}
              className="px-6 py-2 bg-pink-400 hover:bg-pink-500 text-white rounded-full shadow-md transition-colors"
            >
              看看出发倒计时
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
