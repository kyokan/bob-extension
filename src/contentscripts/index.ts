import {browser} from "webextension-polyfill-ts";
import MessageTypes from "@src/util/messageTypes";

(async function () {
  const url = browser.runtime.getURL("js/bob3.js");
  const container = document.head || document.documentElement;
  const scriptTag = document.createElement("script");
  scriptTag.src = url;
  scriptTag.setAttribute("async", "false");
  container.insertBefore(scriptTag, container.children[0]);
  container.removeChild(scriptTag);

  window.addEventListener("message", async (event) => {
    const data = event.data;
    if (data && data.target === "bob3-contentscript") {
      const res = await browser.runtime.sendMessage(data.message);
      window.postMessage(
        {
          target: "bob3-injectedscript",
          payload: res,
          nonce: data.nonce,
        },
        "*"
      );
    }
  });

  browser.runtime.onMessage.addListener((action) => {
    switch (action.type) {
      case MessageTypes.DISCONNECTED:
        window.postMessage(
          {
            target: "bob3-injectedscript",
            payload: [null, null],
            nonce: "disconnect",
          },
          "*"
        );
        return;
      case MessageTypes.NEW_BLOCK:
        window.postMessage(
          {
            target: "bob3-injectedscript",
            payload: [null, action.payload],
            nonce: "newBlock",
          },
          "*"
        );
        return;
    }
  });
})();
