import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Dispatch} from "redux";
import {useSelector} from "react-redux";
import deepEqual from "fast-deep-equal";
import {AppRootState} from "@src/ui/store/configureAppStore";

enum ActionType {
  SET_WALLET_IDS = 'wallet/setWalletIDs',
}

type Action = {
  type: ActionType;
  payload?: any;
  error?: boolean;
  meta?: any;
};

type State = {
  walletIDs: string[];
  currentWallet: string;
  balance: {
    unconfirmed: number;
    lockedUnconfirmed: number;
  },
};

const initialState: State = {
  walletIDs: [],
  currentWallet: '',
  balance: {
    unconfirmed: 0,
    lockedUnconfirmed: 0,
  },
};

export const fetchWallets = () => async (dispatch: Dispatch) => {
  const walletIDs = await postMessage({ type: MessageTypes.GET_WALLET_IDS });
  dispatch({
    type: ActionType.SET_WALLET_IDS,
    payload: walletIDs.filter((id: string) => id !== 'primary'),
  });
};

export default function wallet(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_WALLET_IDS:
      return {
        ...state,
        walletIDs: action.payload,
      };
    default:
      return state;
  }
}

export const useWalletIDs = () => {
  return useSelector((state: AppRootState) => {
    return state.wallet.walletIDs.filter(id => id !== 'primary');
  }, deepEqual);
};

export const useCurrentWallet = () => {
  return useSelector((state: AppRootState) => {
    return state.wallet.currentWallet;
  }, deepEqual);
};

export const useInitialized = () => {
  return useSelector((state: AppRootState) => {
    const { wallet: { walletIDs }} = state;
    return walletIDs.length !== 1 || walletIDs[0] !== 'primary';
  }, deepEqual);
};
