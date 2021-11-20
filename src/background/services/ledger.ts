import {GenericService} from "@src/util/svc";
import {LedgerHSD, USB} from "hsd-ledger/lib/hsd-ledger-browser";
import {get, put} from "@src/util/db";
import {parse, stringify, toJSON} from "flatted";

const bdb = require("bdb");
const DB = require("bdb/lib/DB");
const KeyRing = require("hsd/lib/primitives/keyring");
const assert = require("bsert");

const {Device} = USB;
const usb = navigator.usb;

if (!usb) {
  alert("Could not find WebUSB.");
  throw new Error("Could not find WebUSB.");
}

/**
 * @param {Device[]} devices
 * @param {Device?} selected
 * @param {Device?} device
 */

declare interface LedgerService {
  devices: Set<any>;
  wusbToDevice: Map<string, any>;
  selected: USBDevice | null;

  _addDevice: any;
  _removeDevice: any;

  on(event: "connect", listener: (device: any) => void): this;
  on(event: "disconnect", listener: (device: any) => void): this;
}

class LedgerService extends GenericService {
  store: typeof DB;

  constructor() {
    super();
    this.devices = new Set();
    this.wusbToDevice = new Map();
    this.selected = null;

    // Callbacks for event listener to clean up later.
    this._addDevice = null;
    this._removeDevice = null;
  }

  bind = () => {
    this._addDevice = async (event: USBConnectionEvent) => {
      const device = Device.fromDevice(event.device);
      await this.addDevice(device);
      this.emit("connect", device);
      console.log("emit connect");
    };

    this._removeDevice = async (event: USBConnectionEvent) => {
      const device = Device.fromDevice(event.device);
      await this.removeDevice(device);
      this.emit("disconnect", device);
      console.log("emit disconnect");
    };

    usb.addEventListener("connect", this._addDevice);
    usb.addEventListener("disconnect", this._removeDevice);
  };

  unbind() {
    assert(this._addDevice);
    assert(this._removeDevice);

    usb.removeEventListener("connect", this._addDevice);
    usb.removeEventListener("disconnect", this._removeDevice);

    this._addDevice = null;
    this._removeDevice = null;
  }

  open = async () => {
    const devices = await Device.getDevices();

    for (const device of devices) {
      await this.addDevice(device);
      console.log("open USB:", device);
    }

    this.bind();
  };

  async close() {
    this.unbind();
    this.reset();
  }

  reset() {
    this.devices = new Set();
    this.wusbToDevice = new Map();
    this.selected = null;
  }

  addDevice = async (device) => {
    assert(device instanceof Device, "Could not add device.");

    if (this.wusbToDevice.has(device.device))
      return this.wusbToDevice.get(device.device);

    this.wusbToDevice.set(device.device, device);
    this.devices.add(device);

    console.log("addDevice:", device);

    return device;
  };

  removeDevice = async (device) => {
    assert(device.device, "Could not remove device.");

    if (!Device.isLedgerDevice(device.device)) return;

    const mappedDevice = this.wusbToDevice.get(device.device);

    if (!mappedDevice) return;

    if (this.selected && this.selected.device === mappedDevice.device)
      await this.closeDevice(this.selected);

    this.devices.delete(mappedDevice);
    this.wusbToDevice.delete(mappedDevice.device);

    return;
  };

  async getDevices() {
    const devicesArray = usb.getDevices();
    console.log("getDevices:", devicesArray);
    return devicesArray;
  }

  async getSelected() {
    console.log("getSelected:", this.selected);
    return stringify(this.selected);
  }

  /**
   * Only User Action can have an access to this.
   * Otherwise this will fail.
   */

  requestDevice = async () => {
    const device = await Device.requestDevice();

    return this.addDevice(device);
  };

  openDevice = async (device, timeout = 20000) => {
    this.selected = parse(device);
    console.log("openDevice:", parse(device));
    console.log("openDevice selected:", this.selected);
    // assert(!this.selected, "Other device already in use.");
    // assert(this.devices.has(device), "Could not find device.");

    // this.selected = device;

    // device.set({timeout});

    // try {
    //   await this.selected.open();
    //   this.emit("device open", this.selected);
    // } catch (e) {
    //   console.error(e);
    //   this.selected = null;
    // }

    // return this.selected;
  };

  closeDevice = async (device: any) => {
    assert(this.selected, "No device in use.");
    assert(this.devices.has(device), "Could not find device.");
    assert(this.selected === device, "Can not close closed device.");

    if (this.selected?.opened) await this.selected.close();

    this.selected = null;
  };

  // connectDevice = async (device = this.selected, timeout = 20000) => {
  //   assert(!this.selected, "Other device already in use.");
  //   assert(this.devices.has(device), "Could not find device.");

  //   this.selected = device;

  //   device.set({timeout});

  //   try {
  //     await this.selected.open();
  //     this.emit("device open", this.selected);
  //     console.log("device opened");
  //   } catch (e) {
  //     console.error(e);
  //     // this.selected = null;
  //   } finally {
  //     console.log("finally");
  //     // const ledger = new LedgerHSD(this.selected);

  //     // const accountKey = await ledger.getAccountXPUB(0, {confirm: true});
  //     // console.log("accountKey:", accountKey);
  //   }

  //   // return this.selected
  // };

  async start() {
    this.store = bdb.create("/ledger-store");
    await this.store.open();
  }

  async stop() {}
}

export default LedgerService;

function replacer(key, value) {
  if (value instanceof USBDevice) {
    return {
      dataType: "USBDevice",
      value: {...value},
    };
  } else {
    return value;
  }
}
