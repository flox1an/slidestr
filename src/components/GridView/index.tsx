import { useEffect, useMemo } from 'react';
import { NostrImage, urlFix } from '../nostrImageDownload';
import './GridView.css';
import GridImage from './GridImage';
import { Settings } from '../../utils/useNav';
import AuthorProfile from '../AuthorProfile';
import { useSwipeable } from 'react-swipeable';
import { Helmet } from 'react-helmet';
import useProfile from '../../utils/useProfile';
import { ViewMode } from '../SlideShow';

type GridViewProps = {
  settings: Settings;
  images: NostrImage[];
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
};

const GridView = ({ settings, images, currentImage, setCurrentImage, setViewMode }: GridViewProps) => {
  const { activeProfile, title } = useProfile(settings);

  const sortedImages = useMemo(
    () => images.sort((a, b) => (b.timestamp && a.timestamp ? b.timestamp - a.timestamp : 0)), // sort by timestamp descending
    [images, settings] // settings is not used here, but we need to include it to trigger a re-render when it changes
  );

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
      {activeProfile && (
        <div className="profile-header">
          <AuthorProfile
            src={urlFix(activeProfile.image || '')}
            author={activeProfile.displayName || activeProfile.name}
            npub={activeProfile.npub}
            setViewMode={setViewMode}
          ></AuthorProfile>
          {/*
          <span>{activeProfile.banner}</span>
          <span>{activeProfile.bio}</span>
          {activeProfile.website}
          */}
        </div>
      )}

      <div className="imagegrid">
        {sortedImages.map((image, idx) => (
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
    </div>
  );
};

export default GridView;
