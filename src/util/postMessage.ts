import MessageTypes from "@src/util/messageTypes";

export type MessageAction = {
  type: MessageTypes;
  payload?: any;
  error?: boolean;
  meta?: any;
}

export default async function postMessage(message: MessageAction) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const [err, res] = response || [null, null];

      if (err) {
        reject(new Error(err));
      } else {
        resolve(res);
      }
    });
  });
}
