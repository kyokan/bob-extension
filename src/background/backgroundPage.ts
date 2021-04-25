import {browser} from "webextension-polyfill-ts";
import WalletService from "@src/background/services/wallet";
import {MessageAction} from "@src/util/postMessage";
import {AppService} from "@src/util/svc";
import SettingService from "@src/background/services/setting";
import NodeService from "@src/background/services/node";
import controllers from "@src/background/controllers";
import MessageTypes from "@src/util/messageTypes";

(async function() {
    let app: AppService;

    browser.runtime.onMessage.addListener(async (request: any, sender: any) => {
        await waitForStartApp();

        try {
            const res = await handleMessage(app, request);
            return [null, res];
        } catch (e) {
            return [e.message, null];
        }
    });

    browser.runtime.onConnect.addListener(async port => {
        await waitForStartApp();

        port.onDisconnect.addListener(async () =>  {
            await app.exec('wallet', 'resetTransactions', -1);
            await app.exec('wallet', 'resetNames', -1);
        });
    });

    const startedApp = new AppService();
    startedApp.add('setting', new SettingService());
    startedApp.add('node', new NodeService());
    startedApp.add('wallet', new WalletService());
    await startedApp.start();
    app = startedApp;

    app.on('wallet.locked', async () => {
        const tabs = await browser.tabs.query({ active: true });
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


