import './Disclaimer.css';
import { MouseEvent } from 'react';
import useNav from '../utils/useNav';

const AdultContentInfo = () => {
  const { nav, currentSettings } = useNav();

  const proceed = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    nav({ ...currentSettings, showAdult: true });
  };
  const goBack = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    nav({ ...currentSettings, npubs: [], tags: [], showAdult: false });
  };

  return (
    <div className="disclaimer">
      <div className="disclaimer-content">
        <div className="warning" style={{ textAlign: 'center' }}>
          Adult Content Warning
        </div>
        <br />
        You are attempting to access a user profile (npub) or a tag that has been flagged as adult (Not Safe For Work).
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
