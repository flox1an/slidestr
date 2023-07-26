import useImageLoaded from "../../utils/useImageLoaded";

type SlideImageProps = {
  url: string;
  paused: boolean;
  style?: React.CSSProperties;
  noteId: string;
};

const SlideImage = ({ url, paused, style, noteId }: SlideImageProps) => {
  const loaded = useImageLoaded(url);
  return (
    loaded && (
      <div
        className={`slide ${paused ? "paused" : ""}`}
        data-node-id={noteId}
        style={{
          backgroundImage: `url(${url})`,
          ...style,
        }}
      ></div>
    )
  );
};

export default SlideImage;
