import React, {ReactElement, useCallback, useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import {useHistory} from "react-router";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {useLedgerErr, useTxid, ledgerConnectHide} from "@src/ui/ducks/ledger";
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

import {getFirstLedgerDevice} from "@src/util/webusb";

export default function ConfirmLedger(): ReactElement {
  const ledgerTxid = useTxid();
  const ledgerErr = useLedgerErr();
  const dispatch = useDispatch();
  const pendingTXHashes = useTXQueue();

  const [currentIndex, setCurrentIndex] = useState(0);
  const pendingTx = useQueuedTXByHash(pendingTXHashes[currentIndex]);

  console.log("pendingTx", pendingTx);

  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [txid, setTxid] = useState<string | null>(ledgerTxid);
  const [errorMessage, setErrorMessage] = useState(ledgerErr);
  const history = useHistory();

  const onLedgerConnectReq = (evt: any, txId: string) => {
    setIsVisible(true);
    setTxid(txId);
  };

  const onClickConnect = async () => {
    // await postMessage({type: MessageTypes.LEDGER_CONNECT_RES});
    const ledgerProxy = await postMessage({
      type: MessageTypes.USE_LEDGER_PROXY,
      payload: pendingTx,
    });
    console.log(ledgerProxy);
    // console.log(getFirstLedgerDevice())
    setIsLoading(true);
    setErrorMessage("");
  };

  const cancelLedger = useCallback(async (txJSON: Transaction) => {
    await postMessage({
      type: MessageTypes.REJECT_TX,
      payload: txJSON,
    });
    setIsVisible(false);
    setTxid(null);
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
          onClick={cancelLedger}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          disabled={isLoading}
          onClick={onClickConnect}
          loading={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect"}
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}
