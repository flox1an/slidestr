import useImageLoaded from "../utils/useImageLoaded";

type SlideProps = {
  url: string;
  paused: boolean;
};

const Slide = ({ url, paused }: SlideProps) => {
  const loaded = useImageLoaded(url);
  return (
    loaded && (
      <div
        className={`slide ${paused ? "paused" : ""}`}
        style={{
          backgroundImage: `url(${url})`,
        }}
      ></div>
    )
  );
};

export default Slide;
