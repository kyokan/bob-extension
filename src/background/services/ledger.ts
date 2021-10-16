import {GenericService} from "@src/util/svc";
import {LedgerHSD, USB} from "hsd-ledger/lib/hsd-ledger-browser";

const bdb = require("bdb");
const DB = require("bdb/lib/DB");

const KeyRing = require("hsd/lib/primitives/keyring");
const assert = require("bsert");

// Not sure why this throws error
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

export default class LedgerService extends GenericService {
  store: typeof DB;

  devices: any;
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

  bind() {
    this._addDevice = async (event) => {
      const device = Device.fromDevice(event.device);
      await this.addDevice(device);
      this.emit("connect", device);
    };

    this._removeDevice = async (event) => {
      const device = Device.fromDevice(event.device);
      await this.removeDevice(device);
      this.emit("disconnect", device);
    };

    usb.addEventListener("connect", this._addDevice);
    usb.addEventListener("disconnect", this._removeDevice);
  }

  unbind() {
    assert(this._addDevice);
    assert(this._removeDevice);

    usb.removeEventListener("connect", this._addDevice);
    usb.removeEventListener("disconnect", this._removeDevice);

    this._addDevice = null;
    this._removeDevice = null;
  }

  async open() {
    const devices = await Device.getDevices();

    for (const device of devices) await this.addDevice(device);

    this.bind();
  }

  async close() {
    this.unbind();
    this.reset();
  }

  reset() {
    this.devices = new Set();
    this.wusbToDevice = new Map();
    this.selected = null;
  }

  async addDevice(device) {
    assert(device instanceof Device, "Could not add device.");

    if (this.wusbToDevice.has(device.device))
      return this.wusbToDevice.get(device.device);

    this.wusbToDevice.set(device.device, device);
    this.devices.add(device);

    return device;
  }

  async removeDevice(device) {
    assert(device.device, "Could not remove device.");

    if (!Device.isLedgerDevice(device.device)) return;

    const mappedDevice = this.wusbToDevice.get(device.device);

    if (!mappedDevice) return;

    if (this.selected && this.selected.device === mappedDevice.device)
      await this.closeDevice(this.selected);

    this.devices.delete(mappedDevice);
    this.wusbToDevice.delete(mappedDevice.device);

    return;
  }

  getDevices() {
    return this.devices.values();
  }

  /**
   * Only User Action can have an access to this.
   * Otherwise this will fail.
   */

  async requestDevice() {
    const device = await Device.requestDevice();

    return this.addDevice(device);
  }

  async openDevice(device, timeout = 20000) {
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
  }

  async closeDevice(device) {
    assert(this.selected, "No device in use.");
    assert(this.devices.has(device), "Could not find device.");
    assert(this.selected === device, "Can not close closed device.");

    if (this.selected.opened) await this.selected.close();

    this.selected = null;
  }

  async start() {
    this.store = bdb.create("/ledger-store");
    await this.store.open();
  }

  async stop() {}
}

// const manager = new LedgerService();
// const chooseBtn = document.getElementById("choose");
// const chosenDiv = document.getElementById("chosen");
// const devicesDiv = document.getElementById("devices");

// manager.on("connect", renderManager);
// manager.on("disconnect", renderManager);

// chooseBtn.addEventListener("click", async () => {
//   const device = await manager.requestDevice();

//   await manager.openDevice(device);

//   renderManager();
// });

// global.addEventListener("load", async () => {
//   await manager.open();

//   renderManager();
// });

// // We rerender all the time..
// // Use framework or something.
// function renderManager() {
//   const selected = manager.selected;
//   const devices = manager.getDevices();

//   renderChosen(chosenDiv, manager, selected);
//   renderDevices(devicesDiv, manager, devices);
// }

// function renderDevices(element, manager, devices) {
//   removeChildren(element);

//   for (const device of devices) {
//     renderDevice(element, manager, device);
//   }
// }

// function renderDevice(element, manager, device) {
//   const container = document.createElement("div");
//   const name = document.createElement("span");
//   const choose = document.createElement("button");

//   choose.innerText = "Open.";
//   name.innerText = deviceInfoMini(device);

//   // we don't clean up listeners.. too much headache
//   choose.addEventListener("click", async () => {
//     await manager.openDevice(device);

//     renderManager();
//   });

//   container.appendChild(name);
//   container.appendChild(choose);

//   element.appendChild(container);
// }

// function renderChosen(element, manager, device) {
//   removeChildren(element);

//   if (!device) return;

//   const closeBtn = document.createElement("button");

//   closeBtn.innerText = "Close.";
//   closeBtn.addEventListener("click", async function close() {
//     await manager.closeDevice(device);

//     closeBtn.removeEventListener("click", close);

//     renderManager();
//   });

//   const pubkeyBtn = document.createElement("button");
//   pubkeyBtn.innerText = "Get public key";
//   pubkeyBtn.addEventListener("click", async () => {
//     const device = manager.selected;

//     if (!device) {
//       alert("Could not find device.");
//       return;
//     }

//     const ledger = new LedgerHSD({device});
//     const accountKey = await ledger.getAccountXPUB(0);
//     const pubkeyInformation = `
//     Account: m/44'/0'/0'
//     xpub: ${accountKey.xpubkey()}
//     First Receive Address: ${deriveAddress(accountKey, 0, 0, "main")}
//     First Change Address: ${deriveAddress(accountKey, 1, 0, "main")}
//     `;

//     const pubkeyElement = document.createElement("span");
//     pubkeyElement.innerText = pubkeyInformation;
//     element.appendChild(pubkeyElement);
//   });

//   const information = document.createElement("span");
//   information.innerText = deviceInfoAll(device);

//   element.appendChild(information);
//   element.appendChild(closeBtn);
//   element.appendChild(pubkeyBtn);
// }

// function deviceInfoMini(device) {
//   return `${device.manufacturerName} - ${device.productName}`;
// }

// function deviceInfoAll(device) {
//   return `VendorID: ${device.vendorId},
//     ProductID: ${device.productId},
//     Manufacturer: ${device.manufacturerName},
//     Product Name: ${device.productName},
//     Serial Number: ${device.serialNumber}
//   `;
// }

// function removeChildren(element) {
//   while (element.firstChild) element.removeChild(element.firstChild);
// }

// function deriveAddress(hd, change, index, network) {
//   const pubkey = hd.derive(change).derive(index);
//   const keyring = KeyRing.fromPublic(pubkey.publicKey, network);

//   return keyring.getAddress().toString();
// }
