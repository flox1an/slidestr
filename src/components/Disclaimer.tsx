import './Disclaimer.css';

type DisclaimerProps = {
  disclaimerAccepted: boolean;
  setDisclaimerAccepted: (accepted: boolean) => void;
};

const Disclaimer = ({ disclaimerAccepted, setDisclaimerAccepted }: DisclaimerProps) => {
  const onSubmit = () => {
    setDisclaimerAccepted(true);
  };

  if (disclaimerAccepted) {
    return null;
  }

  return (
    <div className="disclaimer">
      <div className="disclaimer-content">
        <div className="warning" style={{ textAlign: 'center' }}>
          Warning!
        </div>
        <br />
        The content presented on this site is <b>entirely user-generated</b> and remains <b>unmoderated</b>. Images and
        videos are sourced from the NOSTR platform and are not hosted on this site. Content filtering efforts are made
        to avoid NSFW (Not Safe For Work) content, but we cannot guarantee complete safety. Please use discretion and be
        responsible while engaging with the material on this platform. By using this site, you agree not to hold the
        site owners, operators, and affiliates liable for any content-related experiences.
      </div>
      <div className="disclaimer-footer">
        <button type="submit" className="btn btn-primary" onClick={onSubmit}>
          I understand
        </button>
      </div>
    </div>
  );
};

export default Disclaimer;
