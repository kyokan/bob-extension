import {Transaction} from "@src/ui/ducks/transactions";
import {useSelector} from "react-redux";
import {AppRootState} from "@src/ui/store/configureAppStore";
import deepEqual from "fast-deep-equal";
import {Dispatch} from "redux";
import MessageTypes from "@src/util/messageTypes";
import postMessage from "@src/util/postMessage";

export enum ActionType {
  SET_TX_QUEUE = 'queue/setTXQueue',
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

export const setTXQueue = (transactions: Transaction[]) => ({
  type: ActionType.SET_TX_QUEUE,
  payload: transactions,
});

export const fetchTXQueue = () => async (dispatch: Dispatch) => {
  const txQueue = await postMessage({ type: MessageTypes.GET_TX_QUEUE });
  dispatch(setTXQueue(txQueue));
};

export default function queue(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_TX_QUEUE:
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

export const useTXQueue = () => {
  return useSelector((state: AppRootState) => {
    return state.queue.order;
  }, deepEqual);
};

export const useQueuedTXByHash = (hash: string) => {
  return useSelector((state: AppRootState) => {
    return state.queue.map[hash];
  }, deepEqual);
};
