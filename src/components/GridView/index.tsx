import { useMemo, useState } from 'react';
import Settings from '../Settings';
import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';
import './GridView.css';
import Slide from '../SlideView/Slide';

type GridViewProps = {
  settings: Settings;
  images: NostrImage[];
};

const GridView = ({ settings, images }: GridViewProps) => {
  const [activeImage, setActiveImage] = useState<NostrImage | undefined>();

  const sortedImages = useMemo(
    () =>
      images
        .filter(i => !isVideo(i.url)) // TODO: filter out video for now, since we don't have a good way to display them
        .sort((a, b) => (b.timestamp && a.timestamp ? b.timestamp - a.timestamp : 0)), // sort by timestamp descending
    [images]
  );

  return (
    <>
      {activeImage && (
        <Slide
          url={activeImage.url}
          noteId={activeImage.noteId}
          type={activeImage.type}
          paused={false}
          onAnimationEnded={() => setActiveImage(undefined)}
          animationDuration={4}
        ></Slide>
      )}
      <div className="imagegrid">
        {sortedImages.map(image =>
          isVideo(image.url) ? (
            <video
              className="image"
              data-node-id={image.noteId}
              key={image.url}
              src={image.url}
              controls
              preload="none"
            />
          ) : (
            <img
              onClick={() => setActiveImage(image)}
              data-node-id={image.noteId}
              className="image"
              loading="lazy"
              key={image.url}
              src={createImgProxyUrl(image.url)}
            ></img>
          )
        )}
      </div>
    </>
  );
};

export default GridView;
