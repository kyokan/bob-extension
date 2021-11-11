import React, {useState, useEffect, useRef} from "react";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {LedgerHSD, USB} from "hsd-ledger/lib/hsd-ledger-browser";
const KeyRing = require("hsd/lib/primitives/keyring");

const {Device} = USB;
const ONE_MINUTE = 60000;

export default function DeviceTest() {
  const [device, setDevice] = useState<USBDevice | undefined>();
  const [xpub, setXpub] = useState<string>("");

  const handleRequest = async () => {
    const device = await postMessage({
      type: MessageTypes.REQUEST_DEVICE,
    });
    console.log("REQUEST_DEVICE", device);
  };

  const handleOpen = async () => {
    const usb = navigator.usb;

    if (!usb) {
      alert("Could not find WebUSB.");
      throw new Error("Could not find WebUSB.");
    }

    try {
      const device = await Device.requestDevice();
      await device.set({
        timeout: ONE_MINUTE,
      });
      const openedDevice = await device.open();
      setDevice(openedDevice);
      getAccountXpub(openedDevice);
      console.log("deviced opened");
    } catch (e) {
      console.error("cant open", e);
      setDevice(undefined);
    } finally {
      try {
        await device?.close();
        console.log("deviced closed");
      } catch (e) {
        console.error("failed to close ledger", e);
      }
    }
  };

  const getAccountXpub = async (device: USBDevice) => {
    try {
      const ledger = new LedgerHSD({device});
      const accountKey = await ledger.getAccountXPUB(0);
      setXpub(accountKey.xpubkey());
      console.log(accountKey)
    } catch (e) {
      console.error(e);
    }
  };

  const getAppVersion = async () => {
    const ledger = new LedgerHSD({device});
    const version = await ledger.getAppVersion();
  };

  return (
    <>
      <button onClick={handleOpen}>handleOpen</button>
      <p>xPub: {xpub}</p>
    </>
  );
}
