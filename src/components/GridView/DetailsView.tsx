import { NostrImage } from '../nostrImageDownload';
import './DetailsView.css';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import DetailsAuthor from './DetailsAuthor';
import { useEffect, useMemo, useState } from 'react';
import uniq from 'lodash/uniq';
import useNav from '../../utils/useNav';
import CloseButton from '../CloseButton/CloseButton';
import IconHeart from '../Icons/IconHeart';
import { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { Kind, nip19 } from 'nostr-tools';
import { useGlobalState } from '../../utils/globalState';
import IconBolt from '../Icons/IconBolt';

type DetailsViewProps = {
  images: NostrImage[];
  activeImageIdx: number | undefined;
  setActiveImageIdx: (idx: number | undefined) => void;
};

type ZapState = 'none' | 'zapped' | 'zapping' | 'error';

const DetailsView = ({ images, activeImageIdx, setActiveImageIdx }: DetailsViewProps) => {
  const { getProfile, ndk } = useNDK();
  const [selfLiked, setSelfLiked] = useState(false);
  const [zapState, setZapState] = useState<ZapState>('none');

  const [state, setState] = useGlobalState();
  const currentImage = useMemo(
    () => (activeImageIdx !== undefined ? images[activeImageIdx] : undefined),
    [images, activeImageIdx]
  );
  const activeProfile = currentImage?.author !== undefined ? getProfile(currentImage?.author) : undefined;
  const { nav, currentSettings } = useNav();

  useEffect(() => {
    setSelfLiked(false);
    setZapState("none");

    if (!currentImage?.noteId || !state.userNPub) return;

    const filter: NDKFilter = { kinds: [Kind.Reaction], '#e': [currentImage?.noteId] };

    filter.authors = [nip19.decode(state.userNPub).data as string];

    currentImage?.noteId &&
      ndk?.fetchEvents(filter).then(events => {
        setSelfLiked(events.size > 0);
      });
  }, [currentImage?.event.id]);

  const heartClick = async (currentImage: NostrImage) => {
    console.log('heartClick');
    if (!state.userNPub) return;

    const ev = new NDKEvent(ndk, {
      kind: Kind.Reaction,
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
    setSelfLiked(true);
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

  };

  return (
    <div className="details">
      <CloseButton onClick={() => setActiveImageIdx(undefined)}></CloseButton>
      <div className="details-contents">
        <img className="detail-image" src={currentImage?.url}></img>
        <div className="detail-description">
          <DetailsAuthor
            profile={activeProfile}
            npub={currentImage?.author}
            setActiveImageIdx={setActiveImageIdx}
          ></DetailsAuthor>

          <div>{currentImage?.content}</div>
          {state.userNPub && (
            <>
              <div className="heart" onClick={() => currentImage && heartClick(currentImage)}>
                <IconHeart filled={selfLiked}></IconHeart>
              </div>
              <div className={`zap ${zapState}`} onClick={() => currentImage && zapClick(currentImage)}>
                <IconBolt></IconBolt>
              </div>
            </>
          )}
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
