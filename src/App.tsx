import { useParams } from "react-router-dom";
import SlideShow from "./components/SlideShow";
import "./App.css";

const App = () => {
  const { tags, npub } = useParams();

  return <SlideShow tags={tags} npub={npub} />;
};

export default App;
