import mixpanel, {Mixpanel} from "mixpanel-browser";
import {GenericService} from "@src/util/svc";
import {get, put} from "@src/util/db";
import crypto from "crypto";
import * as os from "os";
const bdb = require("bdb");
const DB = require("bdb/lib/DB");
const pkg = require("../../../package.json");

const UUID_KEY = "uuid_key";

declare interface AnalyticsService {
  mp?: Mixpanel;
}

class AnalyticsService extends GenericService {
  store: typeof DB;

  async getUser() {
    const u = await get(this.store, UUID_KEY);

    if (!u) {
      const newUUID = crypto.randomBytes(20).toString("hex");
      await put(this.store, UUID_KEY, newUUID);
    }

    return u;
  }

  async initTracking() {
    const optIn = await this.exec("setting", "getAnalytics");

    if (optIn && !this.mp) {
      const u = await this.getUser();
      mixpanel.init("d4447597e84efbaa046917fb6496f92e");
      mixpanel.people.set(u, {
        platform: os.platform(),
        arch: os.arch(),
        appVersion: pkg.version,
      });
      mixpanel.track("Init App");
      this.mp = mixpanel;
      return;
    }

    if (!optIn) {
      this.mp = undefined;
    }
  }

  async track(name: string, data: any) {
    await this.initTracking();
    if (!this.mp) {
      return;
    }

    this.mp.track(name, data);
  }

  async start() {
    this.store = bdb.create("/wallet-store");
    await this.store.open();
    await this.initTracking();
  }

  async stop() {}
}

export default AnalyticsService;
