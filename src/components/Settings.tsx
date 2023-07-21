import { FormEvent, useState } from "react";
import "./Settings.css";
import { useNavigate, useSearchParams } from "react-router-dom";


type Settings = {
    showNsfw: boolean;

}
type SettingsProps = {
    onClose: () => void;
    settings: Settings;

};

const Settings = ({onClose, settings} : SettingsProps) => {
  const [showNsfw, setShowNsfw] = useState(settings.showNsfw);
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`${window.location.pathname}?nsfw=${showNsfw}`);
    onClose();
  };

  return (
    <div className="settings">
      <div className="settings-content">
        {/* 
        <label htmlFor="tags">Tags</label>
        <input type="text" name="tags" id="tags" />
        <label htmlFor="npub">Npub</label>
        <input type="text" name="npub" id="npub" />
        */}
        <div className="content-warning">
          <div>
            <input
              type="checkbox"
              checked={showNsfw}
              onChange={(e) => setShowNsfw(e.target.checked)}
            />
          </div>
          <div>
            <div className="warning">NSFW Content</div>
            Allow NSFW to be shown and ignore content warnings.
          </div>
        </div>
      </div>
      <div className="settings-footer">
        <button type="submit" className="btn btn-primary" onClick={onSubmit}>
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
