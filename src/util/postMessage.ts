import {browser} from "webextension-polyfill-ts";
import MessageTypes from "@src/util/messageTypes";

export type MessageAction = {
  type: MessageTypes;
  payload?: any;
  error?: boolean;
  meta?: any;
}

export default async function postMessage(message: MessageAction) {
  const [err, res] = await browser.runtime.sendMessage(message);

  if (err) {
    throw new Error(err);
  }

  return res;
}
