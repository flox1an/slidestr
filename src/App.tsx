import { useParams, useSearchParams } from "react-router-dom";
import SlideShow from "./components/SlideShow";
import "./App.css";

const App = () => {
  const { tags, npub } = useParams();
  const [ searchParams ] = useSearchParams();
  const nsfw = searchParams.get("nsfw") === "true";

  return <SlideShow tags={tags} npub={npub} showNsfw={nsfw} />;
};

export default App;
