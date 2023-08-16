import { useEffect, useMemo, useState } from 'react';
import { NostrImage, isVideo, urlFix } from '../nostrImageDownload';
import './GridView.css';
import DetailsView from './DetailsView';
import GridImage from './GridImage';
import { Settings } from '../../utils/useNav';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import AuthorProfile from '../AuthorProfile';
import { useSwipeable } from 'react-swipeable';

type GridViewProps = {
  settings: Settings;
  images: NostrImage[];
};

const GridView = ({ settings, images }: GridViewProps) => {
  const [activeImageIdx, setActiveImageIdx] = useState<number | undefined>();
  const { getProfile } = useNDK();

  const sortedImages = useMemo(
    () =>
      images
        .filter(i => !isVideo(i.url)) // TODO: filter out video for now, since we don't have a good way to display them
        .sort((a, b) => (b.timestamp && a.timestamp ? b.timestamp - a.timestamp : 0)), // sort by timestamp descending
    [images, settings] // settings is not used here, but we need to include it to trigger a re-render when it changes
  );

  const showNextImage = () => {
    setActiveImageIdx(idx => (idx !== undefined ? idx + 1 : 0));
  };

  const showPreviousImage = () => {
    setActiveImageIdx(idx => (idx !== undefined && idx > 0 ? idx - 1 : idx));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    console.log(event);

    if (event.key === 'ArrowRight') {
      showNextImage();
    }
    if (event.key === 'ArrowLeft') {
      showPreviousImage();
    }
    if (event.key === 'Escape') {
      setActiveImageIdx(undefined);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      showNextImage();
    },
    onSwipedRight: () => {
      showPreviousImage();
    },
  });

  useEffect(() => {
    document.body.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const activeProfile = settings.npubs.length == 1 && getProfile(settings.npubs[0]);

  return (
    <div className="gridview" {...swipeHandlers}>
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
      {activeProfile && (
        <AuthorProfile
          src={urlFix(activeProfile.image || '')}
          author={activeProfile.displayName || activeProfile.name}
          npub={activeProfile.npub}
        ></AuthorProfile>
      )}
    </div>
  );
};

export default GridView;
