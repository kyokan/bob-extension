import React, {useState, useEffect, useRef} from "react";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {parse, stringify, toJSON, fromJSON} from "flatted";

import {AppService} from "@src/util/svc";

import {LedgerHSD} from "hsd-ledger/lib/hsd-ledger-browser";
const KeyRing = require("hsd/lib/primitives/keyring");

type AccountKeyProps = {
  depth: any;
  childIndex: any;
  parentFingerPrint: any;
  chainCode: any;
  publicKey: any;
  network: any;
};

export default function DeviceTest() {
  // const app = new AppService;
  const chosenDiv = useRef<HTMLDivElement | null>(null);
  const devicesRef = useRef<HTMLDivElement | null>(null);

  const loadDevices = async () => {
    await postMessage({
      type: MessageTypes.OPEN_DEVICES,
    });
    renderManager();
  };

  // We rerender all the time..
  // Use framework or something.
  const renderManager = async () => {
    const selected = null;
    const devices: IterableIterator<any> = await postMessage({
      type: MessageTypes.GET_DEVICES,
    });
    console.log("DEVICES:", devices);

    // if (null !== chosenDiv.current) {
    //   renderChosen(chosenDiv, selected);
    // }
    if (null !== devicesRef.current) {
      renderDevices(devicesRef, devices);
    }
  };

  // app.on("connect", renderManager);
  // app.on("disconnect", renderManager);

  function renderDevices(element, devices) {
    removeChildren(element);
    for (const device of devices) {
      console.log(device);
      // renderDevice(element, device);
    }
  }

  const renderDevice = (element: HTMLDivElement, device: any) => {
    console.log(element);
    console.log(device);
    // const container = React.createElement("div");
    // const name = React.createElement("span");
    // const choose = React.createElement("button");

    // // we don't clean up listeners.. too much headache
    // const handleClick = async () => {
    //   await postMessage({
    //     type: MessageTypes.OPEN_DEVICE,
    //     payload: {
    //       device: device,
    //     },
    //   });

    //   renderManager();
    // };

    // container.appendChild(name);
    // container.appendChild(choose);

    // element.appendChild(container);
  };

  function renderChosen(element, device) {
    removeChildren(element);
    if (!device) return console.log("no device");
    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Close.";
    closeBtn.addEventListener("click", async function close() {
      await postMessage({
        type: MessageTypes.CLOSE_DEVICE,
        payload: {
          device: device,
        },
      });
      closeBtn.removeEventListener("click", close);
      renderManager();
    });
    const pubkeyBtn = document.createElement("button");
    pubkeyBtn.innerText = "Get public key";
    pubkeyBtn.addEventListener("click", async () => {
      const selectedDevice = await postMessage({
        type: MessageTypes.GET_SELECTED_DEVICE,
      });
      if (!selectedDevice) {
        alert("Could not find device.");
        return;
      }
      const ledger = new LedgerHSD({selectedDevice});
      const accountKey = await ledger.getAccountXPUB(0);
      const pubkeyInformation = `
    Account: m/44'/0'/0'
    xpub: ${accountKey.xpubkey()}
    First Receive Address: ${deriveAddress(accountKey, 0, 0, "main")}
    First Change Address: ${deriveAddress(accountKey, 1, 0, "main")}
    `;
      const pubkeyElement = document.createElement("span");
      pubkeyElement.innerText = pubkeyInformation;
      element.appendChild(pubkeyElement);
    });
    const information = document.createElement("span");
    information.innerText = deviceInfoAll(device);
    element.appendChild(information);
    element.appendChild(closeBtn);
    element.appendChild(pubkeyBtn);
  }

  function deviceInfoMini(device: any) {
    return `${device.manufacturerName} - ${device.productName}`;
  }

  function deviceInfoAll(device: any) {
    return `VendorID: ${device.vendorId},
    ProductID: ${device.productId},
    Manufacturer: ${device.manufacturerName},
    Product Name: ${device.productName},
    Serial Number: ${device.serialNumber}
  `;
  }

  function removeChildren(element: HTMLDivElement) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

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
    const device = await postMessage({
      type: MessageTypes.REQUEST_DEVICE,
    });
    const selected = await postMessage({
      type: MessageTypes.OPEN_DEVICE,
      payload: {
        device: device,
      },
    });
    console.log("device", selected);
    renderManager();
  };

  useEffect(() => {
    loadDevices();
    // renderManager();
  }, []);

  return (
    <>
      <div>
        <button id="choose" onClick={handleRequest}>
          Choose New Device
        </button>
      </div>

      <h3> Open device: </h3>
      <div id="chosen" ref={chosenDiv}></div>

      <h3> Loaded devices </h3>
      <div id="devices" ref={devicesRef}></div>
    </>
  );
}
