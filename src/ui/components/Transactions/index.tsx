import React, {ReactElement} from "react";
import moment from "moment";
import {Transaction, useTXByHash, useTXOrder} from "@src/ui/ducks/transactions";
import Icon from "@src/ui/components/Icon";
import "./transactions.scss";
import {formatNumber, fromDollaryDoos} from "@src/util/number";
import classNames from "classnames";
import Name from "@src/ui/components/Name";

export default function Transactions(): ReactElement {
  const order = useTXOrder();

  return (
    <div className="transactions">
      {order.map(txHash => <TransactionRow key={txHash} hash={txHash} />)}
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

function getTXValue(tx: Transaction): number {
  // Look for covenants. A TX with multiple covenant types is not supported
  let covAction = null;
  let covValue = 0;
  let totalValue = 0;
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];

    // Find outputs to the wallet's receive branch
    if (output.path && output.path.change)
      continue;

    const covenant = output.covenant;

    // Track normal receive amounts for later
    if (covenant.action === 'NONE') {
      if (output.path) {
        totalValue += output.value;
      }
      continue;
    }
    // Stay focused on the first non-NONE covenant type, ignore other types
    if (covAction && covenant.action !== covAction)
      continue;

    covAction = covenant.action;

    // Special case for reveals and registers, indicate how much
    // spendable balance is returning to the wallet
    // as change from the mask on the bid, or the difference
    // between the highest and second-highest bid.
    if (covenant.action === 'REVEAL'
      || covenant.action === 'REGISTER') {
      covValue += !output.path
        ? output.value
        : tx.inputs[i].value - output.value;
    } else {
      covValue += output.value;
    }

    // Renewals and Updates have a value, but it doesn't
    // affect the spendable balance of the wallet.
    if (covenant.action === 'RENEW' ||
      covenant.action === 'UPDATE' ||
      covenant.action === 'TRANSFER' ||
      covenant.action === 'FINALIZE') {
      covValue = 0;
    }
  }

  // This TX was a covenant, return.
  if (covAction) {
    return covValue;
  }

  // If there were outputs to the wallet's receive branch
  // but no covenants, this was just a plain receive.
  // Note: assuming input[0] is the "from" is not really helpful data.
  if (totalValue > 0) {
    return totalValue;
  }

  // This TX must have been a plain send from the wallet.
  // Assume that the first non-wallet output of the TX is the "to".
  const output = tx.outputs.filter(({path}) => !path)[0];
  if (!output) {
    return 0;
  }

  return -output.value;
}


function getTXAction(tx: Transaction): string {
  // Look for covenants. A TX with multiple covenant types is not supported
  let covAction = null;
  let covValue = 0;
  let totalValue = 0;
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];

    // Find outputs to the wallet's receive branch
    if (output.path && output.path.change)
      continue;

    const covenant = output.covenant;

    // Track normal receive amounts for later
    if (covenant.action === 'NONE') {
      if (output.path) {
        totalValue += output.value;
      }
      continue;
    }
    // Stay focused on the first non-NONE covenant type, ignore other types
    if (covAction && covenant.action !== covAction)
      continue;

    covAction = covenant.action;

    // Special case for reveals and registers, indicate how much
    // spendable balance is returning to the wallet
    // as change from the mask on the bid, or the difference
    // between the highest and second-highest bid.
    if (covenant.action === 'REVEAL'
      || covenant.action === 'REGISTER') {
      covValue += !output.path
        ? output.value
        : tx.inputs[i].value - output.value;
    } else {
      covValue += output.value;
    }

    // Renewals and Updates have a value, but it doesn't
    // affect the spendable balance of the wallet.
    if (covenant.action === 'RENEW' ||
      covenant.action === 'UPDATE' ||
      covenant.action === 'TRANSFER' ||
      covenant.action === 'FINALIZE') {
      covValue = 0;
    }
  }

  // This TX was a covenant, return.
  if (covAction) {
    return covAction;
  }

  // If there were outputs to the wallet's receive branch
  // but no covenants, this was just a plain receive.
  // Note: assuming input[0] is the "from" is not really helpful data.
  if (totalValue > 0) {
    return 'RECEIVE';
  }

  // This TX must have been a plain send from the wallet.
  // Assume that the first non-wallet output of the TX is the "to".
  const output = tx.outputs.filter(({path}) => !path)[0];

  if (!output) {
    return 'SEND';
  }

  return 'SEND';
}


function getTXNameHash(tx: Transaction): string {
  // Look for covenants. A TX with multiple covenant types is not supported
  let covAction = null;
  for (let i = 0; i < tx.outputs.length; i++) {
    const output = tx.outputs[i];

    // Find outputs to the wallet's receive branch
    if (output.path && output.path.change)
      continue;

    const covenant = output.covenant;

    // Track normal receive amounts for later
    if (covenant.action === 'NONE') {
      return '';
    }
    // Stay focused on the first non-NONE covenant type, ignore other types
    if (covAction && covenant.action !== covAction)
      continue;

    return covenant.items[0]
  }

  return '';
}
