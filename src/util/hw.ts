import EventEmitter from "events";
const TransactionOptions = require("./txOptions");

const Validator = require('bval');
const WalletDB = require("hsd/lib/wallet/walletdb");
const WalletClient = require("hsd/lib/wallet/client");
const Network = require("hsd/lib/protocol/network");
const HDPrivateKey = require("hsd/lib/hd/private");
const HDPublicKey = require("hsd/lib/hd/public");
const Mnemonic = require("hsd/lib/hd/mnemonic");
const KeyRing = require("hsd/lib/primitives/keyring");
const Address = require("hsd/lib/primitives/address");
const consensus = require("hsd/lib/protocol/consensus");
const Outpoint = require("hsd/lib/primitives/outpoint");
const rules = require("hsd/lib/covenants/rules");
const MTX = require("hsd/lib/primitives/mtx");
const {Resource} = require("hsd/lib/dns/resource");
const WalletCommon = require("hsd/lib/wallet/common");
const Covenant = require("hsd/lib/primitives/covenant");
const TX = require("hsd/lib/primitives/tx");
const {NodeClient} = require("hs-client");
const {EXP} = consensus;

type HWOpts = {
  network: string;
  host?: string;
  port?: number;
  apiKey?: string;
  memory?: boolean;
  location?: string;
  url?: string;
}

type WalletInfo = {
  network: 'main' | 'simnet' | 'regtest' | 'testnet';
  wid: number;
  id: string;
  watchOnly: boolean;
  accountDepth: number;
  token: string;
  tokenDepth: number;
  master: MasterInfo;
  balance: BalanceInfo;
}

type MasterInfo = {
  encrypted: boolean;
  until?: number;
  iv?: string;
  ciphertext?: string;
  algorithm?: string;
  n?: number;
  r?: number;
  p?: number;
  key?: string;
  mnemonic?: string;
}

type BalanceInfo = {
  account: number;
  tx: number;
  coin: number;
  unconfirmed: number;
  confirmed: number;
  lockedUnconfirmed: number;
  lockedConfirmed: number;
}

type AccountInfo = {
  name: string;
  initialized: boolean;
  watchOnly: boolean;
  type: string;
  m: number;
  n: number;
  accountIndex: number;
  receiveDepth: number;
  changeDepth: number;
  lookahead: number;
  receiveAddress: string;
  changeAddress: string;
  accountKey: string;
  keys: string[];
  balance: BalanceInfo;
}

/**
 * Standalone hsd wallet module
 * @extends EventEmitter
 */

export default class HW extends EventEmitter {
  /**
   * Instance of the wallet client in hsd
   */

  private _nodeClient: typeof NodeClient;

  /**
   * Instance of the wallet client in hsd
   */

  private _walletClient: typeof WalletClient;

  /**
   * Instance of the wallet db in hsd
   */

  _wdb: typeof WalletDB;

  /**
   * Current network (default: `main`)
   */

  network: typeof Network;

  /**
   * Create a HW instance.
   * @constructor
   * @param {HWOpts} options
   */

  constructor(options: HWOpts) {
    super();
    this.network = Network.get(options.network || 'main');

    this._nodeClient = new NodeClient({
      network: this.network,
      host: options.host,
      port: options.port,
      apiKey: options.apiKey,
      url: options.url,
      timeout: 60000,
    });

    this._walletClient = new WalletClient({
      network: this.network,
      host: options.host,
      port: options.port,
      apiKey: options.apiKey,
      url: options.url,
      timeout: 60000,
    });

    this._wdb = new WalletDB({
      network: this.network,
      client: this._walletClient,
      memory: options.memory || false,
      location: options.location || undefined,
    });
  }

  /**
   * Open WalletDB
   * @return {Promise}
   */

  async open() {
    await this._wdb.open();
  }

  /**
   * Close WalletDB
   * @return {Promise}
   */

  async close() {
    await this._wdb.close();
  }

  /**
   * Rescan blockchain from a given height.
   * @param {Number?} height
   * @returns {Promise}
   */

