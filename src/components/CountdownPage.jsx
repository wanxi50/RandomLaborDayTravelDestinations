import { useState, useEffect } from 'react';
import textConfig from '../data/text-config.json';

const T = textConfig.countdown;

const TARGET_DATE = new Date('2026-05-01T00:00:00+08:00');

function calcTimeLeft() {
  const diff = TARGET_DATE - new Date();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
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
      <span className="text-4xl sm:text-5xl font-bold tabular-nums animate-countdown-pulse" style={{ color: '#a58ac7' }}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  );
}

export default function CountdownPage({ province, city }) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in-up">
      <div className="text-center max-w-md">
        <p className="text-lg text-gray-500 mb-2">{T.topMessage}</p>

        <h1 className="text-3xl font-bold text-gray-800 mb-10">
          {T.destination.split('{province}')[0]}
          <span style={{ color: '#7ab678' }}>
            {T.destination.replace('{province}', province).replace('{city}', city).replace(T.destination.split('{province}')[0], '')}
          </span>
        </h1>

        <p className="text-sm text-gray-400 mb-4">{T.countdownLabel}</p>

        <div className="flex items-center justify-center gap-3 sm:gap-5 mb-12">
          <TimeBlock value={timeLeft.days} label={T.units.days} />
          <span className="text-2xl text-gray-300 font-light">:</span>
          <TimeBlock value={timeLeft.hours} label={T.units.hours} />
          <span className="text-2xl text-gray-300 font-light">:</span>
          <TimeBlock value={timeLeft.minutes} label={T.units.minutes} />
          <span className="text-2xl text-gray-300 font-light">:</span>
          <TimeBlock value={timeLeft.seconds} label={T.units.seconds} />
        </div>

        <p className="text-sm text-gray-300">{T.footer}</p>
      </div>
    </div>
  );
}
