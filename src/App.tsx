import SlideShow from './components/SlideShow';
import './App.css';
import Disclaimer from './components/Disclaimer';
import useDisclaimerState from './utils/useDisclaimerState';

const App = () => {
  const { disclaimerAccepted, setDisclaimerAccepted } = useDisclaimerState();

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