  async rescan(height = 0) {
    // await this._wdb.rescan(height);
    const chain = await this._nodeClient.execute('getblockchaininfo', []);
    const blocks = chain?.blocks || 0;
    for (let blockHeight = 0; blockHeight < blocks; blockHeight++) {
      console.log(blockHeight)
      const block = await this._nodeClient.getBlock(blockHeight);
      await this._wdb._addBlock({
        height: block.height,
        hash: Buffer.from(block.hash, 'hex'),
        time: block.time,
      }, mapTx(block.txs));
    }
    console.log('boop')
  }

  /**
   * Resend all pending transactions.
   * @returns {Promise}
   */

  async resend() {
    await this._wdb.resend();
  }

  /**
   * Backup the wallet db.
   * @param {String} path
   * @returns {Promise}
   */

  async backup(path: string) {
    await this._wdb.backup(path);
  }

  /**
   * Get a list of all walets
   * @returns {Promise<string[]>} Wallet IDs
   */

  async getWallets(): Promise<string[]> {
    return await this._wdb.getWallets();
  }


  /**
   * Remove wallet
   * @param walletId
   * @returns Promise
   */

  async removeWallet(walletId: string): Promise<void> {
    return await this._wdb.remove(walletId);
  }

  /**
   * Get wallet
   * @param walletId
   * @returns {Promise<WalletInfo|null>} WalletInfo
   */

  async getWallet(walletId: string): Promise<WalletInfo|null> {
    const wallet = await this._wdb.get(walletId);

    if (!wallet) return null;

    const balance = await wallet.getBalance();
    return wallet.getJSON(false, balance);
  }

  /**
   * Get wallet master
   * @param walletId
   * @returns {Promise<MasterInfo|null>} MasterInfo
   */

  async getWalletMaster(walletId: string): Promise<MasterInfo|null> {
    const wallet = await this._wdb.get(walletId);

    if (!wallet) return null;

    return wallet.master.getJSON(this.network, true);
  }

  // async dev(walletId: string) {
  //   const r = await this._wdb.getAccountHashes(1, 1);
  //   r.forEach((hash: Buffer) => {
  //     const addy = new Address({ hash });
  //     console.log(addy.toString('simnet'));
  //   });
  // }

  /**
   * Create new wallet
   * @param walletOptions
   * @returns {Promise<WalletInfo>} WalletInfo
   */

  async createWallet(walletOptions: {
    id?: string;
    type?: string;
    master?: string;
    passphrase?: string;
    mnemonic?: string;
    accountKey?: string;
    m?: number;
    n?: number;
    witness?: boolean;
    watchOnly?: boolean;
  } = {}): Promise<WalletInfo> {
    const valid = new Validator(walletOptions);

    const master = valid.str('master') && HDPrivateKey.fromBase58(valid.str('master'), this.network);
    const mnemonic = valid.str('mnemonic') && Mnemonic.fromPhrase(valid.str('mnemonic'));
    const accountKey = valid.str('accountKey') && HDPublicKey.fromBase58(valid.str('accountKey'), this.network);

    const wallet = await this._wdb.create({
      id: valid.str('id'),
      type: valid.str('type'),
      m: valid.u32('m'),
      n: valid.u32('n'),
      passphrase: valid.str('passphrase'),
      master: master,
      mnemonic: mnemonic,
      witness: valid.bool('witness'),
      accountKey: accountKey,
      watchOnly: valid.bool('watchOnly')
    });

    const balance = await wallet.getBalance();
    return wallet.getJSON(false, balance);
  }

  /**
   * List account names and indexes from the db.
   * @param {Number} walletId
   * @returns {Promise<string[]>} - Account IDs
   */

  async getAccounts(walletId: string): Promise<string[]> {
    const wallet = await this._wdb.get(walletId);
    return await wallet.getAccounts();
  }

  /**
   * Get account names from a specific wallet.
   * @param {String} walletId
   * @param {Number|String} accountIndex
   * @returns {Promise<AccountInfo|null>} - AccountInfo
   */

  async getAccount(walletId: string, accountIndex: number|string): Promise<AccountInfo|null> {
    const wallet = await this._wdb.get(walletId);

    if (!wallet) return null;

    const account = await wallet.getAccount(accountIndex);

    if (!account) return null;

    const balance = await wallet.getBalance(account.accountIndex);
    return account.getJSON(balance);
  }

  /**
   * Create an account. Requires passphrase if master key is encrypted.
   * @param {String} walletId
   * @param accountOptions
   * @returns {Promise<AccountInfo|null>} - AccountInfo
   */

