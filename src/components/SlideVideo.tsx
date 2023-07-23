
type SlideVideoProps = {
  url: string;
  paused: boolean;
};

const SlideVideo = ({ url, paused }: SlideVideoProps) => {
  return (
    <div className={`slide ${paused ? "paused" : ""}`}>
      <video src={url} autoPlay loop muted playsInline />
    </div>
  );
};

export default SlideVideo;
