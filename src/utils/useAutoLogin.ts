import { useEffect, useState } from 'react';

declare global {
  interface Window {
    localStorage: any;
  }
}

const useAutoLogin = () => {
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    const disclaimerAcceptedPreviously = JSON.parse(localStorage.getItem('autoLogin') as string);
    if (disclaimerAcceptedPreviously === true) {
      setAutoLogin(true);
    }
  }, []);

  return {
    autoLogin,
    setAutoLogin: (login: boolean) => {
      setAutoLogin(login);
      localStorage.setItem('autoLogin', JSON.stringify(login));
    },
  };
};

export default useAutoLogin;