  async createAccount(walletId: string, accountOptions?: {
    passphrase?: string;
    accountKey?: string;
    account?: string;
    witness?: boolean;
    watchOnly?: boolean;
    type?: string;
    m?: number;
    n?: number;
    lookahead?: number;
  }): Promise<AccountInfo|null> {
    const wallet = await this._wdb.get(walletId);

    if (!wallet) return null;

    const valid = new Validator(accountOptions);
    const accountKey = valid.get('accountKey')
      && HDPublicKey.fromBase58(valid.get('accountKey'), this.network);
    const passphrase = valid.str('passphrase');

    const options = {
      name: valid.str('account'),
      witness: valid.bool('witness'),
      watchOnly: valid.bool('watchOnly'),
      type: valid.str('type'),
      m: valid.u32('m'),
      n: valid.u32('n'),
      accountKey: accountKey,
      lookahead: valid.u32('lookahead')
    };

    const account = await wallet.createAccount(options, passphrase);
    const balance = await wallet.getBalance(account.accountIndex);
    return account.getJSON(balance);
  }

  /**
   * Change or set master key's passphrase.
   * @param {String} walletId
   * @param {String|Buffer} passphrase
   * @param {String|Buffer} oldPassphrase
   * @returns {Promise}
   */

  async setPassphrase(walletId: string, passphrase: string | Buffer, oldPassphrase: string | Buffer) {
    const wallet = await this._wdb.get(walletId);
    await wallet.setPassphrase(passphrase, oldPassphrase);
  }

  /**
   * Destroy the key by zeroing the
   * privateKey and chainCode. Stop
   * the timer if there is one.
   * @param {String} walletId
   * @returns {Promise}
   */

  async lockWallet(walletId: string) {
    const wallet = await this._wdb.get(walletId);
    await wallet.lock();
  }

  /**
   * Decrypt the key and set a timeout to destroy decrypted data.
   * @param {String} walletId
   * @param {Buffer|String} passphrase - Zero this yourself.
   * @param {Number} [timeout=60000] timeout in ms.
   * @returns {Promise} - Returns {@link HDPrivateKey}.
   */

  async unlockWallet(walletId: string, passphrase: string | Buffer, timeout: number = 60000) {
    const wallet = await this._wdb.get(walletId);
    await wallet.unlock(passphrase, timeout);
  }

  /**
   * Import a keyring (will not exist on derivation chain).
   * Rescanning must be invoked manually.
   * @param {String} walletId
   * @param walletOptions
   * @returns {Promise}
   */

  async importKey(walletId: string, walletOptions: {
    account?: string;
    passphrase?: string;
    publicKey?: Buffer;
    privateKey?: string;
    address?: string;
  } = {}) {
    const valid = new Validator(walletOptions);
    const acct = valid.str('account');
    const passphrase = valid.str('passphrase');
    const pub = valid.buf('publicKey');
    const priv = valid.str('privateKey');
    const b58 = valid.str('address');

    const wallet = await this._wdb.get(walletId);

    if (pub) {
      const key = KeyRing.fromPublic(pub);
      await wallet.importKey(acct, key);
      return;
    }

    if (priv) {
      const key = KeyRing.fromSecret(priv, this.network);
      await wallet.importKey(acct, key, passphrase);
      return;
    }

    if (b58) {
      const addr = Address.fromString(b58, this.network);
      await wallet.importAddress(acct, addr);
      return;
    }

    throw new Error('Key or address is required.');
  }

  /**
   * Generate new token
   * @param walletId
   * @param passphrase
   */

  async generateNewToken(walletId: string, passphrase: string) {
    const wallet = await this._wdb.get(walletId);
    await wallet.retoken(passphrase);
  }

  /**
   * Send a transaction
   * @param walletId
   * @param passphrase
   * @param txOptions
   * @returns {Promise}.
   */

  async sendTx (walletId: string, passphrase: string, txOptions: any) {
    const valid = new Validator(txOptions);
    const wallet = await this._wdb.get(walletId);
    const options = TransactionOptions.fromValidator(valid);
    const tx = await wallet.send(options, passphrase);
    const details = await wallet.getDetails(tx.hash());
    return details.getJSON(this.network, this._wdb.height);
  }

