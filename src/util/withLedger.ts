import {LedgerHSD} from "hsd-ledger/lib/hsd-ledger-browser";

export default async function withLedger(
  device: USBDevice,
  network: string,
  action: (ledger: any) => Promise<any>
) {
  const ledger = new LedgerHSD({device, network});

  try {
    await device.open();
    console.log("device open");
  } catch (e) {
    console.error("failed to open ledger", e);
    throw e;
  }

  try {
    return await action(ledger);
  } finally {
    try {
      await device.close();
      console.log("device closed");
    } catch (e) {
      console.error("failed to close ledger", e);
    }
  }
}

export const getAppVersion = (device: USBDevice, network: string) => {
  return withLedger(device, network, async (ledger) => {
    return ledger.getAppVersion();
  });
};

export const getAccountXpub = (device: USBDevice, network: string) => {
  return withLedger(device, network, async (ledger) => {
    return (await ledger.getAccountXPUB(0)).xpubkey(network);
  });
};

// export const signTransaction = (
//   device: USBDevice,
//   network: string,
//   mtx: any,
//   options: any
// ) => {
//   return withLedger(device, network, async (ledger) => {
//     return (await ledger.signTransaction(mtx, options));
//   });
// };
