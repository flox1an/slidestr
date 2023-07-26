import { useParams, useSearchParams } from "react-router-dom";
import SlideShow from "./components/SlideShow";
import "./App.css";
import Disclaimer from "./components/Disclaimer";
import useDisclaimerState from "./utils/useDisclaimerState";
import { defaultHashTags } from "./components/env";

const App = () => {
  const { disclaimerAccepted, setDisclaimerAccepted } = useDisclaimerState();

  const { tags, npub } = useParams();
  const [searchParams] = useSearchParams();
  const nsfw = searchParams.get("nsfw") === "true";

  console.log(`tags = ${tags}, npub = ${npub}, nsfw = ${nsfw}`);

  let useTags = tags?.split(",") || [];
  if (npub == undefined && (useTags == undefined || useTags.length == 0)) { 
    useTags = (defaultHashTags);
  }

  return (
    <>
      {disclaimerAccepted ? (
        <SlideShow tags={useTags} npubs={npub ? [npub] : []} showNsfw={nsfw} />
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
