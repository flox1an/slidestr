import { useNavigate } from "react-router-dom";
import "./Disclaimer.css";
import { MouseEvent } from "react";

const AdultContentInfo = () => {
  const navigate = useNavigate();

  const proceed = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const nsfwPostfix = "?nsfw=true";
    navigate(`${window.location.pathname}${nsfwPostfix}`);
  };
  const goBack = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigate(`/`);
  };

  return (
    <div className="disclaimer">
      <div className="disclaimer-content">
        <div className="warning" style={{ textAlign: "center" }}>
          NSFW or Adult Content
        </div>
        <br />
        You are trying to access a user profile (npub) or a tag that is marked
        as NSFW (Not Safe For Work). This means that the content you are about
        to see may be offensive or inappropriate for some users. If you are
        under 18 years old, please do not proceed.
      </div>
      <div className="disclaimer-footer">
        <button type="submit" className="btn" onClick={proceed}>
          Continue to content
        </button>&nbsp;
        <button type="submit" className="btn btn-primary" onClick={goBack}>
          Go back
        </button>
      </div>
    </div>
  );
};

export default AdultContentInfo;
