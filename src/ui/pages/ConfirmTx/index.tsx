import React, {ReactElement, ReactNode, useCallback, useState} from "react";
import {RegularView, RegularViewContent, RegularViewFooter, RegularViewHeader} from "@src/ui/components/RegularView";
import {useHistory} from "react-router";
import {useQueuedTXByHash, useTXQueue} from "@src/ui/ducks/queue";
import Button, {ButtonType} from "@src/ui/components/Button";
import {getTXAction, getTXNameHash, getTXRecipient, getTXValue} from "@src/util/transaction";
import {fetchPendingTransactions, Transaction} from "@src/ui/ducks/transactions";
import Input from "@src/ui/components/Input";
import {formatNumber, fromDollaryDoos} from "@src/util/number";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import "./confirm-tx.scss";
import UpdateTx from "@src/ui/pages/UpdateTx";
import {useDispatch} from "react-redux";

const actionToTitle: {
  [k: string]: string;
} = {
  SEND: 'Confirm Send',
};

export default function ConfirmTx(): ReactElement {
  const pendingTXHashes = useTXQueue();
  const [currentIndex, setCurrentIndex] = useState(0);
  const pendingTx = useQueuedTXByHash(pendingTXHashes[currentIndex]);
  const action = getTXAction(pendingTx);
  const [isUpdating, setUpdating] = useState(false);
  const dispatch = useDispatch();

  const submitTx = useCallback(async (txJSON: Transaction) => {
    await postMessage({
      type: MessageTypes.SUBMIT_TX,
      payload: {txJSON},
    });
    await dispatch(fetchPendingTransactions());
  }, []);

  const removeTx = useCallback((txJSON: Transaction) => {
    return postMessage({
      type: MessageTypes.REMOVE_TX_FROM_QUEUE,
      payload: txJSON,
    })
  }, []);

  if (isUpdating) {
    return (
      <UpdateTx
        hash={pendingTx.hash}
        onCancel={() => setUpdating(false)}
      />
    );
  }

  return (
    <RegularView className="confirm-tx">
      <RegularViewHeader
        onClose={() => setUpdating(true)}
        actionText="Edit"
      >
        {actionToTitle[action]}
      </RegularViewHeader>
      <RegularViewContent>
        {renderConfirmContent(pendingTx)}
      </RegularViewContent>
      <RegularViewFooter>
        <Button
          btnType={ButtonType.secondary}
          onClick={() => removeTx(pendingTx)}
        >
          Reject
        </Button>
        <Button
          onClick={() => submitTx(pendingTx)}
        >
          Confirm
        </Button>
      </RegularViewFooter>
    </RegularView>
  )
}

function renderConfirmContent(pendingTx: Transaction): ReactNode {
  const value = getTXValue(pendingTx);
  const action = getTXAction(pendingTx);
  const nameHash = getTXNameHash(pendingTx);
  const recipientAddress = getTXRecipient(pendingTx);

  switch (action) {
    case 'SEND':
      return (
        <>
          <Input
            label="Recipient Address"
            value={recipientAddress}
            spellCheck={false}
            disabled
          />
          <Input
            label="Amount"
            value={fromDollaryDoos(Math.abs(value), 6)}
            disabled
          />
          <Input
            label="Estimated Fee"
            value={fromDollaryDoos(pendingTx.fee, 6)}
            disabled
          />
          <div className="confirm-tx__total-group">
            <div className="confirm-tx__total-group__label">
              Total:
            </div>
            <div className="confirm-tx__total-group__amount">
              {formatNumber(fromDollaryDoos(Math.abs(value) + pendingTx.fee, 6))} HNS
            </div>
          </div>
        </>
      );
    default:
      return null;
  }
}
