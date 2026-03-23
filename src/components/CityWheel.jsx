import { useState, useCallback } from 'react';
import Wheel from './Wheel';
import { travelProvinces } from '../data/travel-regions';

/**
 * 第二轮：抽市/县
 * 只有一次机会，不可重转，转到即确定
 */
export default function CityWheel({ province, onConfirm }) {
  const [result, setResult] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const provinceData = travelProvinces.find((p) => p.name === province);
  const cities = provinceData ? provinceData.cities : [];

  const handleSpinEnd = useCallback((item) => {
    setResult(item);
    // 没有重转机会，短暂展示后自动进入确认状态
    setTimeout(() => {
      setConfirmed(true);
    }, 1200);
  }, []);

  const handleContinue = () => {
    onConfirm(result);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-700 mb-2">
        第二步：抽城市
      </h2>
      <p className="text-gray-400 mb-6">
        你选中了<span className="text-pink-500 font-medium"> {province}</span>
        ，再转出目的地城市吧
      </p>

      <Wheel items={cities} onSpinEnd={handleSpinEnd} />

      {/* 结果展示 */}
      <div className="mt-8 h-32 flex flex-col items-center justify-start">
        {result && !confirmed && (
          <p className="text-2xl font-bold text-pink-500 animate-fade-in">
            {result}
          </p>
        )}

        {confirmed && (
          <div className="animate-fade-in text-center">
            <p className="text-lg text-gray-500 mb-1">目的地锁定</p>
            <p className="text-2xl font-bold text-pink-500 mb-4">
              {province} {result}
            </p>
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-pink-400 hover:bg-pink-500 text-white rounded-full shadow-md transition-colors"
            >
              就去这里!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
