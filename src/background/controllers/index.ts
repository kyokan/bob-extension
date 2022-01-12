import MessageTypes from "@src/util/messageTypes";
import {AppService} from "@src/util/svc";
import {MessageAction} from "@src/util/postMessage";
import {browser} from "webextension-polyfill-ts";
import {toDollaryDoos} from "@src/util/number";

const controllers: {
  [type: string]: (app: AppService, message: MessageAction) => Promise<any>;
} = {
  [MessageTypes.CONNECT]: async (app, message) => {
    return new Promise(async (resolve, reject) => {
      const {locked} = await app.exec("wallet", "getState");

      app.exec("analytics", "track", {
        name: "Bob3 Connect",
      });

      if (locked) {
        const popup = await openPopup();

        const onPopUpClose = (windowId: number) => {
          if (windowId === popup.id) {
            reject(new Error("user rejected."));
            browser.windows.onRemoved.removeListener(onPopUpClose);
          }
        };

        app.on("wallet.unlocked", async () => {
          resolve(true);
          await browser.windows.remove(popup.id as number);
          browser.windows.onRemoved.removeListener(onPopUpClose);
        });

        browser.windows.onRemoved.addListener(onPopUpClose);
        return;
      }

      resolve(true);
    });
  },

  [MessageTypes.SIGN_MESSAGE]: async (app, message) => {
    const {payload} = message;
    const {address, msg} = payload;
    return new Promise(async (resolve, reject) => {
      const queue = await app.exec('wallet', 'getTxQueue');

      if (queue.length) {
        return reject(new Error('user has unconfirmed tx.'));
      }

      app.exec('analytics', 'track', {
        name: 'Bob3 Sign',
      });

      const requestJson = await app.exec('wallet', 'createSignMessageRequest', msg, address);

      await app.exec('wallet', 'addTxToQueue', requestJson);

      const popup = await openPopup();
      closePopupOnAcceptOrReject(app, resolve, reject, popup);
    });
  },

  [MessageTypes.SIGN_MESSAGE_WITH_NAME]: async (app, message) => {
    const {payload} = message;
    const {name, msg} = payload;
    return new Promise(async (resolve, reject) => {
      const queue = await app.exec('wallet', 'getTxQueue');

      if (queue.length) {
        return reject(new Error('user has unconfirmed tx.'));
      }

      app.exec('analytics', 'track', {
        name: 'Bob3 Sign with Name',
      });

      const requestJson = await app.exec('wallet', 'createSignMessageRequest', msg, undefined, name);

      await app.exec('wallet', 'addTxToQueue', requestJson);

      const popup = await openPopup();
      closePopupOnAcceptOrReject(app, resolve, reject, popup);
    });
  },

  [MessageTypes.SEND_TX]: async (app, message) => {
    const {payload} = message;
    const {amount, address} = payload;
    return new Promise(async (resolve, reject) => {
      const queue = await app.exec("wallet", "getTxQueue");

      if (queue.length) {
        return reject(new Error("user has unconfirmed tx."));
      }

      app.exec("analytics", "track", {
        name: "Bob3 Send",
      });

      const tx = await app.exec("wallet", "createSend", {
        rate: +toDollaryDoos(0.01),
        outputs: [
          {
            value: +toDollaryDoos(amount || 0),
            address: address,
          },
        ],
      });

      await app.exec("wallet", "addTxToQueue", tx);

      const popup = await openPopup();
      closePopupOnAcceptOrReject(app, resolve, reject, popup);
    });
  },

  [MessageTypes.SEND_OPEN]: async (app, message) => {
    const {payload} = message;
    return new Promise(async (resolve, reject) => {
      try {
        const queue = await app.exec("wallet", "getTxQueue");

        if (queue.length) {
          return reject(new Error("user has unconfirmed tx."));
        }

        app.exec("analytics", "track", {
          name: "Bob3 Open",
        });

        const tx = await app.exec("wallet", "createOpen", payload);

        await app.exec("wallet", "addTxToQueue", tx);

        const popup = await openPopup();
        closePopupOnAcceptOrReject(app, resolve, reject, popup);
      } catch (e) {
        reject(e);
      }
    });
  },

  [MessageTypes.SEND_BID]: async (app, message) => {
    const {payload} = message;
    const {amount, lockup} = payload;
    return new Promise(async (resolve, reject) => {
      try {
        const queue = await app.exec("wallet", "getTxQueue");

        if (queue.length) {
          return reject(new Error("user has unconfirmed tx."));
        }

        app.exec("analytics", "track", {
          name: "Bob3 Bid",
        });

        const tx = await app.exec("wallet", "createBid", payload);

        await app.exec("wallet", "addTxToQueue", {
          ...tx,
          bid: amount,
        });

        const popup = await openPopup();
        closePopupOnAcceptOrReject(app, resolve, reject, popup);
      } catch (e) {
        reject(e);
      }
    });
  },

  [MessageTypes.SEND_REVEAL]: async (app, message) => {
    const {payload} = message;
    return new Promise(async (resolve, reject) => {
      try {
        const queue = await app.exec("wallet", "getTxQueue");

        if (queue.length) {
          return reject(new Error("user has unconfirmed tx."));
        }

        app.exec("analytics", "track", {
          name: "Bob3 Reveal",
        });

        const tx = await app.exec("wallet", "createReveal", {
          name: payload,
        });

        await app.exec("wallet", "addTxToQueue", tx);

        const popup = await openPopup();
        closePopupOnAcceptOrReject(app, resolve, reject, popup);
      } catch (e) {
        reject(e);
      }
    });
  },

  [MessageTypes.SEND_UPDATE]: async (app, message) => {
    const {payload} = message;
    return new Promise(async (resolve, reject) => {
      try {
        const queue = await app.exec("wallet", "getTxQueue");

        if (queue.length) {
          return reject(new Error("user has unconfirmed tx."));
        }

        app.exec("analytics", "track", {
          name: "Bob3 Update",
        });

        const tx = await app.exec("wallet", "createUpdate", payload);

        await app.exec("wallet", "addTxToQueue", tx);

        const popup = await openPopup();
        closePopupOnAcceptOrReject(app, resolve, reject, popup);
      } catch (e) {
        reject(e);
      }
    });
  },

  [MessageTypes.SEND_REDEEM]: async (app, message) => {
    const {payload} = message;
    return new Promise(async (resolve, reject) => {
      try {
        const queue = await app.exec("wallet", "getTxQueue");

        if (queue.length) {
          return reject(new Error("user has unconfirmed tx."));
        }

        app.exec("analytics", "track", {
          name: "Bob3 Redeem",
        });

        const tx = await app.exec("wallet", "createRedeem", {
          name: payload,
        });

        await app.exec("wallet", "addTxToQueue", tx);

        const popup = await openPopup();
        closePopupOnAcceptOrReject(app, resolve, reject, popup);
      } catch (e) {
        reject(e);
      }
    });
  },

  [MessageTypes.GET_WALLET_STATE]: async (app, message) => {
    return app.exec("wallet", "getState");
  },

  [MessageTypes.SELECT_WALLET]: async (app, message) => {
    return app.exec("wallet", "selectWallet", message.payload);
  },

  [MessageTypes.GENERATE_NEW_MNEMONIC]: async (app, message) => {
    return app.exec("wallet", "generateNewMnemonic");
  },

  [MessageTypes.CREATE_NEW_WALLET]: async (app, message) => {
    return app.exec("wallet", "createWallet", message.payload);
  },

  [MessageTypes.CREATE_NEW_WALLET_ACCOUNT]: async (app, message) => {
    return app.exec(
      "wallet",
      "createWalletAccount",
      message.payload.options,
      message.payload.walletId
    );
  },

  [MessageTypes.GET_WALLETS_INFO]: async (app, message) => {
    return app.exec("wallet", "getWalletsInfo");
  },

  [MessageTypes.GET_WALLET_ACCOUNTS]: async (app, message) => {
    return app.exec("wallet", "getWalletAccounts", message.payload);
  },

  [MessageTypes.GET_ACCOUNT_INFO]: async (app, message) => {
    return app.exec(
      "wallet",
      "getAccountInfo",
      message.payload?.accountName,
      message.payload?.id
    );
  },

  [MessageTypes.GET_WALLET_IDS]: async (app, message) => {
    return app.exec("wallet", "getWalletIDs");
  },

  [MessageTypes.GET_WALLET_RECEIVE_ADDRESS]: async (app, message) => {
    return app.exec("wallet", "getWalletReceiveAddress", message.payload);
  },

  [MessageTypes.GET_WALLET_BALANCE]: async (app, message) => {
    return app.exec("wallet", "getWalletBalance", message.payload);
  },

  [MessageTypes.GET_WALLET_INFO]: async (app, message) => {
    return app.exec("wallet", "getWalletInfo", message.payload);
  },

  [MessageTypes.UNLOCK_WALLET]: async (app, message) => {
    return app.exec("wallet", "unlockWallet", message.payload);
  },

  [MessageTypes.ADD_TX_QUEUE]: async (app, message) => {
    return app.exec("wallet", "addTxToQueue", message.payload);
  },

  [MessageTypes.SUBMIT_TX]: async (app, message) => {
    return app.exec("wallet", "submitTx", message.payload);
  },

  [MessageTypes.UPDATE_TX_FROM_QUEUE]: async (app, message) => {
    return app.exec("wallet", "updateTxFromQueue", message.payload);
  },

  [MessageTypes.REJECT_TX]: async (app, message) => {
    return app.exec("wallet", "rejectTx", message.payload);
  },

  [MessageTypes.REMOVE_TX_FROM_QUEUE]: async (app, message) => {
    return app.exec("wallet", "removeTxFromQueue", message.payload);
  },

  [MessageTypes.UPDATE_TX_QUEUE]: async (app, message) => {
    return app.exec("wallet", "updateTxQueue");
  },

  [MessageTypes.GET_TX_QUEUE]: async (app, message) => {
    return app.exec("wallet", "getTxQueue");
  },

  [MessageTypes.GET_PENDING_TRANSACTIONS]: async (app, message) => {
    return app.exec(
      "wallet",
      "getPendingTransactions",
      message.payload?.id,
      message.payload?.shouldBroadcast
    );
  },

  [MessageTypes.GET_NAME_NONCE]: async (app, message) => {
    return app.exec("wallet", "getNameNonce");
  },

  [MessageTypes.GET_TX_NONCE]: async (app, message) => {
    return app.exec("wallet", "getTXNonce");
  },

  [MessageTypes.GET_TRANSACTIONS]: async (app, message) => {
    return app.exec("wallet", "getTransactions", message.payload);
  },

  [MessageTypes.REVEAL_SEED]: async (app, message) => {
    return app.exec("wallet", "revealSeed", message.payload);
  },

  [MessageTypes.RESET_DOMAINS]: async (app, message) => {
    return app.exec("wallet", "resetNames");
  },

  [MessageTypes.LOCK_WALLET]: async (app, message) => {
    return app.exec("wallet", "lockWallet");
  },

  [MessageTypes.CHECK_FOR_RESCAN]: async (app, message) => {
    return app.exec("wallet", "checkForRescan", message.payload);
  },

  [MessageTypes.GET_BIDS_BY_NAME]: async (app, message) => {
    return app.exec("wallet", "getBidsByName", message.payload);
  },

  [MessageTypes.STOP_RESCAN]: async (app, message) => {
    return app.exec("wallet", "stopRescan");
  },

  [MessageTypes.FULL_RESCAN]: async (app, message) => {
    return app.exec("wallet", "fullRescan");
  },

  [MessageTypes.GET_NONCE]: async (app, message) => {
    return app.exec(
      "wallet",
      "getNonce",
      message.payload.name,
      message.payload.address,
      message.payload.bid
    );
  },

  [MessageTypes.IMPORT_NONCE]: async (app, message) => {
    return app.exec(
      "wallet",
      "importNonce",
      message.payload.name,
      message.payload.address,
      message.payload.value
    );
  },

  [MessageTypes.GET_COIN]: async (app, message) => {
    return app.exec(
      "wallet",
      "getCoin",
      message.payload.hash,
      message.payload.index
    );
  },

  [MessageTypes.GET_DOMAIN_NAME]: async (app, message) => {
    return app.exec("wallet", "getDomainName", message.payload);
  },

  [MessageTypes.GET_DOMAIN_NAMES]: async (app, message) => {
    return app.exec("wallet", "getDomainNames", message.payload);
  },

  [MessageTypes.CREATE_OPEN]: async (app, message) => {
    return app.exec("wallet", "createOpen", message.payload);
  },

  [MessageTypes.CREATE_BID]: async (app, message) => {
    return app.exec("wallet", "createBid", message.payload);
  },

  [MessageTypes.CREATE_REVEAL]: async (app, message) => {
    return app.exec("wallet", "createReveal", message.payload);
  },

  [MessageTypes.CREATE_REDEEM]: async (app, message) => {
    return app.exec("wallet", "createRedeem", message.payload);
  },

  [MessageTypes.CREATE_UPDATE]: async (app, message) => {
    return app.exec("wallet", "createUpdate", message.payload);
  },

  [MessageTypes.CREATE_TX]: async (app, message) => {
    return app.exec("wallet", "createTx", message.payload);
  },

  [MessageTypes.CREATE_SEND]: async (app, message) => {
    return app.exec("wallet", "createSend", message.payload);
  },

  [MessageTypes.USE_LEDGER_PROXY]: async (app, message) => {
    return app.exec("wallet", "useLedgerProxy", message.payload);
  },

  [MessageTypes.HASH_NAME]: async (app, message) => {
    return app.exec("node", "hashName", message.payload);
  },

  [MessageTypes.GET_NAME_RESOURCE]: async (app, message) => {
    return app.exec("node", "getNameResource", message.payload);
  },

  [MessageTypes.GET_NAME_BY_HASH]: async (app, message) => {
    return app.exec("node", "getNameByHash", message.payload);
  },

  [MessageTypes.ESTIMATE_SMART_FEE]: async (app, message) => {
    return app.exec("node", "estimateSmartFee", message.payload);
  },

  [MessageTypes.GET_LATEST_BLOCK]: async (app, message) => {
    return app.exec("node", "getLatestBlock");
  },

  [MessageTypes.VERIFY_MESSAGE]: async (app, message) => {
    const {payload} = message;
    const {msg,signature,address} = payload;
    return app.exec('node', 'verifyMessage', msg, signature, address);
  },

  [MessageTypes.VERIFY_MESSAGE_WITH_NAME]: async (app, message) => {
    const {payload} = message;
    const {msg,signature,name} = payload;
    return app.exec('node', 'verifyMessageWithName', msg, signature, name);
  },

  [MessageTypes.GET_API]: async (app, message) => {
    return app.exec("setting", "getAPI");
  },

  [MessageTypes.SET_RPC_HOST]: async (app, message) => {
    return app.exec("setting", "setRPCHost", message.payload);
  },

  [MessageTypes.SET_RPC_KEY]: async (app, message) => {
    return app.exec("setting", "setRPCKey", message.payload);
  },

  [MessageTypes.GET_ANALYTICS]: async (app, message) => {
    return app.exec("setting", "getAnalytics");
  },

  [MessageTypes.SET_ANALYTICS]: async (app, message) => {
    return app.exec("setting", "setAnalytics", message.payload);
  },

  [MessageTypes.GET_RESOLVE_HNS]: async (app, message) => {
    return app.exec("setting", "getResolveHns");
  },

  [MessageTypes.SET_RESOLVE_HNS]: async (app, message) => {
    return app.exec("setting", "setResolveHns", message.payload);
  },

  [MessageTypes.GET_RESOLVER]: async (app, message) => {
    return app.exec('setting', 'getResolver');
  },

  [MessageTypes.SET_RESOLVER]: async (app, message) => {
    return app.exec('setting', 'setResolver', message.payload);
  },

  [MessageTypes.RESET_DB]: async (app, message) => {
    return app.exec("db", "resetDB", message.payload);
  },

  [MessageTypes.READ_DB_AS_BUFFER]: async (app, message) => {
    return app.exec("db", "readDBAsBuffer", message.payload);
  },

  [MessageTypes.MP_TRACK]: async (app, message) => {
    return app.exec(
      "analytics",
      "track",
      message.payload.name,
      message.payload.data
    );
  },
};

export default controllers;

async function openPopup() {
  const tab = await browser.tabs.create({
    url: browser.extension.getURL("popup.html"),
    active: false,
  });

  const popup = await browser.windows.create({
    tabId: tab.id,
    type: "popup",
    focused: true,
    width: 357,
    height: 600,
  });

  return popup;
}

function closePopupOnAcceptOrReject(
  app: AppService,
  resolve: (data: any) => void,
  reject: (err: Error) => void,
  popup: any
) {
  app.on("wallet.txAccepted", (returnTx) => {
    resolve(returnTx);
    browser.windows.remove(popup.id as number);
  });

  app.on("wallet.txRejected", () => {
    reject(new Error("user rejected."));
    browser.windows.remove(popup.id as number);
  });
}
