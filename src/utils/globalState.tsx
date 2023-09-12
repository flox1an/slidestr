import { NDKUserProfile } from '@nostr-dev-kit/ndk';
import React, { createContext, useContext, useReducer } from 'react';

// Interface for our state
interface GlobalState {
  userNPub?: string;
  profile?: NDKUserProfile;
  showNavButtons: boolean;
}
const initialState: GlobalState = {
  userNPub: undefined,
  showNavButtons: true
};

type GlobalStateType = [GlobalState, React.Dispatch<Partial<GlobalState>>];

export const GlobalStateContext = createContext<GlobalStateType>([initialState, () => {}]);

const GlobalState = ({ children }: { children: React.ReactElement }) => {
  const [state, setState] = useReducer(
    (state: GlobalState, newState: Partial<GlobalState>) => ({
      ...state,
      ...newState,
    }),
    initialState
  );

  return <GlobalStateContext.Provider value={[state, setState]}>{children}</GlobalStateContext.Provider>;
};

export default GlobalState;

export const useGlobalState = () => useContext(GlobalStateContext);
