import React, {ReactElement, useCallback, useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import {useQueuedTXByHash, useTXQueue} from "@src/ui/ducks/queue";
import Button, {ButtonType} from "@src/ui/components/Button";
import {getTXAction, getTXNameHash, getTXRecipient, getTXRecords, getTXValue} from "@src/util/transaction";
import {fetchPendingTransactions, SignMessageRequest, Transaction} from "@src/ui/ducks/transactions";
import Input from "@src/ui/components/Input";
import {formatNumber, fromDollaryDoos} from "@src/util/number";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {ellipsify} from "@src/util/address";
import {toUnicode} from "@src/util/name";
import Textarea from "@src/ui/components/Textarea";
import {toBIND} from "@src/util/records";
import ErrorMessage from "@src/ui/components/ErrorMessage";
import {getExplorerUrl} from "@src/util/explorer";
import {useExplorer} from "@src/ui/ducks/app";
import {
  RegularView,
  RegularViewContent,
  RegularViewFooter,
  RegularViewHeader,
} from "@src/ui/components/RegularView";
import UpdateTx from "@src/ui/pages/UpdateTx";
import "./confirm-tx.scss";

const {Resource} = require("hsd/lib/dns/resource");

const actionToTitle: {
  [k: string]: string;
} = {
  SEND: "Confirm Send",
  OPEN: "Confirm Open",
  BID: "Confirm Bid",
  REVEAL: "Confirm Reveal",
  REDEEM: "Confirm Redeem",
  REGISTER: "Confirm Register",
  UPDATE: "Confirm Update",
};

export default function ConfirmTx(): ReactElement {
  const pendingTXHashes = useTXQueue();
  const [currentIndex, setCurrentIndex] = useState(0);
  const pendingTx = useQueuedTXByHash(pendingTXHashes[currentIndex]);
  const action = getTXAction(pendingTx);
  const [isUpdating, setUpdating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Screen View",
        data: {
          view: "Confirm Transaction",
        },
      },
    });
  }, []);

  const submitTx = useCallback(async (txJSON: Transaction|SignMessageRequest) => {
    setConfirming(true);

    try {
      await postMessage({
        type: MessageTypes.SUBMIT_TX,
        payload: {txJSON},
      });
      await dispatch(fetchPendingTransactions());
    } catch (e: any) {
      setErrorMessage(e.message);
    }

    setConfirming(false);
  }, []);

  const removeTx = useCallback((txJSON: Transaction|SignMessageRequest) => {
    return postMessage({
      type: MessageTypes.REJECT_TX,
      payload: txJSON,
    });
  }, []);

  if (isUpdating) {
    return (
      <UpdateTx hash={pendingTx.hash} onCancel={() => setUpdating(false)} />
    );
  }

  if (pendingTx.method) {
    return (
      <RegularView className="confirm-tx">
        <RegularViewHeader>Signature Request</RegularViewHeader>
        <RegularViewContent>
          {
            pendingTx.data.address && (
              <Input
                label="Address"
                value={pendingTx.data.address}
                spellCheck={false}
                disabled
              />
            )
          }
          {
            pendingTx.data.name && (
              <Input
                label="Name"
                value={pendingTx.data.name}
                spellCheck={false}
                disabled
              />
            )
          }
          <Textarea
            label="Message"
            value={pendingTx.data.message}
            spellCheck={false}
            disabled
          />
        </RegularViewContent>
        { errorMessage && <small className="error-message">{errorMessage}</small> }
        <RegularViewFooter>
          <Button
            btnType={ButtonType.secondary}
            onClick={() => removeTx(pendingTx)}
          >
            Reject
          </Button>
          <Button
            onClick={() => submitTx(pendingTx)}
            disabled={confirming}
            loading={confirming}
          >
            Confirm
          </Button>
        </RegularViewFooter>
      </RegularView>
    );
  }

  return (
    <RegularView className="confirm-tx">
      <RegularViewHeader onClose={() => setUpdating(true)} actionText="Edit">
        {actionToTitle[action] || "Send Raw Transaction"}
      </RegularViewHeader>
      <RegularViewContent>
        <ConfirmContent hash={pendingTXHashes[currentIndex]} />
        <TxDetail hash={pendingTXHashes[currentIndex]} />
        <NetTotal hash={pendingTXHashes[currentIndex]} />
      </RegularViewContent>

      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      <RegularViewFooter>
        <Button
          btnType={ButtonType.secondary}
          onClick={() => removeTx(pendingTx)}
        >
          Reject
        </Button>
        <Button
          onClick={() => submitTx(pendingTx)}
          disabled={confirming}
          loading={confirming}
        >
          Confirm
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}

