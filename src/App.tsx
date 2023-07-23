import { useParams, useSearchParams } from "react-router-dom";
import SlideShow from "./components/SlideShow";
import "./App.css";
import Disclaimer from "./components/Disclaimer";
import useDisclaimerState from "./utils/useDisclaimerState";

const App = () => {
  const { disclaimerAccepted, setDisclaimerAccepted } = useDisclaimerState();

  const { tags, npub } = useParams();
  const [searchParams] = useSearchParams();
  const nsfw = searchParams.get("nsfw") === "true";

  console.log(`tags = ${tags}, npub = ${npub}, nsfw = ${nsfw}`);
  return (
    <>
      {disclaimerAccepted ? (
        <SlideShow tags={tags} npub={npub} showNsfw={nsfw} />
      ) : (
        <Disclaimer
          disclaimerAccepted={disclaimerAccepted}
          setDisclaimerAccepted={setDisclaimerAccepted}
        />
      )}
    </>
  );
};

export default App;
