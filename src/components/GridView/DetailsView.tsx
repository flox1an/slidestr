import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';
import './DetailsView.css';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import DetailsAuthor from './DetailsAuthor';
import { useEffect, useMemo, useState } from 'react';
import uniq from 'lodash/uniq';
import useNav from '../../utils/useNav';
import CloseButton from '../CloseButton/CloseButton';
import IconHeart from '../Icons/IconHeart';
import { nip19 } from 'nostr-tools';
import { useGlobalState } from '../../utils/globalState';
import IconBolt from '../Icons/IconBolt';
import useWindowSize from '../../utils/useWindowSize';
import IconLink from '../Icons/IconLink';
import IconDots from '../Icons/IconDots';
import useZapsAndReations from '@/utils/useZapAndReaction';

type DetailsViewProps = {
  images: NostrImage[];
  currentImage: number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
};

const DetailsView = ({ images, currentImage, setCurrentImage }: DetailsViewProps) => {
  const { getProfile } = useNDK();
  const [state, setState] = useGlobalState();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const size = useWindowSize();

  const currentImageData = useMemo(
    () => (currentImage !== undefined ? images[currentImage] : undefined),
    [images, currentImage]
  );
  
  const nextImageData = useMemo(
    () => (currentImage !== undefined ? images[currentImage + 1] : undefined),
    [images, currentImage]
  );

  const { zapClick, heartClick, zapState, heartState } = useZapsAndReations(currentImageData, state.userNPub);

  useEffect(() => {
    setState({ ...state, showNavButtons: false });
    return () => setState({ ...state, showNavButtons: true });
  }, []);

  const activeProfile = currentImageData?.author !== undefined ? getProfile(currentImageData?.author) : undefined;
  const { nav, currentSettings } = useNav();

  const imageWidth = useMemo(() => (size.width && size.width > 1600 ? 1600 : 800), [size.width]);
  const nextImageProxyUrl = nextImageData?.url && createImgProxyUrl(nextImageData?.url, imageWidth, -1);
  const currentImageProxyUrl = currentImageData?.url && createImgProxyUrl(currentImageData?.url, imageWidth, -1);

  if (!currentImageData) return null;

  // TODO unmute video through icon

  return (
    <>
      <CloseButton onClick={() => setCurrentImage(undefined)}></CloseButton>
      <div className="details" onClick={() => setShowMoreMenu(false)}>
        {nextImageData && !isVideo(nextImageData.url) && (
          <img src={nextImageProxyUrl} loading="eager" style={{ display: 'none' }} />
        )}
        {nextImageData && isVideo(nextImageData.url) && (
          <video src={nextImageData?.url} preload="true" style={{ display: 'none' }} />
        )}
        <div
          className="details-contents"
          style={{ backgroundImage: `url(${!isVideo(currentImageData.url) ? currentImageProxyUrl : ''})` }}
        >
          {isVideo(currentImageData.url) ? (
            <video className="detail-image" src={currentImageData.url} autoPlay loop muted playsInline></video>
          ) : (
            <img className="detail-image" src={currentImageProxyUrl} loading="eager"></img>
          )}
          <div className="detail-description">
            <DetailsAuthor
              profile={activeProfile}
              npub={currentImageData?.author}
              setActiveImageIdx={setCurrentImage}
            ></DetailsAuthor>

            {currentImageData?.content && <div className="details-text">{currentImageData?.content}</div>}

            <div className="details-actions">
              {state.userNPub && (
                <>
                  <div className={`heart ${heartState}`} onClick={() => currentImage && heartClick(currentImageData)}>
                    <IconHeart></IconHeart>
                  </div>
                  {(activeProfile?.lud06 || activeProfile?.lud16) && (
                    <div className={`zap ${zapState}`} onClick={() => currentImage && zapClick(currentImageData)}>
                      <IconBolt></IconBolt>
                    </div>
                  )}
                </>
              )}
              {nextImageData?.noteId && (
                <a
                  className="link"
                  target="_blank"
                  href={`https://nostrapp.link/#${nip19.noteEncode(currentImageData?.noteId)}`}
                >
                  <IconLink></IconLink>
                </a>
              )}
              {
                <div
                  className="more"
                  onClick={e => {
                    e.stopPropagation();
                    setShowMoreMenu(s => !s);
                  }}
                >
                  <IconDots></IconDots>
                  <div className={`more-menu ${showMoreMenu ? 'show' : ''}`}>
                    <a
                      className="more-action"
                      target="_blank"
                      href={`https://nostrapp.link/#${nip19.noteEncode(currentImageData?.noteId)}?select=true`}
                    >
                      <IconLink></IconLink>Open note with...
                    </a>
                    <a
                      className="more-action"
                      target="_blank"
                      href={`https://nostrapp.link/#${currentImageData?.author}`}
                    >
                      <IconLink></IconLink>Open author profile
                    </a>
                    {/*
                <a className="more-action">
                  <IconLink></IconLink>Repost
                </a>
                <a className="more-action">
                  <IconLink></IconLink>Follow author
                </a>
                 */}
                  </div>
                </div>
              }
            </div>

            {currentImageData.tags.length > 0 && (
              <div>
                {uniq(currentImageData?.tags).map(t => (
                  <>
                    <span
                      className="tag"
                      onClick={() => {
                        setCurrentImage(undefined);
                        nav({ ...currentSettings, tags: [t], npubs: [] });
                      }}
                    >
                      {t}
                    </span>{' '}
                  </>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailsView;
