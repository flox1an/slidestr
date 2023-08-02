import { FormEvent, useState } from 'react';
import './Settings.css';
import useNav from '../utils/useNav';
import CloseButton from './CloseButton/CloseButton';
import TagEditor, { Tag } from './TagEditor';
import { defaultHashTags } from './env';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import { createImgProxyUrl } from './nostrImageDownload';

type SettingsProps = {
  onClose: () => void;
};

type Mode = 'all' | 'tags' | 'user';

const SettingsDialog = ({ onClose }: SettingsProps) => {
  const { nav, currentSettings } = useNav();
  const { getProfile } = useNDK();
  const [showNsfw, setShowNsfw] = useState(currentSettings.showNsfw || false);
  const [showReplies, setShowReplies] = useState(currentSettings.showReplies || false);
  const [showReposts, setShowReposts] = useState(currentSettings.showReposts || false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(
    currentSettings.tags.map(tag => ({ name: tag, selected: true, deletable: false }))
  );
  const [npubs, setNpubs] = useState(currentSettings.npubs || []);
  const [mode, setMode] = useState<Mode>(
    currentSettings.npubs.length == 1 ? 'user' : currentSettings.tags.length > 0 ? 'tags' : 'all'
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validNpubs = npubs.filter(t => t.length > 0);
    const validTags = selectedTags.filter(t => t.selected).map(t => t.name);

    if (mode == 'user' && validNpubs.length == 1) {
      nav({ ...currentSettings, tags: [], npubs: validNpubs, showNsfw, showReplies, showReposts });
    } else if (mode == 'tags' && validTags.length > 0) {
      nav({ ...currentSettings, tags: validTags, npubs: [], showNsfw, showReplies, showReposts });
    } else if (mode == 'tags') {
      nav({ ...currentSettings, tags: defaultHashTags, npubs: [], showNsfw, showReplies, showReposts });
    } else {
      nav({ ...currentSettings, tags: [], npubs: [], showNsfw, showReplies, showReposts });
    }

    onClose();
  };

  const activeProfile = npubs.length > 0 ? getProfile(npubs[0]) : undefined;

  return (
    <div className="settings" onClick={e => e.stopPropagation()}>
      <h2>Browse settings</h2>
      <CloseButton onClick={onClose}></CloseButton>

      <div className="settings-content">
        <div className="settings-mode">
          <div className={mode == 'tags' ? 'active' : ''} onClick={() => setMode('tags')}>
            By tags
          </div>
          <div className={mode == 'user' ? 'active' : ''} onClick={() => setMode('user')}>
            By user profile
          </div>
          <div className={mode == 'all' ? 'active' : ''} onClick={() => setMode('all')}>
            All of nostr
          </div>
        </div>
        {mode == 'tags' && (
          <>
            <label htmlFor="tags"></label>
            <TagEditor selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
          </>
        )}
        {mode == 'user' && (
          <>
            <label htmlFor="npub">Images for user profile (npub):</label>
            <input
              type="text"
              name="npub"
              id="npub"
              value={npubs.join(', ')}
              onChange={e => setNpubs(e.target.value.split(',').map(t => t.trim().toLowerCase()))}
              onKeyDown={e => e.stopPropagation()}
              onKeyUp={e => e.stopPropagation()}
            />
            {activeProfile && (
              <div className="details-author">
                <div
                  className="author-image"
                  style={{
                    backgroundImage: activeProfile?.image
                      ? `url(${createImgProxyUrl(activeProfile?.image, 80, 80)})`
                      : 'none',
                  }}
                ></div>
                {activeProfile?.displayName || activeProfile?.name}
              </div>
            )}
            <div className="replies">
              <div>
                <input
                  name="replies"
                  type="checkbox"
                  checked={showReplies}
                  onChange={e => setShowNsfw(e.target.checked)}
                />
              </div>
              <label htmlFor="replies" onClick={() => setShowReplies(n => !n)} style={{ userSelect: 'none' }}>
                Include Replys
              </label>
            </div>
            <div className="reposts">
              <input
                name="reposts"
                type="checkbox"
                checked={showReposts}
                onChange={e => setShowNsfw(e.target.checked)}
              />
              <label htmlFor="reposts" onClick={() => setShowReposts(n => !n)} style={{ userSelect: 'none' }}>
                Include Reposts
              </label>
            </div>
          </>
        )}
        <div className="content-warning">
          <div>
            <input name="nsfw" type="checkbox" checked={showNsfw} onChange={e => setShowNsfw(e.target.checked)} />
          </div>
          <label htmlFor="nsfw" onClick={() => setShowNsfw(n => !n)} style={{ userSelect: 'none' }}>
            <div className="warning">NSFW Content</div>
            Allow NSFW to be shown and ignore content warnings.
          </label>
        </div>
      </div>
      <div className="settings-footer">
        <button type="submit" className="btn btn-primary" onClick={onSubmit}>
          Apply settings
        </button>
      </div>
    </div>
  );
};

export default SettingsDialog;
