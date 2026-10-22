import { useEffect, useState } from 'react';

const useAutoLogin = () => {
  const [autoLogin, setAutoLogin] = useState(
    JSON.parse(localStorage.getItem('autoLogin') as string) as boolean | undefined
  );

  useEffect(() => {
    const autoLogin = JSON.parse(localStorage.getItem('autoLogin') as string) as boolean | undefined;
    if (autoLogin === true) {
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
