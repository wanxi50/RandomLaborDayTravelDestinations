import { useState, useEffect } from 'react';

// 五一出发时间：2026-05-01 00:00:00 北京时间 (UTC+8)
const TARGET_DATE = new Date('2026-05-01T00:00:00+08:00');

function calcTimeLeft() {
  const diff = TARGET_DATE - new Date();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl sm:text-5xl font-bold text-pink-500 tabular-nums animate-countdown-pulse">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  );
}

/**
 * 五一出发倒计时页面
 */
export default function CountdownPage({ province, city }) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in-up">
      <div className="text-center max-w-md">
        {/* 顶部温馨文案 */}
        <p className="text-lg text-gray-500 mb-2">
          我们的五一旅行即将出发!
        </p>

        {/* 目的地 */}
        <h1 className="text-3xl font-bold text-gray-800 mb-10">
          目的地：
          <span className="text-pink-500">
            {province} {city}
          </span>
        </h1>

        {/* 倒计时 */}
        <p className="text-sm text-gray-400 mb-4">
          距离 2026 年 5 月 1 日出发还有
        </p>

        <div className="flex items-center justify-center gap-3 sm:gap-5 mb-12">
          <TimeBlock value={timeLeft.days} label="天" />
          <span className="text-2xl text-gray-300 font-light">:</span>
          <TimeBlock value={timeLeft.hours} label="时" />
          <span className="text-2xl text-gray-300 font-light">:</span>
          <TimeBlock value={timeLeft.minutes} label="分" />
          <span className="text-2xl text-gray-300 font-light">:</span>
          <TimeBlock value={timeLeft.seconds} label="秒" />
        </div>

        {/* 底部彩蛋 */}
        <p className="text-sm text-gray-300">这是我给你准备的五一小惊喜</p>
      </div>
    </div>
  );
}
