import {GenericService} from "@src/util/svc";
import {get, put} from "@src/util/db";

import {HID, LedgerHSD} from 'hsd-ledger/lib/hsd-ledger-browser';

const bdb = require("bdb");
const DB = require("bdb/lib/DB");

const {Device} = HID;
const ONE_MINUTE = 60000;

console.log("Device:", Device);
console.log("LedgerHSD:", LedgerHSD);

// const vendorId = 0x2c97;
// const productId = 4117;
// const devices = async () => window.navigator.hid.getDevices();
// let device = devices.find(d => d.vendorId === vendorId && d.productId === productId);
// console.log("devices:", devices());

const LEDGER_APP_VERSION = "ledger_app_version";
const LEDGER_XPUB = "ledger_xpub";

export default class LedgerService extends GenericService {
  store: typeof DB;

  constructor() {
    super();
  }

  // Fix these prop types ***************
  async withLedger(network: string, action: (ledger: any) => Promise<any>) {
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

  async getXPub(network: string) {
    // const xPub = await get(this.store, LEDGER_XPUB);

    // if (!xPub) {
    //   const newXPub = this.withLedger(network, async (ledger) => {
    //     return (await ledger.getAccountXPUB(0)).xpubkey(network);
    //   });
    //   await put(this.store, LEDGER_XPUB, newXPub);
    // }

    // return xPub;

    return this.withLedger(network, async (ledger) => {
      return (await ledger.getAccountXPUB(0)).xpubkey(network);
    });
  }

  async getAppVersion(network: string) {
    return this.withLedger(network, async (ledger) => {
      return ledger.getAppVersion();
    });
  }

  async start() {
    this.store = bdb.create("/ledger-store");
    await this.store.open();
  }

  async stop() {}
}
