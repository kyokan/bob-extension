import {GenericService} from "@src/util/svc";
const Mnemonic = require('hsd/lib/hd/mnemonic');
const WalletDB = require("hsd/lib/wallet/walletdb");
const Client = require("hsd/lib/wallet/nullclient");
const Network = require("hsd/lib/protocol/network");

export default class WalletService extends GenericService {
  network: typeof Network;
  wdb: typeof WalletDB;

  async generateNewMnemonic() {
    return new Mnemonic({ bits: 256 }).getPhrase().trim();
  }

  getWalletIDs = async () => {
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
  }

  async stop() {

  }

}
