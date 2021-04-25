import MessageTypes from "@src/util/messageTypes";
import {MessageAction} from "@src/util/postMessage";


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
 * Get the current receiving address.
 *
 * @returns {string}
 */
async function getAddress() {
  await assertunLocked();
  return post({ type: MessageTypes.GET_WALLET_RECEIVE_ADDRESS });
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

/**
 * Send bid
 *
 * @param {string} name - name to bid on
 * @param {number} amount - amount to bind (in HNS)
 * @param {number} lockup - amount to lock up to blind your bid (must be greater than bid amount)
 */
async function sendBid(name: string, amount: number, lockup: number) {
  await assertunLocked();
  return post({
    type: MessageTypes.SEND_BID,
    payload: {
      name,
      amount,
      lockup,
    },
  });
}

/**
 * Send reveal
 *
 * @param {string} name - name to reveal bid for (`null` for all names)
 */
async function sendReveal(name: string) {
  await assertunLocked();
  return post({
    type: MessageTypes.SEND_REVEAL,
    payload: name,
  });
}

/**
 * Send redeem
 *
 * @param {string} name - name to redeem a losing bid for (`null` for all names)
 */
async function sendRedeem(name: string) {
  await assertunLocked();
  return post({
    type: MessageTypes.SEND_REDEEM,
    payload: name,
  });
}


/**
 * Send update
 *
 * @param {string} name - name to update the data for
 * @param {array} data - JSON-encoded resource
 */
async function sendUpdate(name: string, records: UpdateRecordType[]) {
  await assertunLocked();
  return post({
    type: MessageTypes.SEND_UPDATE,
    payload: {
      name,
      data: { records },
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
  getAddress,
  send,
  sendBid,
  sendReveal,
  sendRedeem,
  sendUpdate,
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


export type DSRecord = {
  type: 'DS';
  keyTag: number;
  algorithm: number;
  digestType: number;
  digest: string;
}

export type NSRecord = {
  type: 'NS';
  ns: string;
}

export type GLUE4Record = {
  type: 'GLUE4';
  ns: string;
  address: string;
}

export type GLUE6Record = {
  type: 'GLUE6';
  ns: string;
  address: string;
}

export type SYNTH4Record = {
  type: 'SYNTH4';
  address: string;
}

export type SYNTH6Record = {
  type: 'SYNTH6';
  address: string;
}

export type TXTRecord = {
  type: 'TXT';
  txt: string[];
}

export type UpdateRecordType = DSRecord | NSRecord | GLUE4Record | GLUE6Record | SYNTH4Record | SYNTH6Record | TXTRecord;




