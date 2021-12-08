import React, {ReactElement, useCallback, useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import {useHistory} from "react-router";
import {USB} from "hsd-ledger/lib/hsd-ledger-browser";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {useLedgerErr, ledgerConnectHide} from "@src/ui/ducks/ledger";
import {
  RegularView,
  RegularViewContent,
  RegularViewFooter,
  RegularViewHeader,
} from "@src/ui/components/RegularView";
import Button, {ButtonType} from "@src/ui/components/Button";
import ConnectLedgerStep, {
  DefaultConnectLedgerSteps,
} from "@src/ui/components/ConnectLedgerSteps";
import ErrorMessage from "@src/ui/components/ErrorMessage";
import "./confirm-ledger.scss";
import {useQueuedTXByHash, useTXQueue} from "@src/ui/ducks/queue";
import {
  Transaction,
  fetchPendingTransactions,
} from "@src/ui/ducks/transactions";
import {LEDGER_USB_VENDOR_ID} from "@src/util/constants";

const {Device} = USB;
const usb = navigator.usb;

export default function ConfirmLedger(): ReactElement {
  const ledgerErr = useLedgerErr();
  const dispatch = useDispatch();
  const pendingTXHashes = useTXQueue();
  const history = useHistory();

  const [isConnected, setIsConnected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isHandshakeApp, setIsHandshakeApp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const pendingTx = useQueuedTXByHash(pendingTXHashes[currentIndex]);

  const confirmTx = useCallback(async (txJSON: Transaction) => {
    setIsLoading(false);

    try {
      setIsLoading(true);
      setErrorMessage("");
      await postMessage({
        type: MessageTypes.USE_LEDGER_PROXY,
        payload: txJSON,
      });
      await dispatch(fetchPendingTransactions());
    } catch (e: any) {
      setIsLoading(false);
      console.log("catch error:", e);
      setErrorMessage(e.message);
    }

    setIsLoading(false);
  }, []);

  const removeTx = useCallback(async (txJSON: Transaction) => {
    await postMessage({
      type: MessageTypes.REJECT_TX,
      payload: txJSON,
    });
    setErrorMessage("");
    dispatch(ledgerConnectHide());
    history.push("/");
  }, []);

  useEffect(() => {
    if (ledgerErr !== "") {
      console.error("failed to connect to ledger", {ledgerErr});

      if (ledgerErr === "Device was not selected.")
        setErrorMessage("Could not connect to device.");

      setErrorMessage(`Error confirming on Ledger: ${ledgerErr}`);
    }
  }, [ledgerErr]);

  async function checkForLedgerDevices() {
    const devices: USBDevice[] = await Device.getDevices();
    const filtered = devices.filter((d) => d.vendorId === LEDGER_USB_VENDOR_ID);
    
    if (filtered[0]) {
      setIsConnected(true);
      setIsUnlocked(true);
      setIsHandshakeApp(true);
      console.log("Ledger connected");
    } else {
      setIsConnected(false);
      setIsUnlocked(false);
      setIsHandshakeApp(false);
      console.log("Ledger disconnected");
    }
  }

  useEffect(() => {
    checkForLedgerDevices();

    usb.addEventListener("connect", checkForLedgerDevices);
    usb.addEventListener("disconnect", checkForLedgerDevices);

    return () => {
      usb.removeEventListener("connect", checkForLedgerDevices);
      usb.removeEventListener("disconnect", checkForLedgerDevices);
    };
  }, []);

  return (
    <RegularView>
      <RegularViewHeader onClose={() => history.push("/")}>
        Confirm On Ledger
      </RegularViewHeader>

      <RegularViewContent>
        <DefaultConnectLedgerSteps
          completedSteps={[isConnected, isUnlocked, isHandshakeApp]}
        />
        <ConnectLedgerStep
          stepNumber={4}
          stepDescription="Confirm the transaction on your ledger."
          stepCompleted={false}
        />
      </RegularViewContent>

      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      <RegularViewFooter>
        <Button
          btnType={ButtonType.secondary}
          onClick={() => removeTx(pendingTx)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          disabled={!isHandshakeApp || isLoading}
          onClick={() => confirmTx(pendingTx)}
          loading={isLoading}
        >
          {isLoading ? "Confirming..." : "Confirm"}
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}
