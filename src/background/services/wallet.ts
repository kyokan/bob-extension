import {GenericService} from "@src/util/svc";
const Mnemonic = require('hsd/lib/hd/mnemonic');
const WalletDB = require("hsd/lib/wallet/walletdb");
const Network = require("hsd/lib/protocol/network");

export default class WalletService extends GenericService {
  network: typeof Network;

  wdb: typeof WalletDB;

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
    return {
      selectedID: this.selectedID,
      locked: this.locked,
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
      const wallet = await this.wdb.get(this.selectedID);
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

  createWallet = async (options: {
    id: string;
    passphrase: string;
    mnemonic: string;
  }) => {
    const wallet = await this.wdb.create(options);
    const balance = await wallet.getBalance();
    return wallet.getJSON(false, balance);
  };

  async start() {
    this.network = Network.get('main');
    this.wdb = new WalletDB({
      network: this.network,
      memory: false,
      location: '/walletdb',
    });

    this.wdb.on('error', (err: Error) => console.error('wdb error', err));

    await this.wdb.open();

    if (!this.selectedID) {
      const walletIDs = await this.getWalletIDs();
      this.selectedID = walletIDs.filter(id => id !== 'primary')[0];
    }
  }

  async stop() {

  }

}
