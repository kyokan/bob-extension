import {GenericService} from "@src/util/svc";
const Mnemonic = require('hsd/lib/hd/mnemonic');
const WalletDB = require("hsd/lib/wallet/walletdb");
const Network = require("hsd/lib/protocol/network");
const Covenant = require("hsd/lib/primitives/covenant");
const TX = require("hsd/lib/primitives/tx");
const ChainEntry = require("hsd/lib/blockchain/chainentry");
const BN = require('bcrypto/lib/bn.js');
const bdb = require('bdb');
const DB = require('bdb/lib/DB');
import {get, put} from '@src/util/db';

export default class WalletService extends GenericService {
  network: typeof Network;

  wdb: typeof WalletDB;

  store: typeof DB;

  selectedID: string;

  locked: boolean;

  constructor() {
    super();
    this.selectedID = '';
    this.locked = true;
  }

  lockWallet = async () => {
    const wallet = await this.wdb.get(this.selectedID);
    await wallet.lock();
    this.locked = true;
  };

  unlockWallet = async (password: string) => {
    const wallet = await this.wdb.get(this.selectedID);
    await wallet.unlock(password, 60000);
    this.locked = false;
    await wallet.lock();
  };

  getState = async () => {
    const tip = await this.wdb.getTip();
    return {
      selectedID: this.selectedID,
      locked: this.locked,
      tip: {
        hash: tip.hash.toString('hex'),
        height: tip.height,
        time: tip.time,
      },
    };
  };

  async generateNewMnemonic() {
    return new Mnemonic({ bits: 256 }).getPhrase().trim();
  }

  selectWallet = async (id: string) => {
    const walletIDs = await this.getWalletIDs();

    if (!walletIDs.includes(id)) {
      throw new Error(`Cannot find wallet - ${id}`)
    }

    if (this.selectedID !== id) {
      const wallet = await this.wdb.get(id);
      await wallet.lock();
      this.locked = true;
    }

    this.selectedID = id;
  };

  getWalletIDs = async (): Promise<string[]> => {
    return this.wdb.getWallets();
  };

  getWalletReceiveAddress = async (options: {id: string; depth: number}) => {
    const wallet = await this.wdb.get(options.id);
    const account = await wallet.getAccount('default');
    return account.deriveReceive(options.depth).getAddress().toString();
  };

  getWalletBalance = async (id?: string) => {
    const walletId = id || this.selectedID;
    const wallet = await this.wdb.get(walletId);
    const balance = await wallet.getBalance();
    return wallet.getJSON(false, balance).balance;
  };

  createWallet = async (options: {
    id: string;
    passphrase: string;
    mnemonic: string;
  }) => {
    const wallet = await this.wdb.create(options);
    const balance = await wallet.getBalance();
    return wallet.getJSON(false, balance);
  };

  insertTransactions = async (transactions: any[]) => {
    try {
      await this.wdb.deepClean();
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(e);
    }

    transactions = transactions.sort((a, b) => {
      if (a.height > b.height) return 1;
      if (b.height > a.height) return -1;
      if (a.index > b.index) return 1;
      if (b.index > a.index) return -1;
      return 0;
    });

    const txMap: {[hash: string]: string} = {};

    transactions = transactions.reduce((acc, tx) => {
      if (txMap[tx.hash]) return acc;
      txMap[tx.hash] = tx.hash;
      acc.push(tx);
      return acc;
    }, []);

    this.wdb.rescanning = true;
    for (let i = 0; i < transactions.length; i++) {
      const unlock = await this.wdb.txLock.lock();
      try {
        const tx = mapOneTx(transactions[i]);
        console.log(`insert tx #${i} at block ${transactions[i].height}`);
        const entryOption = await this.exec('node', 'getBlockEntry', transactions[i].height);
        const entry = new ChainEntry({
          ...entryOption,
          version: Number(entryOption.version),
          hash: Buffer.from(entryOption.hash, 'hex'),
          prevBlock: Buffer.from(entryOption.prevBlock, 'hex'),
          merkleRoot: Buffer.from(entryOption.merkleRoot, 'hex'),
          witnessRoot: Buffer.from(entryOption.witnessRoot, 'hex'),
          treeRoot: Buffer.from(entryOption.treeRoot, 'hex'),
          reservedRoot: Buffer.from(entryOption.reservedRoot, 'hex'),
          extraNonce: Buffer.from(entryOption.extraNonce, 'hex'),
          mask: Buffer.from(entryOption.mask, 'hex'),
          chainwork: entryOption.chainwork && BN.from(entryOption.chainwork, 16, 'be'),
        });
        await this.wdb._addTX(tx, entry);
        await new Promise(r => setTimeout(r, 1));
      } catch (e) {
        console.error(e);
        i = i - 1;
      } finally {
        await unlock();
      }
    }

    this.wdb.rescanning = false;
  };

  fullRescan = async (startDepth = 0, endDepth = 100, transactions: any[] = []) => {
    const latestBlockNow = await this.exec('node', 'getLatestBlock');
    const latestBlockLast = await get(this.store, 'latestBlock');

    if (latestBlockLast && latestBlockLast.height >= latestBlockNow.height) {
      console.log('wallet is synchronized');
      return;
    }

    const walletId = this.selectedID;
    const wallet = await this.wdb.get(walletId);
    const account = await wallet.getAccount('default');
    const addresses = [];

    for (let i = startDepth; i < endDepth; i++) {
      const receive = account.deriveReceive(i).getAddress().toString();
      const change = account.deriveChange(i).getAddress().toString();
      addresses.push(receive);
      addresses.push(change);
    }

    const newTXs = await this.exec('node', 'getTXByAddresses', addresses);

    if (!newTXs.length) {
      await this.insertTransactions(transactions);
      const latestBlockEnd = await this.exec('node', 'getLatestBlock');
      await put(this.store,'latestBlock', latestBlockEnd);
      return;
    }

    transactions = transactions.concat(newTXs);
    await this.fullRescan(startDepth + 100, endDepth + 100, transactions);
  };

  async start() {
    this.network = Network.get('main');
    this.wdb = new WalletDB({
      network: this.network,
      memory: false,
      location: '/walletdb',
    });

    this.store = bdb.create('/wallet-store');

    this.wdb.on('error', (err: Error) => console.error('wdb error', err));

    await this.wdb.open();
    await this.store.open();

    if (!this.selectedID) {
      const walletIDs = await this.getWalletIDs();
      this.selectedID = walletIDs.filter(id => id !== 'primary')[0];
    }
  }

  async stop() {

  }

}

function mapOneTx(txOptions: any) {
  if (txOptions.witnessHash) {
    txOptions.witnessHash = Buffer.from(txOptions.witnessHash, 'hex');
  }

  txOptions.inputs = txOptions.inputs.map((input: any) => {
    if (input.prevout.hash) {
      input.prevout.hash = Buffer.from(input.prevout.hash, 'hex');
    }

    if (input.coin && input.coin.covenant) {
      input.coin.covenant = new Covenant(
        input.coin.covenant.type,
        input.coin.covenant.items.map((item: any) => Buffer.from(item, 'hex')),
      );
    }

    if (input.witness) {
      input.witness = input.witness.map((wit: any) => Buffer.from(wit, 'hex'));
    }

    return input;
  });

  txOptions.outputs = txOptions.outputs.map((output: any) => {
    if (output.covenant) {
      output.covenant = new Covenant(
        output.covenant.type,
        output.covenant.items.map((item: any) => Buffer.from(item, 'hex')),
      );
    }
    return output;
  });
  const tx = new TX(txOptions);
  return tx;
}
