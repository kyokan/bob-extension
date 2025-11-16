import * as React from "react";
import * as ReactDOM from "react-dom";
import Popup from "@src/ui/pages/Popup";
import {Provider} from "react-redux";
import configureAppStore from "@src/ui/store/configureAppStore";
import {HashRouter} from "react-router-dom";

const store = configureAppStore();

chrome.runtime.onMessage.addListener((action) => {
  store.dispatch(action);
});

document.addEventListener("DOMContentLoaded", async () => {
  await chrome.tabs.query({active: true, currentWindow: true});
  chrome.runtime.connect();

  const popup = document.getElementById("popup");

  if (!popup) {
    console.error("Popup element not found");
    return;
  }

  ReactDOM.render(
    <Provider store={store}>
      <HashRouter>
        <Popup />
      </HashRouter>
    </Provider>,
    popup
  );
});
