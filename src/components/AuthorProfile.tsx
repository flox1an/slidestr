import './SlideShow.css';
import useImageLoaded from '../utils/useImageLoaded';
import { createImgProxyUrl } from './nostrImageDownload';
import useNav from '../utils/useNav';

type AvatarImageProps = {
  src?: string;
  author?: string;
  npub?: string;
  setShowGrid?: (showGrid: boolean) => void;
};

const AuthorProfile = ({ src, author, npub, setShowGrid }: AvatarImageProps) => {
  const avatarLoaded = useImageLoaded(src);
  const { nav, currentSettings } = useNav();
  return (
    <div
      className="author-info"
      onClick={() => {
        setShowGrid && setShowGrid(true);
        npub && nav({ ...currentSettings, tags: [], npubs: [npub] });
      }}
    >
      <div>
        {avatarLoaded && (
          <div
            className="author-image"
            style={{
              backgroundImage: src ? `url(${createImgProxyUrl(src, 80, 80)})` : 'none',
            }}
          ></div>
        )}
        {author}
      </div>
    </div>
  );
};

export default AuthorProfile;
