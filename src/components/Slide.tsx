import SlideImage from "./SlideImage";
import SlideVideo from "./SlideVideo";

type SlideProps = {
  url: string;
  paused: boolean;
  type: "image" | "video";
};

const Slide = ({ url, paused, type }: SlideProps) => {
  return type === "image" ? (
    <SlideImage url={url} paused={paused} />
  ) : (
    <SlideVideo url={url} paused={paused} />
  );
};

export default Slide;
