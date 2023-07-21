import { FormEvent, useState } from "react";
import "./Settings.css";
import { useNavigate, useSearchParams } from "react-router-dom";

const Settings = () => {
  const [showNsfw, setShowNsfw] = useState(false);
  const navigate = useNavigate();
  const [_, setSearchParams] = useSearchParams();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    //navigate(`/tags/foodstr?nsfw=${showNsfw}`);
    setSearchParams({ nsfw: showNsfw.toString() });
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
          Save
        </button>
      </div>
    </div>
  );
};

export default Settings;