  /**
   * Create a transaction
   * @param walletId
   * @param passphrase
   * @param txOptions
   * @param sign
   */

  async createTx(walletId: string, passphrase: string, txOptions: any, sign = true) {
    const valid = new Validator(txOptions);
    const wallet = await this._wdb.get(walletId);
    const options = TransactionOptions.fromValidator(valid);
    const tx = await wallet.createTX(options);

    if (sign)
      await wallet.sign(tx, passphrase);

    return tx.getJSON(this.network);
  }

  /**
   * Sign a raw transaction
   * @param walletId
   * @param passphrase
   * @param raw
   */

  async signTx(walletId: string, passphrase: string, raw: Buffer) {
    const wallet = await this._wdb.get(walletId);
    const tx = MTX.decode(raw);

    tx.view = await wallet.getCoinView(tx);

    await wallet.sign(tx, passphrase);

    return tx.getJSON(this.network);
  }

  /**
   * Zap Wallet TXs
   * @param walletId
   * @param account
   * @param age
   */

  async zap(walletId: string, account: string, age: number) {
    const wallet = await this._wdb.get(walletId);
    await wallet.zap(account, age);
  }

  /**
   * Abandon Tx
   * @param walletId
   * @param hash
   */

  async abandon(walletId: string, hash: string) {
    const wallet = await this._wdb.get(walletId);
    await wallet.abandon(hash);
  }

  /**
   * List Blocks
   * @param walletId
   */

  async getBlocks(walletId: string) {
    const wallet = await this._wdb.get(walletId);
    return await wallet.getBlocks();
  }

  async getBlock(walletId: string, height: number) {
    const wallet = await this._wdb.get(walletId);
    const block = await wallet.getBlock(height);
    return block ? block.toJSON() : null;
  }

  async addSharedKey(walletId: string, account: string, accountKey: string) {
    const wallet = await this._wdb.get(walletId);
    const key = HDPublicKey.fromBase58(accountKey, this.network);
    return await wallet.addSharedKey(account, key);
  }

  async removeSharedKey(walletId: string, account: string, accountKey: string) {
    const wallet = await this._wdb.get(walletId);
    const key = HDPublicKey.fromBase58(accountKey, this.network);
    return await wallet.removeSharedKey(account, key);
  }

  async getKey(walletId: string, address: string) {
    const wallet = await this._wdb.get(walletId);
    const addr = Address.fromString(address, this.network);
    const key = await wallet.getKey(addr);
    return key ? key.getJSON(this.network) : null;
  }

  async getPrivateKey(walletId: string, passphrase: string, address: string) {
    const wallet = await this._wdb.get(walletId);
    const addr = Address.fromString(address, this.network);
    const key = await wallet.getPrivateKey(addr, passphrase);

    if (!key) {
      return null;
    }

    return key.toSecret(this.network);
  }

  async createReceive (walletId: string, account: string) {
    const wallet = await this._wdb.get(walletId);
    const addr = await wallet.createReceive(account);
    return addr ? addr.getJSON(this.network) : null;
  }

  async createChange (walletId: string, account: string) {
    const wallet = await this._wdb.get(walletId);
    const addr = await wallet.createChange(account);
    return addr ? addr.getJSON(this.network) : null;
  }

  async getBalance(walletId: string, account: string) {
    const wallet = await this._wdb.get(walletId);
    const balance = await wallet.getBalance(account);
    return balance ? balance.toJSON() : null;
  }

  async getCoins(walletId: string, account: string) {
    const wallet = await this._wdb.get(walletId);
    const coins = await wallet.getCoins(account);
    const result = [];

    WalletCommon.sortCoins(coins);

    for (const coin of coins) {
      result.push(coin.getJSON(this.network));
    }

    return result;
  }

  async getLocked(walletId: string) {
    const wallet = await this._wdb.get(walletId);
    const locked = wallet.getLocked();
    const result = [];

    for (const outpoint of locked) {
      result.push(outpoint.toJSON());
    }

    return result;
  }

  async lockCoin(walletId: string, hash: string, coinIndex: number) {
    const wallet = await this._wdb.get(walletId);
    const outpoint = new Outpoint(hash, coinIndex);
    await wallet.lockCoin(outpoint);
  }

