import WalletService from "@src/background/services/wallet";
import {MessageAction} from "@src/util/postMessage";
import {AppService} from "@src/util/svc";
import SettingService from "@src/background/services/setting";
import NodeService from "@src/background/services/node";
import controllers from "@src/background/controllers";
import MessageTypes from "@src/util/messageTypes";
import AnalyticsService from "@src/background/services/analytics";
import {getMagnetRecord} from "@src/background/resolve";
import {consume, torrentSVC} from "../util/webtorrent";

(async function () {
  let app: AppService;

  // MV3: Use native Chrome API instead of webextension-polyfill
  chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
    (async () => {
      await waitForStartApp();

      try {
        const res = await handleMessage(app, request, sender);
        sendResponse([null, res]);
      } catch (e: any) {
        sendResponse([e.message, null]);
      }
    })();
    return true; // Required for async sendResponse
  });

  const startedApp = new AppService();
  startedApp.add("setting", new SettingService());
  startedApp.add("analytics", new AnalyticsService());
  startedApp.add("node", new NodeService());
  startedApp.add("wallet", new WalletService());
  await startedApp.start();
  app = startedApp;

  app.on("wallet.locked", async () => {
    const tabs = await chrome.tabs.query({active: true});
    for (let tab of tabs) {
      await chrome.tabs.sendMessage(tab.id as number, {
        type: MessageTypes.DISCONNECTED,
      });
    }
  });

  chrome.omnibox.onInputEntered.addListener(async (hostname, disposition) => {
    await waitForStartApp();

    const magnetURI = await getMagnetRecord(hostname);
    if (magnetURI) {
      torrentSVC.addTorrentError(hostname, '');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL('federalist.html') + '?h=' + hostname,
      });
      setTimeout(() => {
        consume(magnetURI, hostname);
      }, 1000);
    } else {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.update(tab.id, {
        url: 'http://' + hostname + '/',
      });
    }
  });

  // MV3: Handle chrome.alarms for persistent polling
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    await waitForStartApp();

    if (alarm.name === 'walletPoller') {
      await app.exec('wallet', 'runPollerTick');
    }
  });

  // MV3: Service worker lifecycle - restore state on startup
  chrome.runtime.onStartup.addListener(async () => {
    console.log('Service worker starting up...');
    // App initialization happens in the main IIFE above
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