function NetTotal(props: {hash: string}): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const value = getTXValue(pendingTx);
  const action = getTXAction(pendingTx);

  if (pendingTx.method) return <></>;

  switch (action) {
    case "REVEAL":
    case "REDEEM":
    case "REGISTER":
      return (
        <div className="confirm-tx__total-group">
          <div className="confirm-tx__total-group__label">Net Total:</div>
          <div className="confirm-tx__total-group__amount">
            {formatNumber(fromDollaryDoos(Math.abs(value) - pendingTx.fee, 6))}{" "}
            HNS
          </div>
        </div>
      );
    case "BID":
    case "OPEN":
    case "UPDATE":
    case "SEND":
    default:
      return (
        <div className="confirm-tx__total-group">
          <div className="confirm-tx__total-group__label">Net Total:</div>
          <div className="confirm-tx__total-group__amount">
            {formatNumber(fromDollaryDoos(-Math.abs(value) - pendingTx.fee, 6))}{" "}
            HNS
          </div>
        </div>
      );
  }
}

function TxDetail(props: {hash: string}): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const action = getTXAction(pendingTx);
  const [isViewingDetail, setViewDetail] = useState(false);
  const explorer = useExplorer();

  if (pendingTx.method) return <></>;

  return !actionToTitle[action] || isViewingDetail
    ? (
      <>
        <div className="confirm-tx__detail-group">
          <div className="confirm-tx__inputs-group">
            <div className="confirm-tx__inputs-group__title">Inputs</div>
            {pendingTx.inputs.map(input => {
              if (!input.coin) return null;
              return (
                <>
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
                      href={getExplorerUrl(explorer, "address", input.coin.address)}
                      target="_blank"
                    >
                      {ellipsify(input.coin.address)}
                    </a>
                  </div>
                  <div className="confirm-tx__input-group__value">
                    {fromDollaryDoos(input.coin.value, 6)} HNS
                  </div>
                </div>
                <div className="confirm-tx__input-group__value">
                  {fromDollaryDoos(input.coin.value, 6)} HNS
                </div>
              </>
            );
          })}
        </div>
        <div className="confirm-tx__outputs-group">
          <div className="confirm-tx__outputs-group__title">Outputs</div>
          {pendingTx.outputs.map((output) => {
            return (
              <div className="confirm-tx__output-group">
                <div className="confirm-tx__output-group__top">
                  {output.covenant.action !== "NONE" && (
                    <div className="confirm-tx__output-group__action">
                      {output.covenant.action}
                    </div>
                  )}
                  <a
                    className="confirm-tx__output-group__address"
                    href={getExplorerUrl(explorer, "address", output.address)}
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
      {actionToTitle[action] && (
        <div
          className="confirm-tx__expand-toggle"
          onClick={() => setViewDetail(false)}
        >
          Collapse Detail
        </div>
      )}
    </>
  ) : (
    <div
      className="confirm-tx__expand-toggle"
      onClick={() => setViewDetail(true)}
    >
      Expand Detail
    </div>
  );
}

function ConfirmContent(props: {hash: string}): ReactElement {
  const pendingTx = useQueuedTXByHash(props.hash);
  const value = getTXValue(pendingTx);
  const action = getTXAction(pendingTx);
  const nameHash = getTXNameHash(pendingTx);
  const recipientAddress = getTXRecipient(pendingTx);
  const raw = getTXRecords(pendingTx);
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      const {result} = await postMessage({
        type: MessageTypes.GET_NAME_BY_HASH,
        payload: nameHash,
      });

      setName(toUnicode(result));
    })();
  }, [nameHash]);

  if (pendingTx.method) return <></>;

  switch (action) {
    case "SEND":
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
    case "BID":
      return (
        <>
          <Input label="TLD" value={name} spellCheck={false} disabled />
          <Input
            label="Bid Amount"
            value={pendingTx.bid || fromDollaryDoos(Math.abs(value), 6)}
            disabled
          />
          <Input
            label="Blind Amount"
            value={
              pendingTx.bid
                ? +fromDollaryDoos(Math.abs(value), 6) - pendingTx.bid
                : 0
            }
            disabled
          />
          <Input
            label="Estimated Fee"
            value={fromDollaryDoos(pendingTx.fee, 6)}
            disabled
          />
        </>
      );
    case "REVEAL":
    case "REDEEM":
    case "OPEN":
      return (
        <>
          <Input label="TLD" value={name} spellCheck={false} disabled />
          <Input
            label="Estimated Fee"
            value={fromDollaryDoos(pendingTx.fee, 6)}
            disabled
          />
        </>
      );
    case "REGISTER":
    case "UPDATE":
      const {records} = Resource.fromRaw(Buffer.from(raw, "hex")).toJSON();
      const bindFormattedRecords = toBIND(records);
      return (
        <>
          <Input label="TLD" value={name} spellCheck={false} disabled />
          <Input
            label="Estimated Fee"
            value={fromDollaryDoos(pendingTx.fee, 6)}
            disabled
          />
          {!!bindFormattedRecords.length && (
            <Textarea
              label="Records"
              value={bindFormattedRecords.join("\n")}
              rows={bindFormattedRecords.length}
              disabled
            />
          )}
        </>
      );
    default:
      return <></>;
  }
}
