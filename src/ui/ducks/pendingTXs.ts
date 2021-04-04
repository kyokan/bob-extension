import {Transaction} from "@src/ui/ducks/transactions";
import {useSelector} from "react-redux";
import {AppRootState} from "@src/ui/store/configureAppStore";
import deepEqual from "fast-deep-equal";

export enum ActionType {
  SET_PENDING_TXS = 'pendingTXs/setPendingTXs',
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

export default function pendingTXs(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_PENDING_TXS:
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

export const usePendingTXs = () => {
  return useSelector((state: AppRootState) => {
    return state.pendingTXs.order;
  }, deepEqual);
};

export const usePendingTXByHash = (hash: string) => {
  return useSelector((state: AppRootState) => {
    return state.pendingTXs.map[hash];
  }, deepEqual);
};
