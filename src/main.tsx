import React from "react";
import ReactDOM from "react-dom/client";
import { NDKProvider } from "@nostr-dev-kit/ndk-react";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NDKProvider>
      <App />
    </NDKProvider>
  </React.StrictMode>
);
