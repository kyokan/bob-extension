import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Covenant} from "@src/util/covenant";
import {useSelector} from "react-redux";
import {AppRootState} from "@src/ui/store/configureAppStore";
import deepEqual from "fast-deep-equal";
import {Dispatch} from "redux";

export enum ActionType {
  SET_PENDING_TRANSACTIONS = 'transaction/setPendingTransactions',
  SET_TRANSACTIONS = 'transaction/setTransactions',
  APPEND_TRANSACTIONS = 'transaction/appendTransactions',
  SET_FETCHING = 'transaction/setFetching',
  SET_OFFSET = 'transaction/setOffset',
}

type Action = {
  type: ActionType;
  payload?: any;
  error?: boolean;
  meta?: any;
};

type State = {
  pending: string[];
  order: string[];
  map: {
    [txHash: string]: Transaction;
  };
  offset: number;
  fetching: boolean;
};

const initialState: State = {
  pending: [],
  order: [],
  map: {},
  offset: 20,
  fetching: false,
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

let getTxNonce = 0;

export const fetchTransactions = () => async (dispatch: Dispatch) => {
  dispatch(setFetching(true));
  getTxNonce = await postMessage({ type: MessageTypes.GET_TX_NONCE });
  await postMessage({
    type: MessageTypes.GET_TRANSACTIONS,
    payload: {
      nonce: getTxNonce,
    },
  });
  dispatch(setFetching(false));
};

export const fetchPendingTransactions = () => async (dispatch: Dispatch) => {
  const pendingTXs = await postMessage({ type: MessageTypes.GET_PENDING_TRANSACTIONS });
  dispatch({
    type: ActionType.SET_PENDING_TRANSACTIONS,
    payload: pendingTXs,
  });
};

export const setFetching = (fetching: boolean) => {
  return {
    type: ActionType.SET_FETCHING,
    payload: fetching,
  }
};

export const setOffset = (offset: number) => {
  return {
    type: ActionType.SET_OFFSET,
    payload: offset,
  }
};

export const resetTransactions = () => async (dispatch: Dispatch) => {
  await postMessage({ type: MessageTypes.RESET_TRANSACTIONS, payload: getTxNonce });
  getTxNonce = await postMessage({ type: MessageTypes.GET_TX_NONCE });
  dispatch(setOffset(20));
};

export const setTransactions = (transactions: any[]) => {
  return {
    type: ActionType.SET_TRANSACTIONS,
    payload: transactions,
  }
};

export default function transactions(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_FETCHING:
      return {
        ...state,
        fetching: action.payload,
      };
    case ActionType.SET_OFFSET:
      return {
        ...state,
        offset: action.payload > state.order.length
          ? Math.max(20, state.order.length)
          : action.payload,
      };
    case ActionType.SET_PENDING_TRANSACTIONS:
      return handleTransactions(state, action);
    case ActionType.SET_TRANSACTIONS:
      return {
        ...state,
        order: action.payload.map((tx: Transaction) => tx.hash),
        map: action.payload.reduce((map: {[h: string]: Transaction}, tx: Transaction) => {
          map[tx.hash] = tx;
          return map;
        }, {}),
      };
    case ActionType.APPEND_TRANSACTIONS:
      return handleAppendTransactions(state, action);
    default:
      return state;
  }
}

function handleTransactions(state: State, action: Action): State {
  const newOrder: string[] = state.order.slice();

  action.payload
    .forEach((tx: Transaction) => {
      const existing = state.map[tx.hash];

      if (!existing && tx.height > 0) {
        newOrder.push(tx.hash);
      } else if (!existing && (!tx.height || tx.height < 0)) {
        newOrder.unshift(tx.hash);
      }
    });

  return {
    ...state,
    order: newOrder,
    map: {
      ...state.map,
      ...action.payload.reduce((map: {[h: string]: Transaction}, tx: Transaction) => {
        const existing = state.map[tx.hash];

        if (!existing || !existing.height || existing.height < 0) {
          map[tx.hash] = tx;
        }

        return map;
      }, {}),
    },
  };
}

function handleAppendTransactions(state: State, action: Action): State {
  if (getTxNonce !== action.meta.nonce) {
    return state;
  }

  return handleTransactions(state, action);
}

export const usePendingTXs = (): string[] => {
  return useSelector((state: AppRootState) => {
    return state.transactions.pending;
  }, deepEqual)
};

export const useTXOrder = (offset: number): string[] => {
  return useSelector((state: AppRootState) => {
    return state.transactions.order.slice(0, offset);
  }, deepEqual)
};

export const useTXOffset = (): number => {
  return useSelector((state: AppRootState) => {
    return state.transactions.offset;
  }, deepEqual)
};

export const useTXFetching = (): boolean => {
  return useSelector((state: AppRootState) => {
    return state.transactions.fetching;
  }, deepEqual)
};

export const useTXByHash = (hash: string): Transaction | undefined => {
  return useSelector((state: AppRootState) => {
    return state.transactions.map[hash];
  }, deepEqual)
};
