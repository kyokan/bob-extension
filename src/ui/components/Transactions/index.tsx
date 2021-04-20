import React, {ReactElement, useEffect} from "react";
import moment from "moment";
import {
  setFetching,
  setOffset,
  Transaction,
  useTXByHash,
  useTXFetching,
  useTXOffset,
  useTXOrder
} from "@src/ui/ducks/transactions";
import Icon from "@src/ui/components/Icon";
import "./transactions.scss";
import {formatNumber, fromDollaryDoos} from "@src/util/number";
import classNames from "classnames";
import Name from "@src/ui/components/Name";
import {getTXAction, getTXNameHash, getTXValue} from "@src/util/transaction";
import {Loader} from "@src/ui/components/Loader";
import {useDispatch} from "react-redux";

export default function Transactions(): ReactElement {
  const offset = useTXOffset();
  const order = useTXOrder(offset);
  const fetching = useTXFetching();
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(setOffset(20));
    }
  }, []);

  return (
    <div className="transactions">
      {order.map(txHash => <TransactionRow key={txHash} hash={txHash} />)}
      {!order.length && !fetching && <div className="transactions__empty">No transactions</div>}
      {fetching && <Loader size={3} />}
    </div>
  );
}

const ActionToText: {[actionType: string]: string} = {
  RENEW: 'Renewed Domain',
  TRANSFER: 'Transferred Domain',
  FINALIZE: 'Finalized Domain',
  OPEN: 'Opened Auction',
  BID: 'Placed Bid',
  REVEAL: 'Revealed Bid',
  REGISTER: 'Registered Domain',
  REDEEM: 'Redeemed Bid',
  SEND: 'Sent HNS',
  RECEIVE: 'Received HNS',
  UPDATE: 'Updated Record',
};

const ActionToFA: {[actionType: string]: string} = {
  RENEW: 'fa-undo',
  TRANSFER: 'fa-exchange-alt',
  FINALIZE: 'fa-receipt',
  OPEN: 'fa-door-open',
  BID: 'fa-gavel',
  REVEAL: 'fa-eye',
  REGISTER: 'fa-cash-register',
  REDEEM: 'fa-coins',
  SEND: 'fa-arrow-right',
  RECEIVE: 'fa-arrow-left',
  UPDATE: 'fa-feather-alt',
};

export const TransactionRow = (props: { hash: string }): ReactElement => {
  const {hash} = props;
  const tx = useTXByHash(hash);

  if (!tx) return <></>;

  const value = getTXValue(tx);
  const action = getTXAction(tx);
  const nameHash = getTXNameHash(tx);

  return (
    <div className="transaction">
      <div className="transaction__icon">
        <Icon
          fontAwesome={ActionToFA[action] || 'fa-handshake'}
          size={1}
        />
      </div>
      <div className="transaction__body">
        <div className="transaction__body__action">
          <div>{ActionToText[action] || action}</div>
          { nameHash && (
            <div className="transaction__body__action__name">
              <Name hash={nameHash} />
            </div>
          )}
        </div>
        <div className="transaction__body__date">
          {moment(tx.date).format('YYYY-MM-DD HH:mm:ss')}
        </div>
      </div>
      <div className="transaction__value">
        <div
          className={classNames("transaction__value__amount", {
            'transaction__value__amount--positive': value > 0,
            'transaction__value__amount--negative': value < 0,
          })}
        >
          {formatNumber(fromDollaryDoos(value))}
        </div>
        <div className="transaction__value__action">

        </div>
      </div>
    </div>
  );
};
