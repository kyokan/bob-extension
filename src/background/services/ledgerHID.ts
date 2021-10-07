import {GenericService} from "@src/util/svc";
import {LedgerHSD, USB} from 'hsd-ledger';

const bdb = require("bdb");
const DB = require("bdb/lib/DB");
const MTX = require("hsd/lib/primitives/mtx");


const {Device} = USB;
const ONE_MINUTE = 60000;

export default class LedgerService extends GenericService {
  store: typeof DB;

  constructor() {
    super();
  }

  async withLedger(network, action) {
    let device;
    let ledger;

    try {
      device = await Device.requestDevice();
      device.set({
        timeout: ONE_MINUTE,
      });

      await device.open();
      // TODO: this network parameter should be passed dynamically.
      ledger = new LedgerHSD({device, network});
    } catch (e) {
      console.error("failed to open ledger", e);
      throw e;
    }

    try {
      return await action(ledger);
    } finally {
      try {
        await device.close();
      } catch (e) {
        console.error("failed to close ledger", e);
      }
    }
  }

  async getXPub(network: any) {
    return this.withLedger(network, async (ledger) => {
      return (await ledger.getAccountXPUB(0)).xpubkey(network);
    });
  }

  async getAppVersion(network: any) {
    return this.withLedger(network, async (ledger) => {
      return ledger.getAppVersion();
    });
  }

  async start() {
    // Not sure these are needed any longer
    //
    // const methods = {
    //   getXPub,
    //   getAppVersion,
    // };
    // const sName = "Ledger";

    this.store = bdb.create("/ledger-store");
    await this.store.open();
  }
}
