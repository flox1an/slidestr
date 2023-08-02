import SlideShow from './components/SlideShow';
import './App.css';
import Disclaimer from './components/Disclaimer';
import useDisclaimerState from './utils/useDisclaimerState';
import useNav from './utils/useNav';
import { useEffect } from 'react';
import { defaultHashTags } from './components/env';

const App = () => {
  const { disclaimerAccepted, setDisclaimerAccepted } = useDisclaimerState();
  const { nav, currentSettings } = useNav();

  useEffect(() => {
    if (currentSettings.npubs.length == 0 && currentSettings.tags.length == 0) {
      nav({ ...currentSettings, tags: defaultHashTags, showAdult: false });
    }
  }, []);

  return (
    <>
      {disclaimerAccepted ? (
        <SlideShow />
      ) : (
        <Disclaimer disclaimerAccepted={disclaimerAccepted} setDisclaimerAccepted={setDisclaimerAccepted} />
      )}
    </>
  );
};

export default App;
