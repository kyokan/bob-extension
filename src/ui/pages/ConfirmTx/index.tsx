import React, {ReactElement, ReactNode, useCallback, useState} from "react";
import {RegularView, RegularViewContent, RegularViewFooter, RegularViewHeader} from "@src/ui/components/RegularView";
import {useHistory} from "react-router";
import {usePendingTXByHash, usePendingTXs} from "@src/ui/ducks/pendingTXs";
import Button, {ButtonType} from "@src/ui/components/Button";
import {getTXAction, getTXNameHash, getTXRecipient, getTXValue} from "@src/util/transaction";
import {Transaction} from "@src/ui/ducks/transactions";
import Input from "@src/ui/components/Input";
import {formatNumber, fromDollaryDoos} from "@src/util/number";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";

export default function ConfirmTx(): ReactElement {
  const history = useHistory();
  const pendingTXHashes = usePendingTXs();
  const [currentIndex, setCurrentIndex] = useState(0);
  const pendingTx = usePendingTXByHash(pendingTXHashes[currentIndex]);
  const action = getTXAction(pendingTx);

  const submitTx = useCallback((txJSON: Transaction) => {
    return postMessage({
      type: MessageTypes.SUBMIT_TX,
      payload: {txJSON},
    })
  }, []);

  return (
    <RegularView className="confirm-tx">
      <RegularViewHeader
        onClose={() => null}
        actionText="Edit"
      >
        {`Confirm ${action}`}
      </RegularViewHeader>
      <RegularViewContent>
        {renderConfirmContent(pendingTx)}
      </RegularViewContent>
      <RegularViewFooter>
        <Button
          btnType={ButtonType.secondary}
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
          />
          <Input
            label="Estimated Fee"
            value={fromDollaryDoos(pendingTx.fee, 6)}
          />
          <div>
            <div>Total:</div>
            <div>{formatNumber(fromDollaryDoos(Math.abs(value) + pendingTx.fee, 6))}</div>
          </div>
        </>
      );
    default:
      return null;
  }
}
