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
