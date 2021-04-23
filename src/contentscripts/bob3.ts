import MessageTypes from "@src/util/messageTypes";
import {MessageAction} from "@src/util/postMessage";
import {toDollaryDoos} from "@src/util/number";

const promises: {
  [k: string]: {
    resolve: Function;
    reject: Function;
  };
} = {};

let nonce = 0;


/**
 * Connect to Bob Extension
 *
 * @returns {client}
 */
async function connect() {
  await post({ type: MessageTypes.CONNECT });
  return wallet;
}

/**
 * Get Wallet Info
 *
 * @return {{
 *
 * }}
 */
async function getBalance() {
  await assertunLocked();
  return post({ type: MessageTypes.GET_WALLET_BALANCE });
}

/**
 * Send to address
 *
 * @param {string} address - Handshake address to send funds to
 * @param {number} amount - Amount (in HNS) to send
 *
 * @returns {{
 *
 * }}
 */
async function send(address: string, amount: number) {
  await assertunLocked();
  return post({
    type: MessageTypes.SEND_TX,
    payload: {
      address,
      amount,
    },
  });
}

// utilities
async function assertunLocked() {
  const res: any = await post({ type: MessageTypes.GET_WALLET_STATE });
  if (res && res.locked) throw new Error('wallet is locked.');
}


/**
 * Wallet Client
 */
const wallet = {
  getBalance,
  send,
};

window.bob3 = {
  connect,
};

declare global {
  interface Window {
    bob3: {
      connect: () => Promise<typeof wallet>;
    };
  }
}











// Connect injected script messages with content script messages
async function post(message: MessageAction) {
  return new Promise((resolve, reject) => {
    const messageNonce = nonce++;
    window.postMessage({
      target: 'bob3-contentscript',
      message,
      nonce: messageNonce,
    }, '*');

    promises[messageNonce] = { resolve, reject };
  });
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (data && data.target === 'bob3-injectedscript') {
    if (!promises[data.nonce]) return;

    const [err, res] = data.payload;
    const {resolve, reject} = promises[data.nonce];

    if (err) {
      return reject(new Error(err));
    }

    resolve(res);
    delete promises[data.nonce];
  }
});




