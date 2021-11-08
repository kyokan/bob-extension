import React, {useState, useEffect, useRef} from "react";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import semver from "semver";
import {LEDGER_MINIMUM_VERSION} from "../../../util/constants";

import {AppService} from "@src/util/svc";

import {LedgerHSD, USB} from "hsd-ledger/lib/hsd-ledger-browser";
const KeyRing = require("hsd/lib/primitives/keyring");

const {Device} = USB;

type HDPublicKeyShape = {
  depth: any;
  childIndex: any;
  parentFingerPrint: any;
  chainCode: any;
  publicKey: any;
  network: any;
};

export default function DeviceTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [xpub, setXpub] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadDevices = async () => {
    await postMessage({
      type: MessageTypes.OPEN_DEVICES,
    });
  };

  const onConnectDevice = async () => {
    const device = await postMessage({
      type: MessageTypes.CONNECT_DEVICE,
    });

    // if (!device) {
    //   alert("Could not find device.");
    //   return;
    // }

    // const ledger = new LedgerHSD({device});

    // const accountKey = await ledger.getAccountXPUB(0, {confirm: true});

    // const pubkeyInformation = `
    //   Account: m/44'/0'/0'
    //   xpub: ${accountKey.xpubkey()}
    //   First Receive Address: ${deriveAddress(accountKey, 0, 0, "main")}
    //   First Change Address: ${deriveAddress(accountKey, 1, 0, "main")}
    // `;

    console.log("DEVICE:", device);
  };

  function deriveAddress(
    hd: any,
    change: number,
    index: number,
    network: string
  ) {
    const pubkey = hd.derive(change).derive(index);
    const keyring = KeyRing.fromPublic(pubkey.publicKey, network);

    return keyring.getAddress().toString();
  }

  const handleRequest = async () => {
    const selected = await postMessage({
      type: MessageTypes.OPEN_DEVICE,
    });
    console.log("handleRequest", selected);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const onConnect = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const appVersion = await postMessage({
        type: MessageTypes.GET_APP_VERSION,
      });
      console.log(
        `HNS Ledger app verison is ${appVersion}, minimum is ${LEDGER_MINIMUM_VERSION}`
      );
      if (!semver.gte(appVersion, LEDGER_MINIMUM_VERSION)) {
        setIsLoading(false);
        setIsCreating(false);
        setErrorMessage(
          `Ledger app version ${LEDGER_MINIMUM_VERSION} is required. (${appVersion} installed)`
        );
        return;
      }

      const getXpub = await postMessage({
        type: MessageTypes.GET_XPUB,
      });
      setXpub(getXpub);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      setIsCreating(false);
      setErrorMessage("Error connecting to device.");
      return;
    }

    setIsCreating(true);
    console.log("Account xPub:", xpub);
  };

  const requestDevice = async () => {
    const device = navigator.usb.requestDevice({filters: [{vendorId: 0x2c97}]})
    try {
      await postMessage({
        type: MessageTypes.OPEN_DEVICE,
        payload: {
          device: device,
        },
      });
    } catch (e: any) {
      console.log(e);
    }
  };


  const getDevices = async () => {
    try {
      const devices = await navigator.usb.getDevices()
      console.log(devices)
    } catch (e: any) {
      console.log(e);
    }
  };

  return (
    <>
      {errorMessage && <p>{errorMessage}</p>}
      <button
        onClick={getDevices}
      >
        get devices
      </button>
      <button
        onClick={requestDevice}
      >
        request device
      </button>
      <button onClick={onConnectDevice}>
        {isLoading
          ? isCreating
            ? "Creating wallet..."
            : "Connecting..."
          : "Connect to Ledger"}
      </button>
    </>
  );
}
