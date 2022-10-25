import React, {ReactElement, useCallback, useEffect, useState} from "react";
import moment from "moment";
import {
  fetchPendingTransactions,
  useTXByHash,
  useTXFetching,
  useTXOffset,
  useTXOrder,
} from "@src/ui/ducks/transactions";
import Icon from "@src/ui/components/Icon";
import "./transactions.scss";
import {formatNumber, fromDollaryDoos} from "@src/util/number";
import classNames from "classnames";
import Name from "@src/ui/components/Name";
import {getTXAction, getTXNameHash, getTXValue} from "@src/util/transaction";
import {useDispatch} from "react-redux";
import {fetchTXQueue} from "@src/ui/ducks/queue";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Loader} from "@src/ui/components/Loader";
import Button, {ButtonType} from "@src/ui/components/Button";
import RepairBidModal from "@src/ui/components/RepairBidModal";

export default function Transactions(): ReactElement {
  const order = useTXOrder();
  const fetching = useTXFetching();
  const offset = useTXOffset();
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      dispatch(fetchTXQueue());
      dispatch(fetchPendingTransactions());
    })();
  }, []);

  return (
    <div className="transactions">
      {/*{pending.map(txHash => <TransactionRow key={txHash} hash={txHash} />)}*/}
      {order.slice(0, offset).map((txHash) => (
        <TransactionRow key={txHash} hash={txHash} />
      ))}
      {!order.length && !fetching && (
        <div className="transactions__empty">No transactions</div>
      )}
      {fetching && <Loader size={3} />}
    </div>
  );
}

const ActionToText: {[actionType: string]: string} = {
  RENEW: "Renewed Domain",
  TRANSFER: "Transferred Domain",
  FINALIZE: "Finalized Domain",
  OPEN: "Opened Auction",
  BID: "Placed Bid",
  REVEAL: "Revealed Bid",
  REGISTER: "Registered Domain",
  REDEEM: "Redeemed Bid",
  SEND: "Sent HNS",
  RECEIVE: "Received HNS",
  UPDATE: "Updated Record",
};

const ActionToFA: {[actionType: string]: string} = {
  RENEW: "fa-undo",
  TRANSFER: "fa-exchange-alt",
  FINALIZE: "fa-receipt",
  OPEN: "fa-door-open",
  BID: "fa-gavel",
  REVEAL: "fa-eye",
  REGISTER: "fa-cash-register",
  REDEEM: "fa-coins",
  SEND: "fa-arrow-right",
  RECEIVE: "fa-arrow-left",
  UPDATE: "fa-feather-alt",
};

export const TransactionRow = (props: {hash: string}): ReactElement => {
  const {hash} = props;
  const [showRepairModal, setRepairModal] = useState(false);
  const tx = useTXByHash(hash);
  const value = getTXValue(tx!);
  const action = getTXAction(tx!);
  const nameHash = getTXNameHash(tx!);
  const pending = !tx!.height || tx!.height < 0;

  const openExplorer = useCallback(() => {
    window.open(`https://blockexplorer.com/tx/${tx!.hash}`, "_blank");
  }, [tx!.hash]);

  const openExplorerName = useCallback(
    async (e) => {
      e.stopPropagation();
      const {result} = await postMessage({
        type: MessageTypes.GET_NAME_BY_HASH,
        payload: nameHash,
      });
      window.open(`https://blockexplorer.com/name/${result}`, "_blank");
    },
    [nameHash]
  );

  const displayValue = formatNumber(fromDollaryDoos(value));

  const openRepairModal = useCallback(
    (e) => {
      e.stopPropagation();
      setRepairModal(true);
    },
    [tx!.hash]
  );

  if (tx?.method) return <></>;

  return (
    <div
      className={classNames("transaction", {
        "transaction--pending": pending,
      })}
      onClick={openExplorer}
    >
      {showRepairModal && (
        <RepairBidModal
          txHash={tx!.hash}
          onClose={() => setRepairModal(false)}
        />
      )}
      <div className="transaction__icon">
        <Icon fontAwesome={ActionToFA[action] || "fa-handshake"} size={1} />
      </div>
      <div className="transaction__body">
        <div className="transaction__body__action">
          <div>{ActionToText[action] || action}</div>
          {nameHash && (
            <div className="transaction__body__action__name">
              <Name hash={nameHash} onClick={openExplorerName} />
            </div>
          )}
        </div>
        <div className="transaction__body__date">
          {pending
            ? moment((tx as any).mdate).format("YYYY-MM-DD HH:mm:ss")
            : moment(tx!.date).format("YYYY-MM-DD HH:mm:ss")}
        </div>
      </div>
      <div className="transaction__value">
        <div
          className={classNames("transaction__value__amount", {
            "transaction__value__amount--positive": value > 0,
            "transaction__value__amount--negative": value < 0,
          })}
        >
          {displayValue}
        </div>
        <div className="transaction__value__action">
          {action === "BID" && !tx?.blind && (
            <Button
              btnType={ButtonType.secondary}
              onClick={openRepairModal}
              tiny
            >
              Repair Bid
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
