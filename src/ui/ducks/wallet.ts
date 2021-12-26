import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Dispatch} from "redux";
import {useSelector} from "react-redux";
import deepEqual from "fast-deep-equal";
import {AppRootState} from "@src/ui/store/configureAppStore";
import {ThunkDispatch} from "redux-thunk";

export enum ActionType {
  SET_WALLET_IDS = "wallet/setWalletIDs",
  SET_WALLETS = "wallet/setWallets",
  SET_WALLET_STATE = "wallet/setWalletState",
  SET_WALLET_BALANCE = "wallet/setWalletBalance",
}

type Action = {
  type: ActionType;
  payload?: any;
  error?: boolean;
  meta?: any;
};

type State = {
  wallets: {
    wid: string;
    encrypted: string;
    watchOnly: boolean;
  }[];
  walletIDs: string[];
  currentWallet: string;
  locked: boolean;
  rescanning: boolean;
  watchOnly: boolean;
  tip: {
    hash: string;
    height: number;
    time: number;
  };
  balance: {
    unconfirmed: number;
    lockedUnconfirmed: number;
  };
};

const initialState: State = {
  wallets: [],
  walletIDs: [],
  currentWallet: "",
  locked: true,
  rescanning: false,
  watchOnly: false,
  tip: {
    hash: "",
    height: -1,
    time: -1,
  },
  balance: {
    unconfirmed: 0,
    lockedUnconfirmed: 0,
  },
};

export const createWallet =
  (opt: {
    walletName: string;
    seedphrase: string;
    password: string;
    optIn: boolean;
    isLedger: boolean;
    xpub: string | null;
  }) =>
  async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
    const {walletName, seedphrase, password, optIn, isLedger, xpub} = opt;
    if (!walletName) throw new Error("Wallet name cannot be empty.");
    if (!seedphrase && !isLedger) throw new Error("Invalid seedphrase.");
    if (!password) throw new Error("Password cannot be empty.");

    if (isLedger) {
      await postMessage({
        type: MessageTypes.CREATE_NEW_WALLET,
        payload: {
          id: walletName,
          passphrase: password,
          optIn,
          watchOnly: true,
          accountKey: xpub,
        },
      });
    } else {
      await postMessage({
        type: MessageTypes.CREATE_NEW_WALLET,
        payload: {
          id: walletName,
          mnemonic: seedphrase,
          passphrase: password,
          optIn,
          watchOnly: false,
        },
      });
    }

    await new Promise((r) => setTimeout(r, 1000));
    await dispatch(fetchWalletIDs());
    await dispatch(selectWallet(walletName));
    return;
  };

export const lockWallet =
  () => async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
    await postMessage({type: MessageTypes.LOCK_WALLET});
    await dispatch(fetchWalletState());
  };

export const unlockWallet =
  (password: string) =>
  async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
    await postMessage({
      type: MessageTypes.UNLOCK_WALLET,
      payload: password,
    });
    await dispatch(fetchWalletState());
  };

export const fetchWalletState = () => async (dispatch: Dispatch) => {
  const resp = await postMessage({type: MessageTypes.GET_WALLET_STATE});
  dispatch({
    type: ActionType.SET_WALLET_STATE,
    payload: resp,
  });
};

export const fetchWalletBalance = () => async (dispatch: Dispatch) => {
  const balance = await postMessage({
    type: MessageTypes.GET_WALLET_BALANCE,
  });
  dispatch(setWalletBalance(balance));
};

export const setWalletBalance = (balance: {
  unconfirmed: number;
  lockedUnconfirmed: number;
}) => {
  return {
    type: ActionType.SET_WALLET_BALANCE,
    payload: balance,
  };
};

export const fetchWallets = () => async (dispatch: Dispatch) => {
  const wallets = await postMessage({type: MessageTypes.GET_WALLETS});
  dispatch({
    type: ActionType.SET_WALLETS,
    payload: wallets,
  });
};

export const fetchWalletIDs = () => async (dispatch: Dispatch) => {
  const walletIDs = await postMessage({type: MessageTypes.GET_WALLET_IDS});
  dispatch({
    type: ActionType.SET_WALLET_IDS,
    payload: walletIDs.filter((id: string) => id !== "primary"),
  });
};

export const selectWallet =
  (id: string) =>
  async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
    await postMessage({
      type: MessageTypes.SELECT_WALLET,
      payload: id,
    });
    await dispatch(fetchWalletState());
  };

export default function wallet(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_WALLET_BALANCE:
      return {
        ...state,
        balance: {
          unconfirmed: action.payload.unconfirmed,
          lockedUnconfirmed: action.payload.lockedUnconfirmed,
        },
      };
    case ActionType.SET_WALLETS:
      return {
        ...state,
        wallets: action.payload,
      };
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
        tip: action.payload.tip,
        rescanning: action.payload.rescanning,
        watchOnly: action.payload.watchOnly,
      };
    default:
      return state;
  }
}

export const useWallets = () => {
  return useSelector((state: AppRootState) => {
    return state.wallet.wallets;
  }, deepEqual);
};

export const useWalletIDs = () => {
  return useSelector((state: AppRootState) => {
    return state.wallet.walletIDs.filter((id) => id !== "primary");
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
      tip: state.wallet.tip,
      rescanning: state.wallet.rescanning,
      watchOnly: state.wallet.watchOnly,
    };
  }, deepEqual);
};

export const useWalletBalance = () => {
  return useSelector((state: AppRootState) => {
    const {unconfirmed, lockedUnconfirmed} = state.wallet.balance;
    return {
      unconfirmed,
      lockedUnconfirmed,
      spendable: unconfirmed - lockedUnconfirmed,
    };
  }, deepEqual);
};

export const useInitialized = () => {
  return useSelector((state: AppRootState) => {
    const {
      wallet: {walletIDs},
    } = state;
    return !!walletIDs.length;
  }, deepEqual);
};
