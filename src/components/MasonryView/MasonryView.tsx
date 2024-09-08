import { useEffect, useMemo } from 'react';
import { NostrImage, urlFix } from '../nostrImageDownload';
import './MasonryView.css';
import { Settings } from '../../utils/useNav';
import AuthorProfile from '../AuthorProfile/AuthorProfile';
import { useSwipeable } from 'react-swipeable';
import { Helmet } from 'react-helmet';
import useActiveProfile from '../../utils/useActiveProfile';
import { ViewMode } from '../SlideShow';
import { useGlobalState } from '../../utils/globalState';
import MasonryImage from './MasonryImage';
import useWindowSize from '../../utils/useWindowSize';
import { topics } from '../env';
import useTitle from '../../utils/useTitle';

type MasonryViewProps = {
  settings: Settings;
  images: NostrImage[];
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
};

type MImage = NostrImage & {
  orgIndex: number;
};

const MasonryView = ({ settings, images, currentImage, setCurrentImage, setViewMode }: MasonryViewProps) => {
  const { activeProfile, activeNpub } = useActiveProfile(settings);
  const title = useTitle(settings, activeProfile);
  const [_, setState] = useGlobalState();
  const { width } = useWindowSize();

  const columnCount = Math.min(7, Math.floor((width || 800) / 230));
  const sortedImages = useMemo(
    () => {
      // console.log('Updating sortedImages');
      //const sorted = images.sort((a, b) => (b.timestamp && a.timestamp ? b.timestamp - a.timestamp : 0)); // sort by timestamp descending

      // Initialize an array of arrays to hold the columns.
      const columns: MImage[][] = Array.from({ length: columnCount }, () => []);

      // Initialize an array to keep track of the total height of each column.
      //const columnHeights: number[] = new Array(columnCount).fill(0);
      let columnIndex = 0;
      // Iterate over each image and assign it to the column with the least total height.
      images.forEach((image, idx) => {
        // Find the column with the least total height.
        // const columnIndex = columnHeights.indexOf(Math.min(...columnHeights));

        // Add the image to the selected column.
        columns[columnIndex].push({ orgIndex: idx, ...image });

        // Update the total height of the selected column.
        //columnHeights[columnIndex] += image.height;

        columnIndex = (columnIndex + 1) % columnCount;
      });

      return columns;
    },

    [images, columnCount] // settings is not used here, but we need to include it to trigger a re-render when it changes
  );
  // console.log(sortedImages);
  const showNextImage = () => {
    setCurrentImage(idx => (idx !== undefined ? idx + 1 : 0));
  };

  const showPreviousImage = () => {
    setCurrentImage(idx => (idx !== undefined && idx > 0 ? idx - 1 : idx));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    //console.log(event);

    if (event.key === 'ArrowRight') {
      showNextImage();
    }
    if (event.key === 'ArrowLeft') {
      showPreviousImage();
    }
    if (event.key === 'Escape') {
      setCurrentImage(undefined);
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
    <div className="mason-view" {...swipeHandlers}>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      {(activeProfile || settings.topic || settings.tags.length == 1) && (
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
          ) : settings.topic ? (
            <h2>Topic: {topics[settings.topic].name || settings.topic}</h2>
          ) : (
            settings.tags.map(t => <h2>#{t}</h2>)
          )}
        </div>
      )}
      {
        <div
          className="mason-imagegrid"
          style={{ gridTemplateColumns: `repeat(${columnCount}, calc(100%/${columnCount} - 12px))` }}
        >
          {sortedImages.map((columnImages, colIdx) => (
            <div className="column" key={colIdx}>
              {columnImages.map(image => (
                <MasonryImage
                  index={image.orgIndex}
                  key={image.url}
                  image={image}
                  onClick={e => {
                    e.stopPropagation();
                    setCurrentImage(image.orgIndex);
                    setViewMode('scroll');
                  }}
                ></MasonryImage>
              ))}
            </div>
          ))}
        </div>
      }
    </div>
  );
};

export default MasonryView;
