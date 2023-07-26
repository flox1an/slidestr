import useImageLoaded from "../../utils/useImageLoaded";

type SlideImageProps = {
  url: string;
  paused: boolean;
  style?: React.CSSProperties;
};

const SlideImage = ({ url, paused, style }: SlideImageProps) => {
  const loaded = useImageLoaded(url);
  return (
    loaded && (
      <div
        className={`slide ${paused ? "paused" : ""}`}
        style={{
          backgroundImage: `url(${url})`,
          ...style,
        }}
      ></div>
    )
  );
};

export default SlideImage;
