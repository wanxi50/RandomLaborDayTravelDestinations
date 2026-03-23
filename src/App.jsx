import { useState } from 'react';
import LandingPage from './components/LandingPage';
import ProvinceWheel from './components/ProvinceWheel';
import CityWheel from './components/CityWheel';
import DestinationIntro from './components/DestinationIntro';
import CountdownPage from './components/CountdownPage';

export default function App() {
  const [step, setStep] = useState('landing');
  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);

  switch (step) {
    case 'landing':
      return <LandingPage onStart={() => setStep('province')} />;

    case 'province':
      return (
        <ProvinceWheel
          onConfirm={(p) => {
            setProvince(p);
            setStep('city');
          }}
        />
      );

    case 'city':
      return (
        <CityWheel
          province={province}
          onConfirm={(c) => {
            setCity(c);
            setStep('intro');
          }}
        />
      );

    case 'intro':
      return (
        <DestinationIntro
          province={province}
          city={city}
          onNext={() => setStep('countdown')}
        />
      );

    case 'countdown':
      return <CountdownPage province={province} city={city} />;

    default:
      return null;
  }
}
