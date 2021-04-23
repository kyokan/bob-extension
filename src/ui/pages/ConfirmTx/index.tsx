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
import {ellipsify} from "@src/util/address";

const actionToTitle: {
  [k: string]: string;
} = {
  SEND: 'Confirm Send',
};

export default function ConfirmTx(): ReactElement {
  const pendingTXHashes = useTXQueue();
  const [currentIndex, setCurrentIndex] = useState(0);
  const pendingTx = useQueuedTXByHash(pendingTXHashes[currentIndex]);
  const value = getTXValue(pendingTx);
  const action = getTXAction(pendingTx);
  const [isUpdating, setUpdating] = useState(false);
  const [isViewingDetail, setViewDetail] = useState(false);
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
      type: MessageTypes.REJECT_TX,
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
        {
          isViewingDetail
            ? (
              <>
                <div className="confirm-tx__detail-group">
                  <div className="confirm-tx__inputs-group">
                    <div className="confirm-tx__inputs-group__title">Inputs</div>
                    {pendingTx.inputs.map(input => {
                      if (!input.coin) return null;
                      return (
                        <div className="confirm-tx__input-group">
                          <div className="confirm-tx__input-group__top">
                            {
                              input.coin.covenant.action !== "NONE" && (
                                <div className="confirm-tx__input-group__action">
                                  {input.coin.covenant.action}
                                </div>
                              )
                            }
                            <a
                              className="confirm-tx__input-group__address"
                              href={`https://e.hnsfans.com/address/${input.coin.address}`}
                              target="_blank"
                            >
                              {ellipsify(input.coin.address)}
                            </a>
                          </div>
                          <div className="confirm-tx__input-group__value">
                            {fromDollaryDoos(input.coin.value, 6)} HNS
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="confirm-tx__outputs-group">
                    <div className="confirm-tx__outputs-group__title">Outputs</div>
                    {pendingTx.outputs.map(output => {
                      return (
                        <div className="confirm-tx__output-group">
                          <div className="confirm-tx__output-group__top">
                            {
                              output.covenant.action !== 'NONE' && (
                                <div className="confirm-tx__output-group__action">
                                  {output.covenant.action}
                                </div>
                              )
                            }
                            <a
                              className="confirm-tx__output-group__address"
                              href={`https://e.hnsfans.com/address/${output.address}`}
                              target="_blank"
                            >
                              {ellipsify(output.address)}
                            </a>
                          </div>
                          <div className="confirm-tx__output-group__value">
                            {fromDollaryDoos(output.value, 6)} HNS
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="confirm-tx__expand-toggle" onClick={() => setViewDetail(false)}>
                  Collapse Detail
                </div>
              </>
            )
            : (
              <div className="confirm-tx__expand-toggle" onClick={() => setViewDetail(true)}>
                Expand Detail
              </div>
            )
        }
        <div className="confirm-tx__total-group">
          <div className="confirm-tx__total-group__label">
            Net Total:
          </div>
          <div className="confirm-tx__total-group__amount">
            {formatNumber(fromDollaryDoos(Math.abs(value) + pendingTx.fee, 6))} HNS
          </div>
        </div>
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
            label="Net Amount"
            value={fromDollaryDoos(Math.abs(value), 6)}
            disabled
          />
          <Input
            label="Estimated Fee"
            value={fromDollaryDoos(pendingTx.fee, 6)}
            disabled
          />
        </>
      );
    default:
      return null;
  }
}
