import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Dispatch} from "redux";
import {useSelector} from "react-redux";
import deepEqual from "fast-deep-equal";
import {AppRootState} from "@src/ui/store/configureAppStore";
import {ThunkDispatch} from "redux-thunk";

enum ActionType {
  SET_WALLET_IDS = 'wallet/setWalletIDs',
  SET_WALLET_STATE = 'wallet/setWalletState',
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
  locked: boolean;
  balance: {
    unconfirmed: number;
    lockedUnconfirmed: number;
  },
};

const initialState: State = {
  walletIDs: [],
  currentWallet: '',
  locked: true,
  balance: {
    unconfirmed: 0,
    lockedUnconfirmed: 0,
  },
};

export const createWallet = (opt: {
  walletName: string;
  seedphrase: string;
  password: string;
}) => async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
  const {walletName, seedphrase, password} = opt;
  if (!walletName) throw new Error('Wallet name cannot be empty.');
  if (!seedphrase) throw new Error('Invalid seedphrase.');
  if (!password) throw new Error('Password cannot be empty.');

  await postMessage({
    type: MessageTypes.CREATE_NEW_WALLET,
    payload: {
      id: walletName,
      mnemonic: seedphrase,
      passphrase: password,
    },
  });

  await dispatch(fetchWallets());
  await dispatch(selectWallet(walletName));
  return;
};

export const lockWallet = () => async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
  await postMessage({ type: MessageTypes.LOCK_WALLET });
  return dispatch(fetchWalletState());
};

export const unlockWallet = (password: string) => async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
  await postMessage({
    type: MessageTypes.UNLOCK_WALLET,
    payload: password,
  });
  return dispatch(fetchWalletState());
};

export const fetchWalletState = () => async (dispatch: Dispatch) => {
  const resp = await postMessage({ type: MessageTypes.GET_WALLET_STATE });
  const {selectedID, locked} = resp;
  dispatch({
    type: ActionType.SET_WALLET_STATE,
    payload: {
      selectedID,
      locked,
    },
  });
};

export const fetchWallets = () => async (dispatch: Dispatch) => {
  const walletIDs = await postMessage({ type: MessageTypes.GET_WALLET_IDS });
  dispatch({
    type: ActionType.SET_WALLET_IDS,
    payload: walletIDs.filter((id: string) => id !== 'primary'),
  });
};

export const selectWallet = (id: string) => async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
  await postMessage({
    type: MessageTypes.SELECT_WALLET,
    payload: id,
  });
  return dispatch(fetchWalletState());
};

export default function wallet(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_WALLET_IDS:
      return {
        ...state,
        walletIDs: action.payload,
      };
    case ActionType.SET_WALLET_STATE:
      return {
        ...state,
        currentWallet: action.payload.selectedID,
        locked: action.payload.locked,
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

export const useWalletState = () => {
  return useSelector((state: AppRootState) => {
    return {
      currentWallet: state.wallet.currentWallet,
      locked: state.wallet.locked,
    };
  }, deepEqual);
};

export const useInitialized = () => {
  return useSelector((state: AppRootState) => {
    const { wallet: { walletIDs }} = state;
    return !!walletIDs.length;
  }, deepEqual);
};
