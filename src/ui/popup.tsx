import * as React from "react";
import * as ReactDOM from "react-dom";
import { browser } from "webextension-polyfill-ts";
import Popup from "@src/ui/pages/Popup";
import {Provider} from "react-redux";
import configureAppStore from "@src/ui/store/configureAppStore";
import {HashRouter} from "react-router-dom";

const store = configureAppStore();

browser.runtime.onMessage.addListener((action) => {
  store.dispatch(action);
});

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  browser.runtime.connect();
  ReactDOM.render(
    <Provider store={store}>
      <HashRouter>
        <Popup />
      </HashRouter>
    </Provider>,
    document.getElementById("popup"),
  );
});
