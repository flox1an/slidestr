import useImageLoaded from "./useImageLoaded";

type SlideProps = {
  url: string;
};

const Slide = ({ url }: SlideProps) => {
  const loaded = useImageLoaded(url);
  return (
    loaded && (
      <div
        className="slide"
        style={{
          backgroundImage: `url(${url})`,
        }}
      ></div>
    )
  );
};

export default Slide;
