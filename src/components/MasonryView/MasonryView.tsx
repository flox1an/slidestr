import { useEffect, useMemo } from 'react';
import { NostrImage, urlFix } from '../nostrImageDownload';
import './MasonryView.css';
import { Settings } from '../../utils/useNav';
import AuthorProfile from '../AuthorProfile/AuthorProfile';
import { useSwipeable } from 'react-swipeable';
import { Helmet } from 'react-helmet';
import useProfile from '../../utils/useProfile';
import { ViewMode } from '../SlideShow';
import { useGlobalState } from '../../utils/globalState';
import { Dictionary, groupBy } from 'lodash';

type MasonryViewProps = {
  settings: Settings;
  images: NostrImage[];
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
};

const MasonryView = ({ settings, images, currentImage, setCurrentImage, setViewMode }: MasonryViewProps) => {
  const { activeProfile, title } = useProfile(settings);
  const [_, setState] = useGlobalState();

  const numColumns = 4;

  const sortedImages = useMemo(
    () => {
      const sorted = images.sort((a, b) => (b.timestamp && a.timestamp ? b.timestamp - a.timestamp : 0)); // sort by timestamp descending
      const grouped = groupBy(sorted, (i: number) => Math.floor(i / numColumns)) as Dictionary<NostrImage[]>;
      console.log(grouped);
      return grouped;
    },
    [images] // settings is not used here, but we need to include it to trigger a re-render when it changes
  );
  console.log(sortedImages);

  const showNextImage = () => {
    setCurrentImage(idx => (idx !== undefined ? idx + 1 : 0));
  };

  const showPreviousImage = () => {
    setCurrentImage(idx => (idx !== undefined && idx > 0 ? idx - 1 : idx));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    console.log(event);

    if (event.key === 'ArrowRight') {
      showNextImage();
    }
    if (event.key === 'ArrowLeft') {
      showPreviousImage();
    }
    /*
    if (event.key === 'Escape') {
      setCurrentImage(undefined);
    }
    */
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
    setState({ activeImage: undefined });

    if (currentImage) {
      console.log('setting hash to #g' + currentImage);
      window.location.hash = '#g' + currentImage;
    }

    return () => {
      document.body.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="gridview" {...swipeHandlers}>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      {/*
      {currentImage !== undefined ? (
        <DetailsView images={sortedImages} currentImage={currentImage} setCurrentImage={setCurrentImage} />
      ) : null}
       */}
      {(activeProfile || settings.tags.length == 1) && (
        <div className="profile-header">
          {activeProfile ? (
            <AuthorProfile
              src={urlFix(activeProfile.image || '')}
              author={activeProfile.displayName || activeProfile.name}
              npub={activeProfile.npub}
              setViewMode={setViewMode}
              followButton
              externalLink
            ></AuthorProfile>
          ) : (
            settings.tags.map(t => <h2>#{t}</h2>)
          )}
        </div>
      )}
      {/*
      <div className="imagegrid">
        {sortedImages[0] && sortedImages[0].map((image, idx) => (
          <GridImage
            index={idx}
            key={image.url}
            image={image}
            onClick={e => {
              e.stopPropagation();
              setCurrentImage(idx);
              setViewMode('scroll');
            }}
          ></GridImage>
        ))}
      </div>
     */}
    </div>
  );
};

export default MasonryView;
