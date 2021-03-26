import {browser} from "webextension-polyfill-ts";

export type MessageAction = {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
}

export default async function postMessage(message: MessageAction) {
  return browser.runtime.sendMessage(message);
}