  async unlockCoin(walletId: string, hash: string, coinIndex: number) {
    const wallet = await this._wdb.get(walletId);
    const outpoint = new Outpoint(hash, coinIndex);
    await wallet.unlockCoin(outpoint);
  }

  async getCoin(walletId: string, hash: string, coinIndex: number) {
    const wallet = await this._wdb.get(walletId);
    const outpoint = new Outpoint(hash, coinIndex);
    await wallet.getCoin(outpoint);
  }

  async getHistory(walletId: string, account: string) {
    const wallet = await this._wdb.get(walletId);
    const txs = await wallet.getHistory(account);

    WalletCommon.sortTX(txs);

    const details = await wallet.toDetails(txs);

    const result = [];

    for (const item of details) {
      result.push(item.getJSON(this.network, this._wdb.height));
    }

    return result;
  }

  async getPending(walletId: string, account: string) {
    const wallet = await this._wdb.get(walletId);
    const txs = await wallet.getPending(account);

    WalletCommon.sortTX(txs);

    const details = await wallet.toDetails(txs);

    const result = [];

    for (const item of details) {
      result.push(item.getJSON(this.network, this._wdb.height));
    }

    return result;
  }

  async getRange(walletId: string, account: string, rangeOption: {
    start?: number;
    end?: number;
    limit?: number;
    reverse?: boolean;
  } = {}) {
    const valid = new Validator(rangeOption);
    const wallet = await this._wdb.get(walletId);

    const options = {
      start: valid.u32('start'),
      end: valid.u32('end'),
      limit: valid.u32('limit'),
      reverse: valid.bool('reverse')
    };

    const txs = await wallet.getRange(account, options);
    const details = await wallet.toDetails(txs);
    const result = [];

    for (const item of details) {
      result.push(item.getJSON(this.network, this._wdb.height));
    }

    return result;
  }

  async getLast(walletId: string, account: string, limit: number) {
    const wallet = await this._wdb.get(walletId);
    const txs = await wallet.getLast(account, limit);
    const details = await wallet.toDetails(txs);
    const result = [];

    for (const item of details) {
      result.push(item.getJSON(this.network, this._wdb.height));
    }

    return result;
  }

  async getTx(walletId: string, hash: Buffer) {
    const wallet = await this._wdb.get(walletId);
    const tx = await wallet.getTX(hash);
    return await wallet.toDetails(tx);
  }

  async resendByWallet(walletId: string) {
    const wallet = await this._wdb.get(walletId);
    await wallet.resend();
  }

  async getNames(walletId: string) {
    const height = this._wdb.height;
    const wallet = await this._wdb.get(walletId);
    const names = await wallet.getNames();
    const items = [];

    for (const ns of names) {
      items.push(ns.getJSON(height, this.network));
    }

    return items;
  }

  async getNameStateByName(walletId: string, name: string) {
    if(!rules.verifyName(name)) {
      throw new Error('Must pass valid name.');
    }

    const height = this._wdb.height;
    const network = this.network;
    const wallet = await this._wdb.get(walletId);
    const ns = await wallet.getNameStateByName(name);

    if (!ns) {
      return null;
    }

    return ns.getJSON(height, network);
  }

  async getAunctions(walletId: string) {
    const wallet = await this._wdb.get(walletId);
    const height = this._wdb.height;
    const network = this.network;

    const names = await wallet.getNames();
    const items = [];

    for (const ns of names) {
      const bids = await wallet.getBidsByName(ns.name);
      const reveals = await wallet.getRevealsByName(ns.name);
      const info = ns.getJSON(height, network);

      info.bids = [];
      info.reveals = [];

      for (const bid of bids) {
        info.bids.push(bid.toJSON());
      }

      for (const reveal of reveals) {
        info.reveals.push(reveal.toJSON());
      }

      items.push(info);
    }

    return items;
  }

  async getAunctionsByName(walletId: string, name: string) {
    if(!rules.verifyName(name)) {
      throw new Error('Must pass valid name.');
    }

    const wallet = await this._wdb.get(walletId);
    const height = this._wdb.height;
    const network = this.network;

    const ns = await wallet.getNameStateByName(name);

    if (!ns) {
      return null;
    }

    const bids = await wallet.getBidsByName(name);
    const reveals = await wallet.getRevealsByName(name);

    const info = ns.getJSON(height, network);
    info.bids = [];
    info.reveals = [];

    for (const bid of bids) {
      info.bids.push(bid.toJSON());
    }

    for (const reveal of reveals) {
      info.reveals.push(reveal.toJSON());
    }

    return info;
  }

