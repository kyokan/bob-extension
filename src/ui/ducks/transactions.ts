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
  SET_BLIND_BY_HASH = 'transaction/setBlindByHash',
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
  bid?: number;
  blind?: number;
}

export type TxInput = {
  address: string;
  value: number;
  path: {
    change: boolean;
  };
  coin?: TxOutput;
}

export type TxOutput = {
  address: string;
  value: number;
  covenant: Covenant;
  owned?: boolean;
  path: {
    change: boolean;
  };
}

export const fetchTransactions = () => async (dispatch: Dispatch, getState: () => AppRootState) => {
  const state = getState();
  const {fetching} = state.transactions;

  if (fetching) return;

  dispatch(setFetching(true));

  const resp = await postMessage({
    type: MessageTypes.GET_TRANSACTIONS,
  });

  dispatch({
    type: ActionType.SET_TRANSACTIONS,
    payload: resp,
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

export const setBlindByHash = (blind: {nonce: string; value: number}, hash: string) => {
  return {
    type: ActionType.SET_BLIND_BY_HASH,
    payload: {
      blind,
      hash,
    }
  }
};

export const resetTransactions = () => async (dispatch: Dispatch) => {
  dispatch(setOffset(20));
  dispatch(setTransactions([]));
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
    case ActionType.SET_BLIND_BY_HASH:
      return {
        ...state,
        map: {
          ...state.map,
          [action.payload.hash]: {
            ...state.map[action.payload.hash] || {},
            blind: action.payload,
          },
        },
      };
    case ActionType.SET_PENDING_TRANSACTIONS:
      return handleTransactions(state, action, true);
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

function handleTransactions(state: State, action: Action, pending = false): State {
  const newOrder: string[] = state.order.slice();
  const firstTx = state.map[newOrder[0]];

  action.payload
    .forEach((tx: Transaction) => {
      const existing = state.map[tx.hash];

      if (!existing && tx.height > 0) {
        if (firstTx?.height < tx.height) {
          newOrder.unshift(tx.hash);
        } else {
          newOrder.push(tx.hash);
        }
      } else if (!existing && (!tx.height || tx.height < 0)) {
        newOrder.unshift(tx.hash);
      }
    });

  return {
    ...state,
    order: newOrder,
    map: pending
      ?  {
        ...action.payload.reduce((map: {[h: string]: Transaction}, tx: Transaction) => {
          const existing = state.map[tx.hash];

          if (!existing || !existing.height || existing.height < 0) {
            map[tx.hash] = tx;
          }

          return map;
        }, {}),
        ...state.map,
      }
      : {
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
  return handleTransactions(state, action);
}

export const usePendingTXs = (): string[] => {
  return useSelector((state: AppRootState) => {
    return state.transactions.pending;
  }, deepEqual)
};

export const useTXOrder = (): string[] => {
  return useSelector((state: AppRootState) => {
    return state.transactions.order;
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
