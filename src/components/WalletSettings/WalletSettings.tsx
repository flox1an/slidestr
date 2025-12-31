import { useState } from 'react';
import './WalletSettings.css';
import CloseButton from '../CloseButton/CloseButton';
import { useAtom } from 'jotai';
import { nwcAtom } from '../../ngine/state';
import { parseNWCUri } from '../../ngine/nwc';

interface WalletSettingsProps {
  onClose: () => void;
}

const WalletSettings = ({ onClose }: WalletSettingsProps) => {
  const [nwc, setNwc] = useAtom(nwcAtom);
  const [nwcInput, setNwcInput] = useState('');
  const [nwcError, setNwcError] = useState<string | null>(null);

  const handleConnectWallet = () => {
    const parsed = parseNWCUri(nwcInput);
    if (parsed) {
      setNwc(parsed);
      setNwcInput('');
      setNwcError(null);
    } else {
      setNwcError('Invalid NWC connection string');
    }
  };

  const handleDisconnectWallet = () => {
    setNwc(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleConnectWallet();
    }
  };

  return (
    <div className="wallet-settings-overlay" onClick={onClose}>
      <div className="wallet-settings" onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose} />

        <h3>Wallet Settings</h3>

        <div className="wallet-section">
          <p className="wallet-description">
            Connect your Lightning wallet via NWC (Nostr Wallet Connect) to send zaps.
          </p>

          {nwc ? (
            <div className="wallet-connected">
              <div className="wallet-status">
                <span className="status-dot" />
                <span>Wallet Connected</span>
              </div>
              <button className="wallet-btn disconnect" onClick={handleDisconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <div className="wallet-connect">
              <input
                type="password"
                className="wallet-input"
                placeholder="nostr+walletconnect://..."
                value={nwcInput}
                onChange={e => setNwcInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={e => e.stopPropagation()}
              />
              {nwcError && <div className="wallet-error">{nwcError}</div>}
              <button
                className="wallet-btn connect"
                onClick={handleConnectWallet}
                disabled={!nwcInput.trim()}
              >
                Connect Wallet
              </button>
              <p className="wallet-help">
                Get a connection string from your NWC-compatible wallet (e.g., Alby, Mutiny).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletSettings;
