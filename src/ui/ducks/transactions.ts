import {Dispatch} from "redux";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Covenant} from "@src/util/covenant";
import {useSelector} from "react-redux";
import {AppRootState} from "@src/ui/store/configureAppStore";
import deepEqual from "fast-deep-equal";

enum ActionType {
  SET_TRANSACTIONS = 'transaction/setTransactions',
}

type Action = {
  type: ActionType;
  payload?: any;
  error?: boolean;
  meta?: any;
};

type State = {
  order: string[];
  map: {
    [txHash: string]: Transaction;
  };
};

const initialState: State = {
  order: [],
  map: {},
};

export type Transaction = {
  block: string;
  confirmations: number;
  date: Date;
  fee: number;
  hash: string;
  height: number;
  inputs: TxInput[];
  outputs: TxOutput[];
  rate: number;
  time: number;
  tx: string;
}

export type TxInput = {
  address: string;
  value: number;
  path: {
    change: boolean;
  }
}

export type TxOutput = {
  address: string;
  value: number;
  covenant: Covenant;
  path: {
    change: boolean;
  }
}

export const fetchTransactions = () => async (dispatch: Dispatch) => {
  const transactions = await postMessage({ type: MessageTypes.GET_TRANSACTIONS });
  dispatch({
    type: ActionType.SET_TRANSACTIONS,
    payload: transactions.map((tx: any) => ({
      block: tx.block,
      confirmations: tx.confirmations,
      date: new Date(tx.date),
      fee: tx.fee,
      hash: tx.hash,
      height: tx.height,
      inputs: tx.inputs,
      mdate: new Date(tx.mdate),
      mtime: new Date(tx.mtime * 1000),
      outputs: tx.outputs,
      rate: tx.rate,
      size: tx.size,
      time: new Date(tx.time * 1000),
      tx: tx.tx,
      virutalSize: tx.virutalSize,
    })),
  });
};

export default function transactions(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_TRANSACTIONS:
      return {
        ...state,
        order: action.payload.map((tx: Transaction) => tx.hash),
        map: action.payload.reduce((map: {[h: string]: Transaction}, tx: Transaction) => {
          map[tx.hash] = tx;
          return map;
        }, {}),
      };
    default:
      return state;
  }
}

export const useTXOrder = (): string[] => {
  return useSelector((state: AppRootState) => {
    return state.transactions.order;
  }, deepEqual)
};

export const useTXByHash = (hash: string): Transaction | undefined => {
  return useSelector((state: AppRootState) => {
    return state.transactions.map[hash];
  }, deepEqual)
};
