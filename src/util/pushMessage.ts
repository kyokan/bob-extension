import {browser} from "webextension-polyfill-ts";

export type ReduxAction = {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
}

export default async function pushMessage(message: ReduxAction) {
  if (chrome && chrome.runtime) {
    return chrome.runtime.sendMessage(message);
  }

  return browser.runtime.sendMessage(message);
}
