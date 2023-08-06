import SlideShow from './components/SlideShow';
import './App.css';
import Disclaimer from './components/Disclaimer';
import useDisclaimerState from './utils/useDisclaimerState';
import useNav from './utils/useNav';
import { useEffect } from 'react';
import { defaultHashTags } from './components/env';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import { useGlobalState } from './utils/globalState';

const App = () => {
  const { disclaimerAccepted, setDisclaimerAccepted } = useDisclaimerState();
  const { nav, currentSettings } = useNav();
  const { loginWithNip07, ndk } = useNDK();

  const [state, setState] = useGlobalState();

  useEffect(() => {
    if (currentSettings.npubs.length == 0 && currentSettings.tags.length == 0) {
      nav({ ...currentSettings, tags: defaultHashTags, showAdult: false });
    }
  }, []);

  const onLogin = async () => {
    const result = await loginWithNip07();
    console.log(result);
    result && setState({ userNPub: result.npub });
  };
  return (
    <>
    {JSON.stringify(ndk?.signer)}
    {JSON.stringify(state)}
      <button onClick={onLogin}>Login</button>
      {disclaimerAccepted ? (
        <SlideShow />
      ) : (
        <Disclaimer disclaimerAccepted={disclaimerAccepted} setDisclaimerAccepted={setDisclaimerAccepted} />
      )}
    </>
  );
};

export default App;
