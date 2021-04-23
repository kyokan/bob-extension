import MessageTypes from "@src/util/messageTypes";
import {AppService} from "@src/util/svc";
import postMessage, {MessageAction} from "@src/util/postMessage";
import {browser} from "webextension-polyfill-ts";
import {toDollaryDoos} from "@src/util/number";

const controllers: {
  [type: string]: (app: AppService, message: MessageAction) => Promise<any>;
} = {

  [MessageTypes.CONNECT]: async (app, message) => {
    return new Promise(async (resolve, reject) => {
      const {locked} = await app.exec('wallet', 'getState');

      if (locked) {
        const tab = await browser.tabs.create({
          url: browser.extension.getURL('popup.html'),
          active: false,
        });

        const popup = await browser.windows.create({
          tabId: tab.id,
          type: 'popup',
          focused: true,
          width: 357,
          height: 600,
        });

        const onPopUpClose = (windowId: number) => {
          if (windowId === popup.id) {
            reject(new Error('user rejected.'));
            browser.windows.onRemoved.removeListener(onPopUpClose);
          }
        };

        app.on('wallet.unlocked', async () => {
          resolve(true);
          await browser.windows.remove(popup.id as number);
          browser.windows.onRemoved.removeListener(onPopUpClose);
        });

        browser.windows.onRemoved.addListener(onPopUpClose);
        return;
      }

      resolve(true);
    })
  },

  [MessageTypes.SEND_TX]: async (app, message) => {
    const {payload} = message;
    const {amount, address} = payload;
    return new Promise(async (resolve, reject) => {
      const queue = await app.exec('wallet', 'getTxQueue');

      if (queue.length) {
        return reject(new Error('user has unconfirmed tx.'));
      }

      const tx = await app.exec('wallet', 'createTx', {
        rate: +toDollaryDoos(0.01),
        outputs: [{
          value: +toDollaryDoos(amount || 0),
          address: address,
        }],
      });

      await app.exec('wallet', 'addTxToQueue', tx);

      const tab = await browser.tabs.create({
        url: browser.extension.getURL('popup.html'),
        active: false,
      });

      const popup = await browser.windows.create({
        tabId: tab.id,
        type: 'popup',
        focused: true,
        width: 357,
        height: 600,
      });

      app.on('wallet.txAccepted', (returnTx) => {
        resolve(returnTx);
        browser.windows.remove(popup.id as number);
      });

      app.on('wallet.txRejected', () => {
        reject(new Error('user rejected.'));
        browser.windows.remove(popup.id as number);
      });
    });
  },

  [MessageTypes.GET_WALLET_STATE]: async (app, message) => {
    return app.exec('wallet', 'getState');
  },

  [MessageTypes.SELECT_WALLET]: async (app, message) => {
    return app.exec('wallet', 'selectWallet', message.payload);
  },

  [MessageTypes.GENERATE_NEW_MNEMONIC]: async (app, message) => {
    return app.exec('wallet', 'generateNewMnemonic');
  },

  [MessageTypes.CREATE_NEW_WALLET]: async (app, message) => {
    return app.exec('wallet', 'createWallet', message.payload);
  },

  [MessageTypes.GET_WALLET_IDS]: async (app, message) => {
    return app.exec('wallet', 'getWalletIDs');
  },

  [MessageTypes.GET_WALLET_RECEIVE_ADDRESS]: async (app, message) => {
    return app.exec('wallet', 'getWalletReceiveAddress', message.payload);
  },

  [MessageTypes.GET_WALLET_BALANCE]: async (app, message) => {
    return app.exec('wallet', 'getWalletBalance', message.payload);
  },

  [MessageTypes.UNLOCK_WALLET]: async (app, message) => {
    return app.exec('wallet', 'unlockWallet', message.payload);
  },

  [MessageTypes.ADD_TX_QUEUE]: async (app, message) => {
    return app.exec('wallet', 'addTxToQueue', message.payload);
  },

  [MessageTypes.SUBMIT_TX]: async (app, message) => {
    return app.exec('wallet', 'submitTx', message.payload);
  },

  [MessageTypes.UPDATE_TX_FROM_QUEUE]: async (app, message) => {
    return app.exec('wallet', 'updateTxFromQueue', message.payload);
  },

  [MessageTypes.REJECT_TX]: async (app, message) => {
    return app.exec('wallet', 'rejectTx', message.payload);
  },

  [MessageTypes.REMOVE_TX_FROM_QUEUE]: async (app, message) => {
    return app.exec('wallet', 'removeTxFromQueue', message.payload);
  },

  [MessageTypes.UPDATE_TX_QUEUE]: async (app, message) => {
    return app.exec('wallet', 'updateTxQueue');
  },

  [MessageTypes.GET_TX_QUEUE]: async (app, message) => {
    return app.exec('wallet', 'getTxQueue');
  },

  [MessageTypes.GET_PENDING_TRANSACTIONS]: async (app, message) => {
    return app.exec('wallet', 'getPendingTransactions');
  },

  [MessageTypes.GET_NAME_NONCE]: async (app, message) => {
    return app.exec('wallet', 'getNameNonce');
  },

  [MessageTypes.GET_TX_NONCE]: async (app, message) => {
    return app.exec('wallet', 'getTXNonce');
  },

  [MessageTypes.GET_TRANSACTIONS]: async (app, message) => {
    return app.exec('wallet', 'getTransactions', message.payload);
  },

  [MessageTypes.RESET_TRANSACTIONS]: async (app, message) => {
    return app.exec('wallet', 'resetTransactions');
  },

  [MessageTypes.RESET_DOMAINS]: async (app, message) => {
    return app.exec('wallet', 'resetNames');
  },

  [MessageTypes.LOCK_WALLET]: async (app, message) => {
    return app.exec('wallet', 'lockWallet');
  },

  [MessageTypes.CHECK_FOR_RESCAN]: async (app, message) => {
    return app.exec('wallet', 'checkForRescan');
  },

  [MessageTypes.FULL_RESCAN]: async (app, message) => {
    return app.exec('wallet', 'fullRescan');
  },

  [MessageTypes.GET_DOMAIN_NAMES]: async (app, message) => {
    return app.exec('wallet', 'getDomainNames', message.payload);
  },

  [MessageTypes.CREATE_TX]: async (app, message) => {
    return app.exec('wallet', 'createTx', message.payload);
  },

  [MessageTypes.GET_NAME_BY_HASH]: async (app, message) => {
    return app.exec('node', 'getNameByHash', message.payload);
  },

  [MessageTypes.ESTIMATE_SMART_FEE]: async (app, message) => {
    return app.exec('node', 'estimateSmartFee', message.payload);
  },

  [MessageTypes.GET_LATEST_BLOCK]: async (app, message) => {
    return app.exec('node', 'getLatestBlock');
  },

};

export default controllers;