  async getBids(walletId: string, own?: boolean) {
    const wallet = await this._wdb.get(walletId);
    const bids = await wallet.getBidsByName();
    const items = [];

    for (const bid of bids) {
      if (!own || bid.own) {
        items.push(bid.toJSON());
      }
    }

    return items;
  }

  async getBidsByName(walletId: string, name: string, _own?: boolean) {
    let own = _own;
    const wallet = await this._wdb.get(walletId);

    if(!rules.verifyName(name)) {
      throw new Error('Must pass valid name.');
    }

    if (!name) {
      own = true;
    }

    const bids = await wallet.getBidsByName(name);
    const items = [];

    for (const bid of bids) {
      if (!own || bid.own) {
        items.push(bid.toJSON());
      }
    }

    return items;
  }

  async getReveals(walletId: string, own?: boolean) {
    const wallet = await this._wdb.get(walletId);
    const reveals = await wallet.getRevealsByName();
    const items = [];

    for (const brv of reveals) {
      if (!own || brv.own) {
        items.push(brv.toJSON());
      }
    }

    return items;
  }

  async getRevealsByName(walletId: string, name: string, _own?: boolean) {
    let own = _own;
    const wallet = await this._wdb.get(walletId);

    if(!rules.verifyName(name)) {
      throw new Error('Must pass valid name.');
    }

    if (!name) {
      own = true;
    }

    const reveals = await wallet.getRevealsByName(name);
    const items = [];

    for (const brv of reveals) {
      if (!own || brv.own) {
        items.push(brv.toJSON());
      }
    }

    return items;
  }

  async getResourceByName(walletId: string, name: string) {
    const wallet = await this._wdb.get(walletId);

    if(!rules.verifyName(name)) {
      throw new Error('Must pass valid name.');
    }

    const ns = await wallet.getNameStateByName(name);

    if (!ns || ns.data.length === 0) {
      return null;
    }

    try {
      const resource = Resource.decode(ns.data);
      return resource.toJSON();
    } catch (e) {
      return null;
    }
  }

  async generateNonce(walletId: string, name: string, options: {
    address?: string;
    bid?: number;
  } = {}) {
    let address;
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(options);
    const addr = valid.str('address');
    const bid = valid.ufixed('bid');

    if(!rules.verifyName(name)) {
      throw new Error('Must pass valid name.');
    }

    try {
      address = Address.fromString(addr, this.network);
    } catch (e) {
      return null;
    }

    const nameHash = rules.hashName(name);
    const nonce = await wallet.generateNonce(nameHash, address, bid);
    const blind = rules.blind(bid, nonce);

    return {
      address: address.toString(this.network),
      blind: blind.toString('hex'),
      nonce: nonce.toString('hex'),
      bid: bid,
      name: name,
      nameHash: nameHash.toString('hex')
    };
  }

