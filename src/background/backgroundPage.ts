import {browser} from "webextension-polyfill-ts";
import WalletService from "@src/background/services/wallet";
import LedgerService from "@src/background/services/ledger";
import {MessageAction} from "@src/util/postMessage";
import {AppService} from "@src/util/svc";
import SettingService from "@src/background/services/setting";
import NodeService from "@src/background/services/node";
import controllers from "@src/background/controllers";
import MessageTypes from "@src/util/messageTypes";
import AnalyticsService from "@src/background/services/analytics";
import resolve from "@src/background/resolve";

(async function () {
  let app: AppService;

  browser.runtime.onMessage.addListener((action) => {
    switch (action.type) {
      case MessageTypes.LEDGER_CONNECT_RES:
        console.log("LEDGER_CONNECT_RES");
        return;
      case MessageTypes.LEDGER_CONNECT_CANCEL:
        console.log("LEDGER_CONNECT_CANCEL");
        return;
    }
  });

  browser.runtime.onMessage.addListener(async (request: any, sender: any) => {
    await waitForStartApp();

    try {
      const res = await handleMessage(app, request);
      return [null, res];
    } catch (e: any) {
      return [e.message, null];
    }
  });

  const startedApp = new AppService();
  startedApp.add("setting", new SettingService());
  startedApp.add("analytics", new AnalyticsService());
  startedApp.add("node", new NodeService());
  startedApp.add("wallet", new WalletService());
  // startedApp.add("ledger", new LedgerService());
  await startedApp.start();
  app = startedApp;

  app.on("setting.setResolver", async () => {
    const isResolving = await app.exec("setting", "getResolver");
    console.log("resolving:", isResolving);

    if (isResolving) {
      browser.webRequest.onBeforeRequest.addListener(
        // @ts-ignore
        resolve,
        {urls: ["<all_urls>"]},
        ["blocking"]
      );
    } else {
      // @ts-ignore
      browser.webRequest.onBeforeRequest.removeListener(resolve);
    }
  });

  app.on("wallet.locked", async () => {
    const tabs = await browser.tabs.query({active: true});
    for (let tab of tabs) {
      await browser.tabs.sendMessage(tab.id as number, {
        type: MessageTypes.DISCONNECTED,
      });
    }
  });

  async function waitForStartApp() {
    return new Promise((resolve) => {
      if (app) {
        resolve(true);
        return;
      }

      setTimeout(async () => {
        await waitForStartApp();
        resolve(true);
      }, 500);
    });
  }
})();

function handleMessage(app: AppService, message: MessageAction) {
  const controller = controllers[message.type];

  if (controller) {
    return controller(app, message);
  }
}
