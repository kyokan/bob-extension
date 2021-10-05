import {GenericService} from "@src/util/svc";
import hsdLedger from "hsd-ledger";

const bdb = require("bdb");
const DB = require("bdb/lib/DB");
const MTX = require("hsd/lib/primitives/mtx");

const {LedgerHSD} = hsdLedger;
const {Device} = hsdLedger.USB;
const ONE_MINUTE = 60000;

export default class LedgerService extends GenericService {
  store: typeof DB;

  constructor() {
    super();
  }

  async withLedger(network: any, action: any) {
    let device;
    let ledger;

    try {
      await Device.requestDevice();
      const devices = await Device.getDevices();
      device = devices[0];
      device.set({
        timeout: ONE_MINUTE,
      });
      if (!Device.isLedgerDevice(device))
        throw new Error("Device should be a Ledger device.");

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
    return this.withLedger(network, async (ledger: any) => {
      return (await ledger.getAccountXPUB(0)).xpubkey(network);
    });
  }

  async getAppVersion(network: any) {
    return this.withLedger(network, async (ledger: any) => {
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
