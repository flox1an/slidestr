import React from 'react';
import ReactDOM from 'react-dom/client';
import GlobalState from './utils/globalState';
import MainInner from './mainInner';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <GlobalState>
    <MainInner />
  </GlobalState>
);
