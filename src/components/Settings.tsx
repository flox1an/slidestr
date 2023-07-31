import { FormEvent, useState } from 'react';
import './Settings.css';
import useNav from '../utils/useNav';
import CloseButton from './CloseButton/CloseButton';
import TagEditor, { Tag } from './TagEditor';

type SettingsProps = {
  onClose: () => void;
};

const SettingsDialog = ({ onClose }: SettingsProps) => {
  const { nav, currentSettings } = useNav();
  const [showNsfw, setShowNsfw] = useState(currentSettings.showNsfw || false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(
    currentSettings.tags.map(tag => ({ name: tag, selected: true, deletable: false }))
  );
  const [npubs, setNpubs] = useState(currentSettings.npubs || []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validNpubs = npubs.filter(t => t.length > 0);
    const validTags = selectedTags.filter(t => t.selected).map(t => t.name);
    if (validNpubs.length == 1) {
      nav({ ...currentSettings, tags: [], npubs: validNpubs, showNsfw });
    } else if (validTags.length > 0) {
      nav({ ...currentSettings, tags: validTags, npubs: [], showNsfw });
    } else {
      nav({ ...currentSettings, tags: [], npubs: [], showNsfw });
    }
    onClose();
  };

  return (
    <div className="settings" onClick={e => e.stopPropagation()}>
      <h2>Settings</h2>
      <CloseButton onClick={onClose}></CloseButton>

      <div className="settings-content">
        <label htmlFor="tags">Images for tags:</label>
        <TagEditor selectedTags={selectedTags} setSelectedTags={setSelectedTags} />

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
