import { useState, useEffect } from 'react';
import ChinaMap from './components/ChinaMap';
import ProvinceMap from './components/ProvinceMap';
import DestinationIntro from './components/DestinationIntro';
import CountdownPage from './components/CountdownPage';
import textConfig from './data/text-config.json';

export default function App() {
  const [step, setStep] = useState('province');
  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);

  // 启动时从后端恢复状态
  useEffect(() => {
    fetch('/api/state')
      .then((res) => res.json())
      .then((state) => {
        if (state.currentStep) setStep(state.currentStep);
        if (state.province) setProvince(state.province);
        if (state.city) setCity(state.city);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 状态变更时同步到后端
  const saveState = (updates) => {
    fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">{textConfig.common.mapLoading}</p>
      </div>
    );
  }

  switch (step) {
    case 'province':
      return (
        <ChinaMap
          onConfirm={(p) => {
            setProvince(p);
            setStep('city');
            saveState({ currentStep: 'city', province: p });
          }}
        />
      );

    case 'city':
      return (
        <ProvinceMap
          province={province}
          onConfirm={(c) => {
            setCity(c);
            setStep('intro');
            saveState({ currentStep: 'intro', city: c });
            // 记录抽奖结果
            fetch('/api/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ province, city: c }),
            }).catch(() => {});
          }}
        />
      );

    case 'intro':
      return (
        <DestinationIntro
          province={province}
          city={city}
          onNext={() => {
            setStep('countdown');
            saveState({ currentStep: 'countdown' });
          }}
        />
      );

    case 'countdown':
      return <CountdownPage province={province} city={city} />;

    default:
      return null;
  }
}
