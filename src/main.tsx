import React from 'react';
import ReactDOM from 'react-dom/client';
import GlobalState from './utils/globalState';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <GlobalState>
    <App />
  </GlobalState>
);
