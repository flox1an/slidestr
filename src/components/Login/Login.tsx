import { useState } from 'react';
import './Login.css';
import { useBunkerLogin, useExtensionLogin } from '../../ngine/context';
import { useGlobalState } from '../../utils/globalState';
import React from 'react';

type LoginProps = {
  onClose: () => void;
};

const Login = ({ onClose }: LoginProps) => {
  const [address, setAddress] = useState('');
  const [_, setState] = useGlobalState();
  const bunkerLogin = useBunkerLogin();
  const extensionLogin = useExtensionLogin();
  /*

  const onLogin = async () => {
    const user = await bunkerLogin('florian@nsec.app'); ///bunker://b7c6f6915cfa9a62fff6a1f02604de88c23c6c6c6d1b8f62c7cc10749f307e81?relay=wss://relay.nsec.app');  //florian@nsec.app
    //const user = await extensionLogin();
     if (user) {
      
      console.log(user.npub);
      setState({ userNPub: user.npub, profile: user.profile });
      }
      else {
        console.error('Error loging in');
      }
/*
    setAutoLogin(true);
    
    

    const result = await nip);
    if (!result) {
      console.error('Login failed.');
      return;
    }

    setState({ userNPub: result.npub });
};
*/
  const loginWithAddress = async () => {
    const user = await bunkerLogin(address);
    if (user) {
      setState({ userNPub: user.npub, profile: user.profile });
      onClose();
    } else {
      console.error('Error loging in');
    }
  };

  const loginWithExtension = async () => {
    const user = await extensionLogin();
    console.log(user);
    if (user) {
      setState({ userNPub: user.npub, profile: user.profile });
      onClose();
    } else {
      console.error('Error loging in');
    }
  };

  return (
    <div className="login-dialog">
      <div className="close-button" onClick={() => onClose()}>✕</div>
      <h2>Login</h2>
      <div className="login-address">
        <input
          type="text"
          placeholder="Nostr Address / Bunker URL"
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={e => e.stopPropagation()}
          onKeyUp={e => e.stopPropagation()}
        ></input>
        <button onClick={() => loginWithAddress()}>Login</button>
      </div>
      <div className="login-extension">
        <button onClick={() => loginWithExtension()}>Login with extension</button>
      </div>
    </div>
  );
};

export default Login;
