import './CloseButton.css';

type CloseButtonProps = {
  onClick: () => void;
};

const CloseButton = ({ onClick }: CloseButtonProps) => (
  <div className="closeButton" onClick={onClick}>
    ✕
  </div>
);

export default CloseButton;
