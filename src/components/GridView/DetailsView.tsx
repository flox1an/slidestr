import { NostrImage } from '../nostrImageDownload';
import './DetailsView.css';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import DetailsAuthor from './Author';
import { useMemo } from 'react';
import uniq from 'lodash/uniq';
import useNav from '../../utils/useNav';

type DetailsViewProps = {
  images: NostrImage[];
  activeImageIdx: number | undefined;
  setActiveImageIdx: (idx: number | undefined) => void;
};

const DetailsView = ({ images, activeImageIdx, setActiveImageIdx }: DetailsViewProps) => {
  const { getProfile } = useNDK();
  const currentImage = useMemo(
    () => (activeImageIdx !== undefined ? images[activeImageIdx] : undefined),
    [images, activeImageIdx]
  );
  const activeProfile = currentImage?.author !== undefined ? getProfile(currentImage?.author) : undefined;
  const { nav, currentSettings } = useNav();

  return (
    <div className="details">
      <div
        className="closeButton"
        onClick={() => {
          setActiveImageIdx(undefined);
        }}
      >
        ✕
      </div>
      <div className="details-contents">
        <img className="detail-image" src={currentImage?.url}></img>
        <div className="detail-description">
          <DetailsAuthor
            profile={activeProfile}
            npub={currentImage?.author}
            setActiveImageIdx={setActiveImageIdx}
          ></DetailsAuthor>

          <div>{currentImage?.content}</div>
          <div>
            {uniq(currentImage?.tags).map(t => (
              <>
                <span
                  className="tag"
                  onClick={() => {
                    setActiveImageIdx(undefined);
                    nav({ ...currentSettings, tags: [t], npubs: [] });
                  }}
                >
                  {t}
                </span>{' '}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsView;
