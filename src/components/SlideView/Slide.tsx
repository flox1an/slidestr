import { useEffect } from "react";
import SlideImage from "./SlideImage";
import SlideVideo from "./SlideVideo";

type SlideProps = {
  url: string;
  paused: boolean;
  type: "image" | "video";
  onAnimationEnded?: () => void;
  animationDuration?: number;
};

const Slide = ({
  url,
  paused,
  type,
  onAnimationEnded,
  animationDuration = 12,
}: SlideProps) => {
  useEffect(() => {
    const handle = setTimeout(() => {
      onAnimationEnded && onAnimationEnded();
    }, animationDuration * 1000);
    return () => {
      clearTimeout(handle);
    };
  }, []);

  return type === "image" ? (
    <SlideImage
      url={url}
      paused={paused}
      style={{ animationDuration: `${animationDuration}s` }}
    />
  ) : (
    <SlideVideo
      url={url}
      paused={paused}
      style={{ animationDuration: `${animationDuration}s` }}
    />
  );
};

export default Slide;
