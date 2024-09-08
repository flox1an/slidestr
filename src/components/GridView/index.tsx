import { useEffect } from 'react';
import { NostrImage, urlFix } from '../nostrImageDownload';
import './GridView.css';
import GridImage from './GridImage';
import useNav, { Settings } from '../../utils/useNav';
import AuthorProfile from '../AuthorProfile/AuthorProfile';
import { useSwipeable } from 'react-swipeable';
import { Helmet } from 'react-helmet';
import useActiveProfile from '../../utils/useActiveProfile';
import { ViewMode } from '../SlideShow';
import { useGlobalState } from '../../utils/globalState';
import useTitle from '../../utils/useTitle';

type GridViewProps = {
  settings: Settings;
  images: NostrImage[];
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
};

const GridView = ({ settings, images, currentImage, setCurrentImage, setViewMode }: GridViewProps) => {
  const { activeProfile, activeNpub } = useActiveProfile(settings);
  const title = useTitle(settings, activeProfile);
  const [_, setState] = useGlobalState();
  const showNextImage = () => {
    setCurrentImage(idx => (idx !== undefined ? idx + 1 : 0));
  };
  const { nav, currentSettings } = useNav();

  const showPreviousImage = () => {
    setCurrentImage(idx => (idx !== undefined && idx > 0 ? idx - 1 : idx));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      showNextImage();
    }
    if (event.key === 'ArrowLeft') {
      showPreviousImage();
    }
    if (event.key === 'Escape') {
      nav({
        ...currentSettings,
        topic: undefined,
        npubs: [],
        tags: [],
        list: undefined,
      });
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

      {(activeProfile || settings.tags.length == 1) && (
        <div className="profile-header">
          {activeProfile ? (
            <AuthorProfile
              src={urlFix(activeProfile.image || '')}
              author={activeProfile.displayName || activeProfile.name}
              npub={activeNpub}
              setViewMode={setViewMode}
              followButton
              externalLink
            ></AuthorProfile>
          ) : (
            settings.tags.map(t => <h2>#{t}</h2>)
          )}
        </div>
      )}

      <div className="imagegrid">
        {images.map((image, idx) => (
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
