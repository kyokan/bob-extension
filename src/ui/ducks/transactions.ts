import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Covenant} from "@src/util/covenant";
import {useSelector} from "react-redux";
import {AppRootState} from "@src/ui/store/configureAppStore";
import deepEqual from "fast-deep-equal";
import {Dispatch} from "redux";

export enum ActionType {
  SET_PENDING_TRANSACTIONS = "transaction/setPendingTransactions",
  SET_TRANSACTIONS = "transaction/setTransactions",
  APPEND_TRANSACTIONS = "transaction/appendTransactions",
  SET_FETCHING = "transaction/setFetching",
  SET_OFFSET = "transaction/setOffset",
  SET_BLIND_BY_HASH = "transaction/setBlindByHash",
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
    [txHash: string]: Transaction|SignMessageRequest;
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

export const SIGN_MESSAGE_METHOD = 'SIGN_MESSAGE';
export const SIGN_MESSAGE_WITH_NAME_METHOD = 'SIGN_MESSAGE_WITH_NAME';

export type SignMessageRequest = {
  hash: string;
  method: 'SIGN_MESSAGE' | 'SIGN_MESSAGE_WITH_NAME';
  walletId: string;
  data: {
    name?: string;
    address?: string;
    message: string
  };
  bid: undefined;
  height: 0;
}

export type Transaction = {
  method: undefined;
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
};

export type TxInput = {
  address: string;
  value: number;
  path: {
    change: boolean;
  };
  coin?: TxOutput;
};

export type TxOutput = {
  address: string;
  value: number;
  covenant: Covenant;
  owned?: boolean;
  path: {
    change: boolean;
  };
};

export const fetchTransactions =
  () => async (dispatch: Dispatch, getState: () => AppRootState) => {
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
  const pendingTXs = await postMessage({
    type: MessageTypes.GET_PENDING_TRANSACTIONS,
  });
  dispatch({
    type: ActionType.SET_PENDING_TRANSACTIONS,
    payload: pendingTXs,
  });
};

export const setFetching = (fetching: boolean) => {
  return {
    type: ActionType.SET_FETCHING,
    payload: fetching,
  };
};

export const setOffset = (offset: number) => {
  return {
    type: ActionType.SET_OFFSET,
    payload: offset,
  };
};

export const setBlindByHash = (
  blind: {nonce: string; value: number},
  hash: string
) => {
  return {
    type: ActionType.SET_BLIND_BY_HASH,
    payload: {
      blind,
      hash,
    },
  };
};

export const resetTransactions = () => async (dispatch: Dispatch) => {
  dispatch(setOffset(20));
  dispatch(setTransactions([]));
};

export const setTransactions = (transactions: any[]) => {
  return {
    type: ActionType.SET_TRANSACTIONS,
    payload: transactions,
  };
};

export default function transactions(
  state = initialState,
  action: Action
): State {
  switch (action.type) {
    case ActionType.SET_FETCHING:
      return {
        ...state,
        fetching: action.payload,
      };
    case ActionType.SET_OFFSET:
      return {
        ...state,
        offset:
          action.payload > state.order.length
            ? Math.max(20, state.order.length)
            : action.payload,
      };
    case ActionType.SET_BLIND_BY_HASH:
      return {
        ...state,
        map: {
          ...state.map,
          [action.payload.hash]: {
            ...(state.map[action.payload.hash] || {}),
            blind: action.payload,
          },
        },
      };
    case ActionType.SET_PENDING_TRANSACTIONS:
      return handleTransactions(state, action, true);
    case ActionType.SET_TRANSACTIONS:
      return handleTransactions(state, action, false);
    case ActionType.APPEND_TRANSACTIONS:
      return handleAppendTransactions(state, action);
    default:
      return state;
  }
}

function handleTransactions(
  state: State,
  action: Action,
  pending = false
): State {
  const newOrder: string[] = state.order.slice();
  const newMap = { ...state.map };

  action.payload.forEach((tx: Transaction) => {
    const existing = newMap[tx.hash];

    if (!existing) {
      newOrder.push(tx.hash);
    } else if (existing.height < 0 && tx.height > 0) {
      // Existing was pending, new is confirmed. Update it.
      // No need to change order, it's already in newOrder.
    }
    newMap[tx.hash] = tx; // Always update the map with the latest transaction data
  });

  // Sort the entire order array.
  // Pending transactions (height < 0) should always be at the top.
  // Confirmed transactions should be sorted by height/date descending.
  newOrder.sort((hashA, hashB) => {
    const txA = newMap[hashA];
    const txB = newMap[hashB];

    if (!txA || !txB) return 0; // Should not happen

    // Pending always come before confirmed
    if (txA.height < 0 && txB.height > 0) return -1;
    if (txA.height > 0 && txB.height < 0) return 1;

    // If both are pending or both are confirmed, sort by date/time
    const dateA = (txA as any).mdate || txA.time;
    const dateB = (txB as any).mdate || txB.time;

    return dateB - dateA; // Newest first
  });

  return {
    ...state,
    order: newOrder,
    map: newMap,
  };
}

export const usePendingTXs = (): string[] => {
  return useSelector((state: AppRootState) => {
    return state.transactions.pending;
  }, deepEqual);
};

export const useTXOrder = (): string[] => {
  return useSelector((state: AppRootState) => {
    return state.transactions.order;
  }, deepEqual);
};

export const useTXOffset = (): number => {
  return useSelector((state: AppRootState) => {
    return state.transactions.offset;
  }, deepEqual);
};

export const useTXFetching = (): boolean => {
  return useSelector((state: AppRootState) => {
    return state.transactions.fetching;
  }, deepEqual);
};

export const useTXByHash = (hash: string): Transaction | SignMessageRequest | undefined => {
  return useSelector((state: AppRootState) => {
    return state.transactions.map[hash];
  }, deepEqual);
};
