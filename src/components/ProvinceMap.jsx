import { useState, useEffect, useRef, useCallback } from 'react';
import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { GeoComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { travelProvinces } from '../data/travel-regions';
import textConfig from '../data/text-config.json';

echarts.use([MapChart, GeoComponent, TooltipComponent, CanvasRenderer]);

const T = textConfig.provinceMap;

function buildDelaySchedule(stepCount, duration) {
  const delays = [];
  let total = 0;
  for (let i = 0; i < stepCount; i++) {
    const t = i / (stepCount - 1);
    const ease = t * t;
    const d = 60 + ease * 600;
    delays.push(d);
    total += d;
  }
  const scale = duration / total;
  return delays.map((d) => d * scale);
}

export default function ProvinceMap({ province, onConfirm }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [geoNames, setGeoNames] = useState([]);
  const animTimer = useRef(null);

  const provinceData = travelProvinces.find((p) => p.name === province);
  const adcode = provinceData ? provinceData.adcode : null;

  useEffect(() => {
    if (!adcode) return;
    fetch(`/geo/${adcode}.json`)
      .then((res) => res.json())
      .then((geoJson) => {
        const mapName = `province_${adcode}`;
        echarts.registerMap(mapName, geoJson);
        setMapReady(true);
      });
  }, [adcode]);

  useEffect(() => {
    if (!mapReady || !chartRef.current || !adcode) return;

    const mapName = `province_${adcode}`;
    const mapData = echarts.getMap(mapName);
    if (mapData) {
      setGeoNames(mapData.geoJSON.features.map((f) => f.properties.name));
    }

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    chart.setOption({
      tooltip: { trigger: 'item', formatter: (params) => params.name || '' },
      series: [{
        type: 'map', map: mapName, roam: false, selectedMode: false,
        label: { show: true, fontSize: 10, color: '#666' },
        itemStyle: { areaColor: '#d2d2d2', borderColor: '#fff', borderWidth: 1 },
        emphasis: { disabled: true },
      }],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.dispose(); chartInstance.current = null; };
  }, [mapReady, adcode]);

  const setMapData = useCallback((highlightName, color) => {
    const chart = chartInstance.current;
    if (!chart || geoNames.length === 0) return;
    chart.setOption({
      series: [{
        data: geoNames.map((n) => ({
          name: n,
          itemStyle: { areaColor: n === highlightName ? color : '#d2d2d2' },
          label: { color: n === highlightName ? '#fff' : '#666', fontWeight: n === highlightName ? 'bold' : 'normal' },
        })),
      }],
    });
  }, [geoNames]);

  const handleSpin = () => {
    if (spinning || geoNames.length === 0) return;
    setSpinning(true);
    setResult(null);

    const selectedIndex = Math.floor(Math.random() * geoNames.length);
    const totalSteps = geoNames.length * 3 + selectedIndex;
    const delays = buildDelaySchedule(totalSteps, 8000);
    let step = 0;

    const tick = () => {
      const idx = step % geoNames.length;
      setMapData(geoNames[idx], '#a58ac7');
      step++;

      if (step > totalSteps) {
        const selected = geoNames[selectedIndex];
        setMapData(selected, '#7ab678');
        setResult(selected);
        setSpinning(false);
        setTimeout(() => setConfirmed(true), 1200);
        return;
      }

      animTimer.current = setTimeout(tick, delays[step - 1]);
    };
    tick();
  };

  useEffect(() => () => { if (animTimer.current) clearTimeout(animTimer.current); }, []);

  const handleContinue = () => onConfirm(result);

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
      <p className="text-gray-400 mb-4">
        {T.subtitle.split('{province}')[0]}
        <span className="font-medium" style={{ color: '#7ab678' }}>{province}</span>
        {T.subtitle.split('{province}')[1]}
      </p>

      <div ref={chartRef} style={{ width: '100%', maxWidth: '1000px', height: '80vh' }} />

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
          <p className="text-2xl font-bold animate-fade-in" style={{ color: '#7ab678' }}>{result}</p>
        )}

        {confirmed && (
          <div className="animate-fade-in text-center">
            <p className="text-lg text-gray-500 mb-1">{T.resultLocked}</p>
            <p className="text-2xl font-bold mb-4" style={{ color: '#7ab678' }}>
              {T.resultText.replace('{province}', province).replace('{city}', result)}
            </p>
            <button
              onClick={handleContinue}
              className="px-6 py-2 text-white rounded-full shadow-md transition-colors"
              style={{ backgroundColor: '#a58ac7' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#8f74b3')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#a58ac7')}
            >
              {T.continueButton}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
