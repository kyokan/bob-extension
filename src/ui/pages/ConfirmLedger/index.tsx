import React, {ReactElement, useCallback, useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import {useHistory} from "react-router";
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
  fetchPendingTransactions,
  Transaction,
} from "@src/ui/ducks/transactions";


export default function ConfirmLedger(): ReactElement {
  const ledgerErr = useLedgerErr();
  const dispatch = useDispatch();
  const pendingTXHashes = useTXQueue();

  const [currentIndex, setCurrentIndex] = useState(0);
  const pendingTx = useQueuedTXByHash(pendingTXHashes[currentIndex]);

  console.log("pendingTx", pendingTx);

  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState(ledgerErr);
  const history = useHistory();

  const confirmTx = useCallback(async (txJSON: Transaction) => {
    setIsLoading(false);
    setErrorMessage("");

    try {
      setIsLoading(true);
      setErrorMessage("");
      await postMessage({
        type: MessageTypes.USE_LEDGER_PROXY,
        payload: txJSON,
      });
    } catch (e: any) {
      setIsLoading(false);
      setErrorMessage(e.message);
    }
  }, []);

  const removeTx = useCallback(async (txJSON: Transaction) => {
    await postMessage({
      type: MessageTypes.REJECT_TX,
      payload: txJSON,
    });
    setIsVisible(false);
    setErrorMessage("");
    dispatch(ledgerConnectHide());
  }, []);

  // const cancelLedger = async () => {
  //   await postMessage({type: MessageTypes.LEDGER_CONNECT_CANCEL});
  //   setIsVisible(false);
  //   setTxid(null);
  //   setErrorMessage("");
  //   history.push("/");
  // };

  useEffect(() => {
    if (ledgerErr !== "") {
      console.error("failed to connect to ledger", {ledgerErr});

      // Totally confusing
      if (ledgerErr === "Device was not selected.")
        setErrorMessage("Could not connect to device.");

      setErrorMessage(`Error confirming on Ledger: ${ledgerErr}`);
      setIsLoading(false);
    }
  }, [ledgerErr]);

  return (
    <RegularView>
      <RegularViewHeader onClose={() => history.push("/")}>
        Confirm On Ledger
      </RegularViewHeader>
      <RegularViewContent>
        <DefaultConnectLedgerSteps completedSteps={[false, false, false]} />
        <ConnectLedgerStep
          stepNumber={4}
          stepDescription="Confirm the transaction info on your ledger device."
          stepCompleted={false}
        />
      </RegularViewContent>
      <RegularViewFooter>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        <Button
          btnType={ButtonType.secondary}
          onClick={() => removeTx(pendingTx)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          disabled={isLoading}
          onClick={() => confirmTx(pendingTx)}
          loading={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect"}
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}
