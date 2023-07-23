import useImageLoaded from "../utils/useImageLoaded";

type SlideImageProps = {
  url: string;
  paused: boolean;
};

const SlideImage = ({ url, paused }: SlideImageProps) => {
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

export default SlideImage