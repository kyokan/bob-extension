import {GenericService} from "@src/util/svc";
import {USB} from "hsd-ledger/lib/hsd-ledger-browser";
import {get, put} from "@src/util/db";
import {parse, stringify, toJSON, fromJSON} from "flatted";

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

const SELECTED_DEVICE = "selected_device";

/**
 * @param {Device[]} devices
 * @param {Device?} selected
 * @param {Device?} device
 */

export default class LedgerService extends GenericService {
  store: typeof DB;

  devices: Set<any>;
  wusbToDevice: any;
  selected: any;
  _addDevice: any;
  _removeDevice: any;

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
    this._addDevice = async (event) => {
      const device = Device.fromDevice(event.device);
      await this.addDevice(device);
      this.emit("connect", device);
      console.log("emit addDevice");
    };

    this._removeDevice = async (event: {device: any}) => {
      const device = Device.fromDevice(event.device);
      await this.removeDevice(device);
      this.emit("disconnect", device);
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
    for (const device of devices) await this.addDevice(device);
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

  addDevice = async (device: any) => {
    assert(device instanceof Device, "Could not add device.");

    if (this.wusbToDevice.has(device.device))
      return this.wusbToDevice.get(device.device);

    this.wusbToDevice.set(device.device, device);
    this.devices.add(device);

    // await put(this.store, SELECTED_DEVICE, this.devices);

    console.log("addDevice:", device.device);
    console.log("this.devices:", this.devices.values());
    console.log("this.wusbToDevice", this.wusbToDevice);

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
    // console.log("devices", this.devices.values());
    // console.log(this.devices);
    return this.devices.values()
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
    assert(!this.selected, "Other device already in use.");
    assert(this.devices.has(device), "Could not find device.");

    this.selected = device;

    device.set({timeout});

    try {
      await this.selected.open();
      this.emit("device open", this.selected);
    } catch (e) {
      console.error(e);
      this.selected = null;
    }

    return this.selected;
  };

  closeDevice = async (device: any) => {
    assert(this.selected, "No device in use.");
    assert(this.devices.has(device), "Could not find device.");
    assert(this.selected === device, "Can not close closed device.");

    if (this.selected.opened) await this.selected.close();

    this.selected = null;
  };

  async start() {
    this.store = bdb.create("/ledger-store");
    await this.store.open();
  }

  async stop() {}
}
