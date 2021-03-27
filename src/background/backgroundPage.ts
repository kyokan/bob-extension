import {browser} from "webextension-polyfill-ts";
import WalletService from "@src/background/services/wallet";
import {MessageAction} from "@src/util/postMessage";
import {AppService} from "@src/util/svc";
import SettingService from "@src/background/services/setting";
import MessageTypes from "@src/util/messageTypes";

(async function() {
    const app = new AppService();
    app.add('wallet', new WalletService());
    app.add('setting', new SettingService());
    await app.start();

    browser.runtime.onMessage.addListener(async (request: any, sender: any) => {
        return handleMessage(app, request);
    });
})();

function handleMessage(app: AppService, message: MessageAction) {
    switch (message.type) {
        case MessageTypes.GET_WALLET_STATE:
            return app.exec('wallet', 'getState');
        case MessageTypes.SELECT_WALLET:
            return app.exec('wallet', 'selectWallet', message.payload);
        case MessageTypes.GENERATE_NEW_MNEMONIC:
            return app.exec('wallet', 'generateNewMnemonic');
        case MessageTypes.CREATE_NEW_WALLET:
            return app.exec('wallet', 'createWallet', message.payload);
        case MessageTypes.GET_WALLET_IDS:
            return app.exec('wallet', 'getWalletIDs');
        case MessageTypes.GET_WALLET_RECEIVE_ADDRESS:
            return app.exec('wallet', 'getWalletReceiveAddress', message.payload);
        case MessageTypes.UNLOCK_WALLET:
            return app.exec('wallet', 'unlockWallet', message.payload);
        case MessageTypes.LOCK_WALLET:
            return app.exec('wallet', 'lockWallet');
        default:
            return null;
    }
}


