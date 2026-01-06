import { useState, useContext } from 'react';
import './Login.css';
import { useExtensionLogin } from '../../context/NgineContext';
import { QRCodeLogin } from './QRCodeLogin';
import { useAtom } from 'jotai';
import { sessionAtom } from '../../state/atoms';
import { syncUserRelays } from '../../nostr/relays';
import { AccountsContext } from 'applesauce-react';

type LoginProps = {
  onClose: () => void;
};

const Login = ({ onClose }: LoginProps) => {
  const extensionLogin = useExtensionLogin();
  const accountManager = useContext(AccountsContext);
  const [, setSession] = useAtom(sessionAtom);
  const [error, setError] = useState<string | null>(null);

  const handleQRLogin = () => {
    const active = accountManager?.active;
    if (active) {
      setSession({
        method: 'nip46',
        pubkey: active.pubkey,
      });
      syncUserRelays(active.pubkey);
    }
    onClose();
  };

  const handleQRError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const loginWithExtension = async () => {
    setError(null);
    const pubkey = await extensionLogin();
    if (pubkey) {
      onClose();
    } else {
      setError('Extension login failed');
    }
  };

  return (
    <div className="login-dialog">
      <button className="close-button" onClick={onClose} aria-label="Close login dialog">
        ✕
      </button>
      <h2>Login</h2>

      {error && <div className="login-error">{error}</div>}

      <QRCodeLogin onLogin={handleQRLogin} onError={handleQRError} />

      <div className="login-divider">
        <span>or</span>
      </div>

      <div className="login-extension">
        <button onClick={() => loginWithExtension()}>Login with extension</button>
      </div>
    </div>
  );
};

export default Login;
