import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AppProviders } from "./app/providers/AppProviders";
import { assetUrl } from "./shared/assets/assetUrl";
import "./shared/styles/global.css";
import "./app/pages/calendar/calendarPages.css";

const favicon =
  document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
  document.head.appendChild(document.createElement("link"));

favicon.rel = "icon";
favicon.type = "image/webp";
favicon.href = assetUrl("main/icons/moim-logo.webp");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
