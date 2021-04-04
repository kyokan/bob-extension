import {browser} from "webextension-polyfill-ts";
import WalletService from "@src/background/services/wallet";
import {MessageAction} from "@src/util/postMessage";
import {AppService} from "@src/util/svc";
import SettingService from "@src/background/services/setting";
import MessageTypes from "@src/util/messageTypes";
import NodeService from "@src/background/services/node";

(async function() {
    const app = new AppService();
    app.add('setting', new SettingService());
    app.add('node', new NodeService());
    app.add('wallet', new WalletService());
    await app.start();

    browser.runtime.onMessage.addListener(async (request: any, sender: any) => {
        try {
            const res = await handleMessage(app, request);
            return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
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
        case MessageTypes.GET_WALLET_BALANCE:
            return app.exec('wallet', 'getWalletBalance', message.payload);
        case MessageTypes.UNLOCK_WALLET:
            return app.exec('wallet', 'unlockWallet', message.payload);
        case MessageTypes.ADD_TX_QUEUE:
            return app.exec('wallet', 'addTxToQueue', message.payload);
        case MessageTypes.UPDATE_TX_QUEUE:
            return app.exec('wallet', 'updateTxQueue');
        case MessageTypes.GET_TRANSACTIONS:
            return app.exec('wallet', 'getTransactions', message.payload);
        case MessageTypes.LOCK_WALLET:
            return app.exec('wallet', 'lockWallet');
        case MessageTypes.CHECK_FOR_RESCAN:
            return app.exec('wallet', 'checkForRescan');
        case MessageTypes.FULL_RESCAN:
            return app.exec('wallet', 'fullRescan');
        case MessageTypes.GET_DOMAIN_NAMES:
            return app.exec('wallet', 'getDomainNames', message.payload);
        case MessageTypes.CREATE_TX:
            return app.exec('wallet', 'createTx', message.payload);
        case MessageTypes.GET_NAME_BY_HASH:
            return app.exec('node', 'getNameByHash', message.payload);
        case MessageTypes.ESTIMATE_SMART_FEE:
            return app.exec('node', 'estimateSmartFee', message.payload);
        case MessageTypes.GET_LATEST_BLOCK:
            return app.exec('node', 'getLatestBlock');
        default:
            return null;
    }
}


