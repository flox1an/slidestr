import { useEffect, useMemo, useState } from 'react';
import { NostrImage, isVideo } from '../nostrImageDownload';
import './GridView.css';
import DetailsView from './DetailsView';
import GridImage from './GridImage';
import { Settings } from '../../utils/useNav';

type GridViewProps = {
  settings: Settings;
  images: NostrImage[];
};

const GridView = ({ settings, images }: GridViewProps) => {
  const [activeImageIdx, setActiveImageIdx] = useState<number | undefined>();

  const sortedImages = useMemo(
    () =>
      images
        .filter(i => !isVideo(i.url)) // TODO: filter out video for now, since we don't have a good way to display them
        .sort((a, b) => (b.timestamp && a.timestamp ? b.timestamp - a.timestamp : 0)), // sort by timestamp descending
    [images]
  );

  const onKeyDown = (event: KeyboardEvent) => {
    console.log(event);
    if (event.key === 'ArrowRight') {
      setActiveImageIdx(idx => (idx !== undefined && idx < sortedImages.length - 1 ? idx + 1 : idx));
    }
    if (event.key === 'ArrowLeft') {
      setActiveImageIdx(idx => (idx !== undefined && idx > 0 ? idx - 1 : idx));
    }
    if (event.key === 'Escape') {
      setActiveImageIdx(undefined);
    }
  };

  useEffect(() => {
    document.body.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="gridview">
      {activeImageIdx !== undefined ? (
        <DetailsView images={sortedImages} activeImageIdx={activeImageIdx} setActiveImageIdx={setActiveImageIdx} />
      ) : null}
      <div className="imagegrid">
        {sortedImages.map((image, idx) =>
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
            <GridImage key={image.url} image={image} onClick={() => setActiveImageIdx(idx)}></GridImage>
          )
        )}
      </div>
    </div>
  );
};

export default GridView;
