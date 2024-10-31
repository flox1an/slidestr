import { NostrImage } from '@/components/nostrImageDownload';
import React, { createContext, useContext, useReducer } from 'react';

// Interface for our state
interface GlobalState {
  showNavButtons: boolean; // can be removed when the settings dialog is refactored.
  activeImage?: NostrImage;
  notfoundCache:Record<string, boolean>;

}
const initialState: GlobalState = {
  showNavButtons: true,
  notfoundCache: {}
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
