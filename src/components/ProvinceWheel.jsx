import { useState, useCallback } from 'react';
import Wheel from './Wheel';
import { travelProvinces } from '../data/travel-regions';

const provinceNames = travelProvinces.map((p) => p.name);
const MAX_RETRIES = 2;

/**
 * 第一轮：抽省份
 * 可重转2次，确认后进入市县转盘
 */
export default function ProvinceWheel({ onConfirm }) {
  const [result, setResult] = useState(null);
  const [retries, setRetries] = useState(MAX_RETRIES);
  const [confirmed, setConfirmed] = useState(false);

  const handleSpinEnd = useCallback((item) => {
    setResult(item);
  }, []);

  const handleRetry = () => {
    setRetries((prev) => prev - 1);
    setResult(null);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    // 短暂停留展示确认效果后进入下一步
    setTimeout(() => onConfirm(result), 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-700 mb-2">
        第一步：抽省份
      </h2>
      <p className="text-gray-400 mb-6">你来转出我们要去的省份</p>

      <Wheel items={provinceNames} onSpinEnd={handleSpinEnd} />

      {/* 结果和操作区域 */}
      <div className="mt-8 h-32 flex flex-col items-center justify-start">
        {result && !confirmed && (
          <div className="animate-fade-in text-center">
            <p className="text-2xl font-bold text-pink-500 mb-4">
              {result}
            </p>
            <div className="flex gap-3">
              {retries > 0 && (
                <button
                  onClick={handleRetry}
                  className="px-5 py-2 border-2 border-gray-300 text-gray-500 rounded-full hover:border-pink-300 hover:text-pink-500 transition-colors text-sm"
                >
                  再转一次（剩{retries}次）
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="px-5 py-2 bg-pink-400 hover:bg-pink-500 text-white rounded-full shadow-md transition-colors text-sm"
              >
                就是这里了!
              </button>
            </div>
          </div>
        )}

        {confirmed && (
          <p className="text-xl text-pink-500 font-bold animate-fade-in">
            我们要去 {result}!
          </p>
        )}
      </div>
    </div>
  );
}