  async importNonce(walletId: string, options: {
    name?: string;
    address?: string;
    bid?: number;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(options);
    const name = valid.str(0);
    const addr = valid.str(1);
    const value = valid.ufixed(2, EXP);

    if (!name || !rules.verifyName(name))
      throw new Error('Invalid name.');

    if (addr == null)
      throw new Error('Invalid value.');

    if (value == null)
      throw new Error('Invalid value.');

    const nameHash = rules.hashName(name);
    const address = parseAddress(addr, this.network);

    const blind = await wallet.generateBlind(nameHash, address, value);

    return blind.toString('hex');
  }

  async createOpen(walletId: string, opt: {
    name?: string;
    force?: boolean;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const force = valid.bool('force', false);
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (!name) {
      throw new Error('Name is required.');
    }

    if (broadcast && !sign) {
      throw new Error('Must sign when broadcasting.');
    }

    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createOpen(name, force, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }

  async createBid(walletId: string, opt: {
    name?: string;
    bid?: number;
    lockup?: number;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const bid = valid.u64('bid');
    const lockup = valid.u64('lockup');
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (bid === null) {
      throw new Error('Bid is required.');
    }

    if (lockup === null) {
      throw new Error('Lockup is required.');
    }

    if (!name) {
      throw new Error('Name is required.');
    }

    if (broadcast && !sign) {
      throw new Error('Must sign when broadcasting.');
    }

    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createBid(name, bid, lockup, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }

  async createReveal(walletId: string, opt: {
    name?: string;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (!name) {
      throw new Error('Name is required.');
    }

    if (broadcast && !sign) {
      throw new Error('Must sign when broadcasting.');
    }

    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createReveal(name, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }

  async createRedeem(walletId: string, opt: {
    name?: string;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (broadcast && !sign) {
      throw new Error('Must sign when broadcasting.');
    }

    if (!name) {
      const tx = await wallet.sendRedeemAll();
      return tx.getJSON(this.network);
    }

    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createRedeem(name, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }

  async createUpdate(walletId: string, opt: {
    name?: string;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
    data?: any;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const data = valid.obj('data');
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (broadcast && !sign) throw new Error('Must sign when broadcasting.');
    if (!name) throw new Error('Must pass name.');
    if (!data) throw new Error('Must pass data.');

    let resource;
    try {
      resource = Resource.fromJSON(data);
    } catch (e) {
      return null;
    }

    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createUpdate(name, resource, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }

  async createRenewal(walletId: string, opt: {
    name?: string;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (broadcast && !sign) throw new Error('Must sign when broadcasting.');
    if (!name) throw new Error('Must pass name.');

    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createRenewal(name, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }

  async createTransfer(walletId: string, opt: {
    name?: string;
    address?: string;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const address = valid.str('address');
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (broadcast && !sign) throw new Error('Must sign when broadcasting.');
    if (!name) throw new Error('Must pass name.');
    if (!address) throw new Error('Must pass address.');

    const addr = Address.fromString(address, this.network);
    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createTransfer(name, addr, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }

  async createCancel(walletId: string, opt: {
    name?: string;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (broadcast && !sign) throw new Error('Must sign when broadcasting.');
    if (!name) throw new Error('Must pass name.');

    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createCancel(name, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }

  async createFinalize(walletId: string, opt: {
    name?: string;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (broadcast && !sign) throw new Error('Must sign when broadcasting.');
    if (!name) throw new Error('Must pass name.');

    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createFinalize(name, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }

  async createRevoke(walletId: string, opt: {
    name?: string;
    passphrase?: string;
    broadcast?: boolean;
    sign?: boolean;
  } = {}) {
    const wallet = await this._wdb.get(walletId);
    const valid = new Validator(opt);
    const name = valid.str('name');
    const passphrase = valid.str('passphrase');
    const broadcast = valid.bool('broadcast', true);
    const sign = valid.bool('sign', true);

    if (broadcast && !sign) throw new Error('Must sign when broadcasting.');
    if (!name) throw new Error('Must pass name.');

    const options = TransactionOptions.fromValidator(valid);
    const mtx = await wallet.createRevoke(name, options);

    if (broadcast) {
      const tx = await wallet.sendMTX(mtx, passphrase);
      return tx.getJSON(this.network);
    }

    if (sign) {
      await wallet.sign(mtx, passphrase);
    }

    return mtx.getJSON(this.network);
  }



}

function parseAddress(raw: string, network: any) {
  try {
    return Address.fromString(raw, network);
  } catch (e) {
    throw new Error('Invalid address.');
  }
}

function mapTx(txs: any[]) {
  const ret = [];
  for (let i = 0; i < txs.length; i++) {
    const txOptions = txs[i];
    const tx = mapOneTx(txOptions);
    ret.push(tx);
  }
  return ret;
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
        input.coin.covenant.items.map((item: string) => Buffer.from(item, 'hex')),
      );
    }

    if (input.witness) {
      input.witness = input.witness.map((wit: string) => Buffer.from(wit, 'hex'));
    }

    return input;
  });

  txOptions.outputs = txOptions.outputs.map((output: any) => {
    if (output.covenant) {
      output.covenant = new Covenant(
        output.covenant.type,
        output.covenant.items.map((item: string) => Buffer.from(item, 'hex')),
      );

    }
    return output;
  });
  const tx = new TX(txOptions);
  return tx;
}
