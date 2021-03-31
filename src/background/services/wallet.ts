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
import pushMessage from "@src/util/pushMessage";
import {ActionType as WalletActionType, setWalletBalance} from "@src/ui/ducks/wallet";
import {ActionType as AppActionType} from "@src/ui/ducks/app";
import {setTransactions} from "@src/ui/ducks/transactions";
import {setDomainNames} from "@src/ui/ducks/domains";

export default class WalletService extends GenericService {
  network: typeof Network;

  wdb: typeof WalletDB;

  store: typeof DB;

  transactions?: any[] | null;

  domains?: any[] | null;

  selectedID: string;

  locked: boolean;

  rescanning: boolean;

  checkStatusTimeout?: any;

  constructor() {
    super();
    this.selectedID = '';
    this.locked = true;
    this.rescanning = false;
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
      rescanning: this.rescanning,
    };
  };

  pushState = async () => {
    const walletState = await this.getState();
    await pushMessage({
      type: WalletActionType.SET_WALLET_STATE,
      payload: walletState,
    });
  };

  pushBobMessage = async (message: string) => {
    await pushMessage({
      type: AppActionType.SET_BOB_MESSAGE,
      payload: message,
    });
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
      this.transactions = null;
      this.domains = null;
      this.locked = true;
      await this.pushState();
      await pushMessage(setWalletBalance(await this.getWalletBalance()));
      await pushMessage(setTransactions([]));
      await pushMessage(setDomainNames([]));
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

  getTransactions = async (opts?: {offset: number, limit: number, id?: string}) => {
    const {
      offset = 0,
      limit = 20,
      id,
    } = opts || {};
    const walletId = id || this.selectedID;
    const wallet = await this.wdb.get(walletId);
    const latestBlock = await this.exec('node', 'getLatestBlock');

    await pushMessage({
      type: AppActionType.SET_BOB_MOVING,
      payload: true,
    });

    let result;
    if (this.transactions) {
      result = this.transactions;
    } else {
      let txs = await wallet.getHistory('default');

      txs = txs.sort((a: any, b: any) => {
        if (a.height > b.height) return -1;
        if (b.height > a.height) return 1;
        if (a.index > b.index) return -1;
        if (b.index > a.index) return 1;
        return 0;
      });

      const details = await wallet.toDetails(txs);

      result = [];

      for (const item of details) {
        result.push(item.getJSON(this.network, latestBlock.height));
      }

      this.transactions = result;
    }

    await pushMessage({
      type: AppActionType.SET_BOB_MOVING,
      payload: false,
    });

    return result.slice(offset * limit, (offset * limit) + limit);
  };

  getDomainNames = async (opts?: {offset: number, limit: number, id?: string}) => {
    const {
      offset = 0,
      limit = 20,
      id,
    } = opts || {};
    const walletId = id || this.selectedID;
    const wallet = await this.wdb.get(walletId);
    let result;

    if (this.domains) {
      result = this.domains;
    } else {
      let domains = await wallet.getNames();
      const {height} = await this.exec('node', 'getLatestBlock');
      domains = Object.keys(domains).map((name: string) => domains[name]);
      result = [];
      for (let i = 0; i < domains.length; i++) {
        const domain = domains[i];
        const {owner} = domain;
        const state = domain.state(height, this.network);

        if (state !== 4) {
          continue;
        }

        const coin = await wallet.getCoin(owner.hash, owner.index);
        if (coin) {
          result.push(domain);
        }
      }

      domains = domains.sort((a: any, b: any) => {
        if (a.renewal > b.renewal) return 1;
        if (b.renewal > a.renewal) return -1;
        return 0;
      });

      this.domains = result;
    }


    return result.slice(offset * limit, (offset * limit) + limit);
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
      // await this.wdb.deepClean();
      // await new Promise(r => setTimeout(r, 500));
      // await this.wdb.rollback(0);
      // await new Promise(r => setTimeout(r, 500));
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

    await this.pushBobMessage(`Found ${transactions.length} transaction.`);

    this.wdb.rescanning = true;
    let retries = 0;
    for (let i = 0; i < transactions.length; i++) {
      const wallet = await this.wdb.get(this.selectedID);
      const wtx = await wallet.getTX(Buffer.from(transactions[i].hash, 'hex'));

      if (wtx) {
        await this.pushBobMessage(`Processed TX # ${i} of ${transactions.length}....`);
        continue;
      }

      const unlock = await this.wdb.txLock.lock();
      try {
        const tx = mapOneTx(transactions[i]);
        await this.pushBobMessage(`Inserting TX # ${i} of ${transactions.length}....`);
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
        await new Promise(r => setTimeout(r, 2));
        retries = 0;
      } catch (e) {
        retries++;
        await new Promise(r => setTimeout(r, 10));
        if (retries > 1000) {
          throw e;
        }
        i = i - 1;
      } finally {
        await unlock();
      }
    }

    this.wdb.rescanning = false;
  };

  getAllReceiveTXs = async (startDepth = 0, endDepth = 1000, transactions: any[] = []): Promise<any[]> => {
    const walletId = this.selectedID;
    const wallet = await this.wdb.get(walletId);
    const account = await wallet.getAccount('default');
    const addresses = [];

    await this.pushBobMessage('Looking for transactions...');

    let b;
    for (let i = startDepth; i < endDepth; i++) {
      const key = account.deriveReceive(i)
      const receive = key.getAddress().toString();
      const path = key.toPath();
      if (!await this.wdb.hasPath(account.wid, path.hash)) {
        b = b || this.wdb.db.batch();
        await this.wdb.savePath(b, account.wid, path);
      }
      addresses.push(receive);
    }

    if (b) {
      await b.write();
    }

    const newTXs = await this.exec('node', 'getTXByAddresses', addresses);

    if (!newTXs.length) {
      return transactions;
    }

    transactions = transactions.concat(newTXs);
    return await this.getAllReceiveTXs(startDepth + 1000, endDepth + 1000, transactions);
  };

  getAllChangeTXs = async (startDepth = 0, endDepth = 1000, transactions: any[] = []): Promise<any[]> => {
    const walletId = this.selectedID;
    const wallet = await this.wdb.get(walletId);
    const account = await wallet.getAccount('default');
    const addresses = [];

    await this.pushBobMessage('Looking for transactions...');

    let b;
    for (let i = startDepth; i < endDepth; i++) {
      const key = account.deriveChange(i);
      const change = key.getAddress().toString();
      const path = key.toPath();
      if (!await this.wdb.hasPath(account.wid, path.hash)) {
        b = b || this.wdb.db.batch();
        await this.wdb.savePath(b, account.wid, path);
      }
      addresses.push(change);
    }
    if (b) {
      await b.write();
    }
    const newTXs = await this.exec('node', 'getTXByAddresses', addresses);

    if (!newTXs.length) {
      return transactions;
    }

    transactions = transactions.concat(newTXs);
    return await this.getAllChangeTXs(startDepth + 1000, endDepth + 1000, transactions);
  };

  fullRescan = async () => {
    await this.pushBobMessage('Looking for transactions...');
    const latestBlockEnd = await this.exec('node', 'getLatestBlock');
    const changeTXs = await this.getAllChangeTXs();
    const receiveTXs = await this.getAllReceiveTXs();
    const transactions: any[] = receiveTXs.concat(changeTXs);
    await this.wdb.watch();
    await this.insertTransactions(transactions);
    await put(this.store,`latest_block_${this.selectedID}`, latestBlockEnd);
    return;
  };

  processBlock = async (blockHeight: number) => {
    const {
      txs: transactions,
      ...entryOption
    } = await this.exec('node', 'getBlockByHeight', blockHeight);

    this.wdb.rescanning = true;
    let retries = 0;

    for (let i = 0; i < transactions.length; i++) {
      const wallet = await this.wdb.get(this.selectedID);
      const txHashBuf = Buffer.from(transactions[i].hash, 'hex');

      if (await this.wdb.testFilter(txHashBuf)) {
        continue;
      }

      const wtx = await wallet.getTX(txHashBuf);

      if (wtx) {
        continue;
      }

      const unlock = await this.wdb.txLock.lock();
      try {
        const tx = mapOneTx(transactions[i]);
        await this.pushBobMessage(`Processing block # ${entryOption.height}....`);
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
        await new Promise(r => setTimeout(r, 2));
        retries = 0;
      } catch (e) {
        retries++;
        await new Promise(r => setTimeout(r, 10));
        if (retries > 1000) {
          throw e;
        }
        i = i - 1;
      } finally {
        await unlock();
      }
    }

    this.wdb.rescanning = false;
    await put(this.store,`latest_block_${this.selectedID}`, {
      hash: entryOption.hash,
      height: entryOption.height,
      time: entryOption.time,
    });
  };

  rescanBlocks = async (startHeight: number, endHeight: number) => {
    for (let i = startHeight; i <= endHeight; i++) {
      await this.processBlock(i);
    }
  };

  checkForRescan = async () => {
    if (!this.selectedID) return;

    await this.pushBobMessage('Checking status...');
    const latestBlockNow = await this.exec('node', 'getLatestBlock');
    const latestBlockLast = await get(this.store, `latest_block_${this.selectedID}`);

    if (latestBlockLast && latestBlockLast.height >= latestBlockNow.height) {
      await this.pushBobMessage('I am synchronized.');
      return;
    }

    this.rescanning = true;
    await this.pushState();

    if (latestBlockLast && latestBlockNow.height - latestBlockLast.height <= 100) {
      await this.rescanBlocks(latestBlockLast.height + 1, latestBlockNow.height);
      await this.checkForRescan();
    } else {
      await this.fullRescan();
    }

    await this.pushBobMessage(`I am synchonized.`);

    setTimeout(async () => {
      this.rescanning = false;
      await this.pushState();
    }, 500);
  };

  async start() {
    this.network = Network.get('main');
    this.wdb = new WalletDB({
      network: this.network,
      memory: false,
      location: '/walletdb',
      cacheSize: 256 << 20,
      maxFileSize: 128 << 20,
    });

    this.store = bdb.create('/wallet-store');

    this.wdb.on('error', (err: Error) => console.error('wdb error', err));

    await this.wdb.open();
    await this.store.open();

    if (!this.selectedID) {
      const walletIDs = await this.getWalletIDs();
      this.selectedID = walletIDs.filter(id => id !== 'primary')[0];
    }

    this.checkStatusTimeout = setInterval(this.checkForRescan, 60000);
  }

  async stop() {
    if (this.checkStatusTimeout) {
      clearInterval(this.checkStatusTimeout);
    }
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
