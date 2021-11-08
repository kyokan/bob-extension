import React, {useState, useEffect, useRef} from "react";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {parse, stringify, toJSON, fromJSON} from "flatted";

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
  const [devices, setDevices] = useState<any[] | undefined>();

  const loadDevices = async () => {
    await postMessage({
      type: MessageTypes.OPEN_DEVICES,
    });
    renderManager();
  };

  // We rerender all the time..
  // Use framework or something.
  const renderManager = async () => {
    const selected = await postMessage({
      type: MessageTypes.GET_SELECTED,
    });
    const devices = await postMessage({
      type: MessageTypes.GET_DEVICES,
    });
    // console.log("DEVICES:", parse(devices));

    // renderChosen(selected);
    // setDevices(devices);
    console.log("setDevices:", devices);

    console.log("**Render Manager**");
  };

  // app.on("connect", renderManager);
  // app.on("disconnect", renderManager);

  const RenderDevice = () => {
    // we don't clean up listeners.. too much headache
    const handleClick = async (device: USB) => {
      await postMessage({
        type: MessageTypes.OPEN_DEVICE,
        payload: {
          device: stringify(device),
        },
      });

      renderManager();
    };

    return (
      <div>
        {/* {devices?.map((device, key) => (
          <div key={key}>
            <p>{device.productName}</p>
            <p>{deviceInfoMini(device)}</p>
            <p>{device.serialNumber}</p>
            <button onClick={() => handleClick(device)}>open</button>
          </div>
        ))} */}
      </div>
    );
  };

  function renderChosen(device: USBDevice) {
    if (!device) return console.log("no device");
    // const closeBtn = document.createElement("button");
    // closeBtn.innerText = "Close.";
    // closeBtn.addEventListener("click", async function close() {
    //   await postMessage({
    //     type: MessageTypes.CLOSE_DEVICE,
    //     payload: {
    //       device: device,
    //     },
    //   });
    //   closeBtn.removeEventListener("click", close);
    //   renderManager();
    // });

    const pubkeyBtn = async () => {
      const selectedDevice = await postMessage({
        type: MessageTypes.GET_SELECTED,
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
      console.log(pubkeyInformation);
    };

    console.log("renderCHosen:", deviceInfoAll(device));
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
    // const selected = await postMessage({
    //   type: MessageTypes.OPEN_DEVICE,
    //   payload: {
    //     device: device,
    //   },
    // });
    console.log("REQUEST_DEVICE", device);
    // renderManager();
  };

  useEffect(() => {
    loadDevices();
    renderManager();
  }, []);

  return (
    <>
      <RenderDevice />
    </>
  );
}
