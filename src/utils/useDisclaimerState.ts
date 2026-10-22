import { useEffect, useState } from 'react';

const useDisclaimerState = () => {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  useEffect(() => {
    const disclaimerAcceptedPreviously = JSON.parse(localStorage.getItem('disclaimerAccepted') as string);
    if (disclaimerAcceptedPreviously === true) {
      setDisclaimerAccepted(true);
    }
  }, []);

  return {
    disclaimerAccepted,
    setDisclaimerAccepted: (accepted: boolean) => {
      setDisclaimerAccepted(accepted);
      localStorage.setItem('disclaimerAccepted', JSON.stringify(accepted));
    },
  };
};

export default useDisclaimerState;
