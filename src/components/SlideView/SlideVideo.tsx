type SlideVideoProps = {
  url: string;
  paused: boolean;
  style?: React.CSSProperties;
};

const SlideVideo = ({ url, paused, style }: SlideVideoProps) => {
  return (
    <div className={`slide ${paused ? "paused" : ""}`} style={style}>
      <video src={url} autoPlay loop muted playsInline />
    </div>
  );
};

export default SlideVideo;
