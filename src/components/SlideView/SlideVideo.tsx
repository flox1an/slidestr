type SlideVideoProps = {
  url: string;
  paused: boolean;
  style?: React.CSSProperties;
  noteId: string;
};

const SlideVideo = ({ url, paused, style, noteId }: SlideVideoProps) => {
  return (
    <div className={`slide ${paused ? "paused" : ""}`} style={style}>
      <video src={url} autoPlay loop muted playsInline data-node-id={noteId} />
    </div>
  );
};

export default SlideVideo;
