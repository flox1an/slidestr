import { uniq } from 'lodash';
import { NostrImage, urlFix } from '../nostrImageDownload';
import useNav, { Settings } from '../../utils/useNav';
import './styles.css';
import IconChevronDown from '../Icons/IconChevronDown';
import { ViewMode } from '../SlideShow';
import AuthorProfile from '../AuthorProfile';
import useProfile from '../../utils/useProfile';
import { useGlobalState } from '../../utils/globalState';

type InfoPanelProps = {
  image: NostrImage;
  onClose: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  settings: Settings;
};

const InfoPanel = ({ image, onClose, setViewMode, settings }: InfoPanelProps) => {
  const { nav, currentSettings } = useNav();
  const [state] = useGlobalState();
  const { activeProfile, profileNpub } = useProfile(settings, state.activeImage);

  const profile = activeProfile && (
    <AuthorProfile
      src={urlFix(activeProfile.image || '')}
      author={activeProfile.displayName || activeProfile.name}
      npub={profileNpub}
      setViewMode={setViewMode}
    ></AuthorProfile>
  );

  return (
    <div className="infoPanel">
      {profile && <div className="infoPanelAuthor">{profile}</div>}

      <div className="infoPanelContent">{image?.content}</div>
      {image.tags.length > 0 && (
        <div className="infoPanelTags">
          {uniq(image?.tags)
            .filter(t => t[0] == 't')
            .map(t => (
              <>
                <span
                  className="tag"
                  onClick={() => {
                    //setCurrentImage(undefined);
                    setViewMode('grid');
                    nav({ ...currentSettings, tags: [t], npubs: [] });
                  }}
                >
                  {t}
                </span>{' '}
              </>
            ))}
        </div>
      )}
      <div className="infoPanelFooter">
        <button onClick={() => onClose()}>
          <IconChevronDown />
        </button>
      </div>
    </div>
  );
};

export default InfoPanel;
