import { useNavigate } from 'react-router-dom';
import './Disclaimer.css';
import { MouseEvent } from 'react';

const AdultContentInfo = () => {
  const navigate = useNavigate();

  const proceed = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const nsfwPostfix = '?nsfw=true';
    navigate(`${window.location.pathname}${nsfwPostfix}`);
  };
  const goBack = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigate(`/`);
  };

  return (
    <div className="disclaimer">
      <div className="disclaimer-content">
        <div className="warning" style={{ textAlign: 'center' }}>
          NSFW Content Warning
        </div>
        <br />
        You are attempting to access a user profile (npub) or a tag that has been flagged as NSFW (Not Safe For Work).
        This indicates that the content you are about to view might be offensive or inappropriate for certain users. If
        you are under 18 years old, we kindly request that you refrain from proceeding further.
      </div>
      <div className="disclaimer-footer">
        <button type="submit" className="btn" onClick={proceed}>
          Proceed Anyway
        </button>
        &nbsp;&nbsp;
        <button type="submit" className="btn btn-primary" onClick={goBack}>
          Go back
        </button>
      </div>
    </div>
  );
};

export default AdultContentInfo;
