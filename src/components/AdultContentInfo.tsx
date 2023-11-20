import './Disclaimer.css';
import { MouseEvent } from 'react';
import useNav from '../utils/useNav';

const AdultContentInfo = () => {
  const { nav, currentSettings } = useNav();

  /**
   * Proceed function handles the event when the 'Proceed' button is clicked.
   * It prevents the default button click action and navigates to the current settings with adult content enabled.
   *
   * @param {MouseEvent<HTMLButtonElement>} e - The event triggered by clicking the 'Proceed' button.
   */
  const proceed = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    nav({ ...currentSettings, showAdult: true });
  };

  /**
   * GoBack function handles the event when the 'Go Back' button is clicked.
   * It prevents the default button click action, resets the current settings and navigates back with adult content disabled.
   *
   * @param {MouseEvent<HTMLButtonElement>} e - The event triggered by clicking the 'Go Back' button.
   */
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
