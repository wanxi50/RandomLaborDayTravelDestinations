import { useState, useEffect, useRef, useCallback } from 'react';
import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { GeoComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { travelProvinces } from '../data/travel-regions';
import textConfig from '../data/text-config.json';

echarts.use([MapChart, GeoComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

const T = textConfig.chinaMap;
const AVAILABLE_NAMES = travelProvinces.map((p) => p.name);
const MAX_RETRIES = 2;

const NAME_MAP = {
  '安徽省': '安徽', '北京市': '北京', '重庆市': '重庆', '福建省': '福建',
  '甘肃省': '甘肃', '广东省': '广东', '广西壮族自治区': '广西', '贵州省': '贵州',
  '海南省': '海南', '湖北省': '湖北', '湖南省': '湖南', '江苏省': '江苏',
  '江西省': '江西', '山东省': '山东', '陕西省': '陕西', '上海市': '上海',
  '四川省': '四川', '西藏自治区': '西藏', '云南省': '云南', '浙江省': '浙江',
};

/**
 * 计算变速动画的延迟序列，总时长约 duration 毫秒
 * 使用 easeOutCubic 曲线：前快后慢
 */
function buildDelaySchedule(stepCount, duration) {
  const delays = [];
  let total = 0;
  for (let i = 0; i < stepCount; i++) {
    const t = i / (stepCount - 1); // 0→1
    const ease = t * t; // quadratic ease-in → 平滑减速
    const d = 60 + ease * 600; // 60ms → 660ms
    delays.push(d);
    total += d;
  }
  const scale = duration / total;
  return delays.map((d) => d * scale);
}

export default function ChinaMap({ onConfirm }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [retries, setRetries] = useState(MAX_RETRIES);
  const [confirmed, setConfirmed] = useState(false);
  const animTimer = useRef(null);

  useEffect(() => {
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then((res) => res.json())
      .then((geoJson) => {
        geoJson.features.forEach((f) => {
          const fullName = f.properties.name;
          if (NAME_MAP[fullName]) f.properties.name = NAME_MAP[fullName];
        });
        echarts.registerMap('china', geoJson);
        setMapReady(true);
      });
  }, []);

  useEffect(() => {
    if (!mapReady || !chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params) => AVAILABLE_NAMES.includes(params.name) ? params.name : '',
      },
      series: [{
        type: 'map', map: 'china', roam: false, selectedMode: false,
        label: { show: true, fontSize: 10, color: '#666' },
        itemStyle: { areaColor: '#dbdbdb', borderColor: '#fff', borderWidth: 1 },
        emphasis: { disabled: true },
        data: AVAILABLE_NAMES.map((name) => ({
          name, value: 1,
          itemStyle: { areaColor: name === result ? '#7ab678' : '#d2d2d2' },
          label: { color: name === result ? '#fff' : '#555', fontWeight: name === result ? 'bold' : 'normal' },
        })),
      }],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.dispose(); chartInstance.current = null; };
  }, [mapReady, result]);

  const setMapData = useCallback((highlightName, color) => {
    const chart = chartInstance.current;
    if (!chart) return;
    chart.setOption({
      series: [{
        data: AVAILABLE_NAMES.map((n) => ({
          name: n, value: 1,
          itemStyle: { areaColor: n === highlightName ? color : '#d2d2d2' },
          label: { color: n === highlightName ? '#fff' : '#555', fontWeight: n === highlightName ? 'bold' : 'normal' },
        })),
      }],
    });
  }, []);

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const selectedIndex = Math.floor(Math.random() * AVAILABLE_NAMES.length);
    const totalSteps = AVAILABLE_NAMES.length * 3 + selectedIndex;
    const delays = buildDelaySchedule(totalSteps, 8000);
    let step = 0;

    const tick = () => {
      const idx = step % AVAILABLE_NAMES.length;
      setMapData(AVAILABLE_NAMES[idx], '#a58ac7');
      step++;

      if (step > totalSteps) {
        const selected = AVAILABLE_NAMES[selectedIndex];
        setMapData(selected, '#7ab678');
        setResult(selected);
        setSpinning(false);
        return;
      }

      animTimer.current = setTimeout(tick, delays[step - 1]);
    };
    tick();
  };

  useEffect(() => () => { if (animTimer.current) clearTimeout(animTimer.current); }, []);

  const handleRetry = () => {
    setRetries((prev) => prev - 1);
    setResult(null);
    setMapData(null, '#d2d2d2');
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => onConfirm(result), 600);
  };

  if (!mapReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">{textConfig.common.mapLoading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-700 mb-2">{T.title}</h2>
      <p className="text-gray-400 mb-4">{T.subtitle}</p>

      <div ref={chartRef} style={{ width: '100%', maxWidth: '600px', height: '460px' }} />

      <div className="mt-4 h-32 flex flex-col items-center justify-start">
        {!result && !spinning && (
          <button
            onClick={handleSpin}
            className="px-6 py-2 text-white rounded-full shadow-md transition-colors text-sm"
            style={{ backgroundColor: '#a58ac7' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#8f74b3')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#a58ac7')}
          >
            {T.spinButton}
          </button>
        )}

        {spinning && <p className="text-gray-400 animate-pulse">{T.spinning}</p>}

        {result && !confirmed && (
          <div className="animate-fade-in text-center">
            <p className="text-2xl font-bold mb-4" style={{ color: '#7ab678' }}>{result}</p>
            <div className="flex gap-3">
              {retries > 0 && (
                <button
                  onClick={handleRetry}
                  className="px-5 py-2 border-2 border-gray-300 text-gray-500 rounded-full transition-colors text-sm"
                  onMouseEnter={(e) => { e.target.style.borderColor = '#a58ac7'; e.target.style.color = '#a58ac7'; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = ''; e.target.style.color = ''; }}
                >
                  {T.retryButton.replace('{n}', retries)}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="px-5 py-2 text-white rounded-full shadow-md transition-colors text-sm"
                style={{ backgroundColor: '#a58ac7' }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#8f74b3')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#a58ac7')}
              >
                {T.confirmButton}
              </button>
            </div>
          </div>
        )}

        {confirmed && (
          <p className="text-xl font-bold animate-fade-in" style={{ color: '#7ab678' }}>
            {T.confirmed.replace('{province}', result)}
          </p>
        )}
      </div>
    </div>
  );
}
