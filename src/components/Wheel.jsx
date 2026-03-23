import { useRef, useEffect, useState, useCallback } from 'react';

// 清新柔和的马卡龙色系
const COLORS = [
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
  '#E8BAFF', '#FFB3DE', '#B3FFE0', '#FFE0B3', '#B3D4FF',
  '#D4B3FF', '#B3FFFC', '#FFCAB3', '#B3FFC4', '#C4B3FF',
  '#FFB3F0', '#B3FFD9', '#F0B3FF', '#FFD9B3', '#D9B3FF',
  '#FFDAB3', '#B3ECFF', '#FFB3C6', '#C6FFB3', '#B3C6FF',
];

/**
 * 通用转盘组件
 * @param {string[]} items - 转盘选项列表
 * @param {(item: string, index: number) => void} onSpinEnd - 转盘停止后的回调
 * @param {number} [size=340] - 转盘直径
 */
export default function Wheel({ items, onSpinEnd, size = 340 }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const currentRotationRef = useRef(0);
  const [spinning, setSpinning] = useState(false);

  const segmentAngle = 360 / items.length;

  // 绘制转盘扇形和文字
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 6;

    ctx.clearRect(0, 0, size, size);

    items.forEach((item, i) => {
      const startRad = ((i * segmentAngle - 90) * Math.PI) / 180;
      const endRad = (((i + 1) * segmentAngle - 90) * Math.PI) / 180;

      // 扇形背景
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startRad, endRad);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 扇形内文字
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startRad + (endRad - startRad) / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#4A4A4A';
      const fontSize = items.length > 15 ? 11 : items.length > 10 ? 13 : 15;
      ctx.font = `bold ${fontSize}px "Noto Sans SC", sans-serif`;
      ctx.fillText(item, radius - 14, 0);
      ctx.restore();
    });

    // 中心白色圆
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [items, size, segmentAngle]);

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);

    const selectedIndex = Math.floor(Math.random() * items.length);

    // 计算目标旋转角度，使选中项对齐顶部指针
    // 旋转后指针指向原始位置 (360 - R%360) 处
    const targetAngle = 360 - (selectedIndex * segmentAngle + segmentAngle / 2);
    // 加一点随机偏移，不总是正中心
    const jitter = (Math.random() - 0.5) * segmentAngle * 0.4;
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;

    let needed = targetAngle + jitter - (currentRotationRef.current % 360);
    if (needed < 0) needed += 360;
    const totalRotation = currentRotationRef.current + extraSpins + needed;

    const wrapper = wrapperRef.current;
    wrapper.style.transition =
      'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wrapper.style.transform = `rotate(${totalRotation}deg)`;
    currentRotationRef.current = totalRotation;

    setTimeout(() => {
      setSpinning(false);
      onSpinEnd(items[selectedIndex], selectedIndex);
    }, 4100);
  }, [spinning, items, segmentAngle, onSpinEnd]);

  return (
    <div className="relative inline-block">
      {/* 顶部指针 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-pink-400 drop-shadow-md" />
      </div>

      {/* 转盘主体 */}
      <div
        ref={wrapperRef}
        className="rounded-full"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>

      {/* 中心 GO 按钮 */}
      <button
        onClick={spin}
        disabled={spinning}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-pink-50 active:bg-pink-100 border-2 border-pink-300 text-pink-500 font-bold text-sm shadow-md z-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {spinning ? '...' : 'GO'}
      </button>
    </div>
  );
}
