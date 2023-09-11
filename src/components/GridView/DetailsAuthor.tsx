import useNav from '../../utils/useNav';
import { createImgProxyUrl } from '../nostrImageDownload';
import './DetailsView.css';
import { NDKUserProfile } from '@nostr-dev-kit/ndk';

type DetailsAuthorProps = {
  profile?: NDKUserProfile;
  npub?: string;
  setActiveImageIdx: (idx: number | undefined) => void;
};

const DetailsAuthor = ({ profile, npub, setActiveImageIdx }: DetailsAuthorProps) => {
  const { nav, currentSettings } = useNav();

  return (
    <div
      className="details-author"
      onClick={() => {
        setActiveImageIdx(undefined);
        npub && nav({ ...currentSettings, tags: [], npubs: [npub] });
      }}
    >
      <div
        className="author-image"
        style={{
          backgroundImage: profile?.image ? `url(${createImgProxyUrl(profile?.image, 80, 80)})` : 'none',
        }}
      ></div>

      <div className="author-name">{profile?.displayName || profile?.name}</div>
    </div>
  );
};

export default DetailsAuthor;
