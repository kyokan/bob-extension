import {browser, Runtime} from "webextension-polyfill-ts";
import WalletService from "@src/background/services/wallet";
import {MessageAction} from "@src/util/postMessage";
import {AppService} from "@src/util/svc";
import SettingService from "@src/background/services/setting";
import NodeService from "@src/background/services/node";
import controllers from "@src/background/controllers";
import MessageTypes from "@src/util/messageTypes";
import AnalyticsService from "@src/background/services/analytics";
import resolve, {getMagnetRecord} from "@src/background/resolve";
import MessageSender = Runtime.MessageSender;
import {consume, torrentSVC} from "../util/webtorrent";

(async function () {
  let app: AppService;

  browser.runtime.onMessage.addListener(async (request: any, sender: any) => {
    await waitForStartApp();

    try {
      const res = await handleMessage(app, request, sender);
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
  await startedApp.start();
  app = startedApp;

  // @ts-ignore
  const onBeforeRequest = resolve.bind(this);

  const optIn = await app.exec('setting', 'getResolver');

  if (optIn) {
    browser.webRequest.onBeforeRequest.addListener(
      onBeforeRequest,
      {urls: ["<all_urls>"]},
      ["blocking"]
    );
  }

  app.on('setting.resolverChanged', (optIn: boolean) => {
    if (optIn) {
      browser.webRequest.onBeforeRequest.addListener(
        onBeforeRequest,
        {urls: ["<all_urls>"]},
        ["blocking"]
      );
    } else {
      browser.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
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

  browser.omnibox.onInputEntered.addListener(async (hostname, disposition) => {
    await waitForStartApp();
    const optIn = await app.exec('setting', 'getResolver');

    if (!optIn) return;

    const magnetURI = getMagnetRecord(hostname);

    if (magnetURI) {
      torrentSVC.addTorrentError(hostname, '');
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      browser.tabs.update(tab.id, {
        url: browser.extension.getURL('federalist.html') + '?h=' + hostname,
      });
      setTimeout(() => {
        consume(magnetURI, hostname);
      }, 1000);
    } else {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      await browser.tabs.update(tab.id, {
        url: 'http://' + hostname + '/',
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

function handleMessage(app: AppService, message: MessageAction, sender: MessageSender) {
  const controller = controllers[message.type];

  if (controller) {
    return controller(app, message, sender);
  }
}
