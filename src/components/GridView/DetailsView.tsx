import { NostrImage, createImgProxyUrl, isVideo } from '../nostrImageDownload';
import './DetailsView.css';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import DetailsAuthor from './DetailsAuthor';
import { useEffect, useMemo, useState } from 'react';
import uniq from 'lodash/uniq';
import useNav from '../../utils/useNav';
import CloseButton from '../CloseButton/CloseButton';
import IconHeart from '../Icons/IconHeart';
import { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { nip19 } from 'nostr-tools';
import { useGlobalState } from '../../utils/globalState';
import IconBolt from '../Icons/IconBolt';
import useWindowSize from '../../utils/useWindowSize';
import IconLink from '../Icons/IconLink';
import IconDots from '../Icons/IconDots';

type DetailsViewProps = {
  images: NostrImage[];
  currentImage:  number | undefined;
  setCurrentImage: React.Dispatch<React.SetStateAction<number | undefined>>;
};

type ZapState = 'none' | 'zapped' | 'zapping' | 'error';
type HeartState = 'none' | 'liked' | 'liking';

const DetailsView = ({ images, currentImage, setCurrentImage }: DetailsViewProps) => {
  const { getProfile, ndk } = useNDK();
  const [zapState, setZapState] = useState<ZapState>('none');
  const [heartState, setHeartState] = useState<HeartState>('none');
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

  useEffect(() => {
    setState({ ...state, showNavButtons: false });
    return () => setState({ ...state, showNavButtons: true });
  }, []);

  const activeProfile = currentImageData?.author !== undefined ? getProfile(currentImageData?.author) : undefined;
  const { nav, currentSettings } = useNav();

  const fetchLikeAndZaps = async (noteIds: string[], selfNPub: string) => {
    const filter: NDKFilter = { kinds: [7], '#e': noteIds }; // Kind Reaction

    filter.authors = [nip19.decode(selfNPub).data as string];

    const events = await ndk?.fetchEvents(filter);

    return { selfLiked: events && events.size > 0 };
  };

  useEffect(() => {
    setZapState('none');
    setHeartState('none');

    if (!currentImageData?.noteId || !state.userNPub) return;

    if (currentImageData.post.wasLiked !== undefined) {
      setHeartState(currentImageData.post.wasLiked ? 'liked' : 'none');
      return;
    }

    fetchLikeAndZaps([currentImageData.noteId], state.userNPub).then(likes => {
      currentImageData.post.wasLiked = likes.selfLiked;
      setHeartState(likes.selfLiked ? 'liked' : 'none');
    });
  }, [currentImageData?.post.event.id]);

  const heartClick = async (currentImage: NostrImage) => {
    setHeartState('liking');
    console.log('heartClick');
    if (!state.userNPub) return;

    const ev = new NDKEvent(ndk, {
      kind: 7, // Reaction
      pubkey: nip19.decode(state.userNPub).data as string,
      created_at: Math.floor(new Date().getTime() / 1000),
      content: '+',
      tags: [
        ['e', currentImage.noteId],
        ['p', currentImage.authorId],
      ],
    });
    console.log(ev);
    await ev.publish();
    setHeartState('liked');
    currentImage.post.wasLiked = true;
  };

  const zapClick = async (currentImage: NostrImage) => {
    setZapState('zapping');
    console.log('zapClick');
    if (!state.userNPub) return;

    if (!window.webln) {
      console.error('No webln found');
      setZapState('error');
      return;
    }
    console.log('zapClick2');

    const ev = await ndk?.fetchEvent(currentImage.noteId);

    if (!ev) {
      console.error('No event found for noteId: ' + currentImage.noteId);
      setZapState('error');
      return;
    }

    console.log(ev);
    const invoice = await ev.zap(21000, 'Nice!');
    console.log('zapClick3');

    console.log(invoice);
    if (!invoice) {
      console.error('No invoice found');
      setZapState('error');
      return;
    }
    await window.webln.enable();
    await window.webln.sendPayment(invoice);

    setZapState('zapped');
    currentImage.post.wasZapped = true;
  };

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
                    <a className="more-action" target="_blank" href={`https://nostrapp.link/#${currentImageData?.author}`}>
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
