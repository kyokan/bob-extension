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
  SET_ACCOUNT_INFO = "wallet/setAccountInfo",
  SET_ACCOUNTS_INFO = "wallet/setAccountsInfo",
  SET_ACCOUNT_NAMES = "wallet/setAccountNames",
  SET_CURRENT_ACCOUNT = "wallet/setCurrentAccount",
  SET_RECEIVE_ADDRESS = "wallet/setReceiveAddress",
}

type Action = {
  type: ActionType;
  payload?: any;
  error?: boolean;
  meta?: any;
};

type State = {
  wallets: {
    accountDepth: number;
    encrypted: string;
    watchOnly: boolean;
    wid: string;
    accounts: string[];
  }[];
  walletIDs: string[];
  currentWallet: string;
  accountInfo: {
    accountIndex: number;
    name: string;
    type: string;
    watchOnly: boolean;
    wid: string;
  };
  accountNames: string[];
  currentAccount: string;
  locked: boolean;
  receiveAddress: string;
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
  accountInfo: {
    accountIndex: 0,
    name: "",
    type: "",
    watchOnly: false,
    wid: "",
  },
  accountNames: [],
  currentAccount: "default",
  locked: true,
  receiveAddress: "",
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
    xpub: string | undefined;
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
  const wallets = await postMessage({type: MessageTypes.GET_WALLETS_INFO});
  dispatch({
    type: ActionType.SET_WALLETS,
    payload: wallets,
  });
};

export const fetchAccountNames =
  (walletID: string) => async (dispatch: Dispatch) => {
    const accountNames = await postMessage({
      type: MessageTypes.GET_ACCOUNT_NAMES,
      payload: walletID,
    });
    dispatch({
      type: ActionType.SET_ACCOUNT_NAMES,
      payload: accountNames,
    });
  };

export const setAccountNames = (accountNames: string[]) => {
  return {
    type: ActionType.SET_ACCOUNT_NAMES,
    payload: accountNames,
  };
};

export const fetchAccountsInfo =
  (walletId: string) => async (dispatch: Dispatch) => {
    const accountsInfo = await postMessage({
      type: MessageTypes.GET_ACCOUNTS_INFO,
      payload: walletId,
    });
    dispatch({
      type: ActionType.SET_ACCOUNTS_INFO,
      payload: accountsInfo,
    });
  };

export const selectAccount =
  (accountName: string) =>
  async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
    const selected = await postMessage({
      type: MessageTypes.SELECT_ACCOUNT,
      payload: accountName,
    });
    dispatch({
      type: ActionType.SET_ACCOUNT_INFO,
      payload: selected,
    });
  };

export const setCurrentAccount = (accountName: string) => {
  return {
    type: ActionType.SET_CURRENT_ACCOUNT,
    payload: accountName,
  };
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
    await dispatch(fetchAccountsInfo(id));
    await dispatch(selectAccount("default"));
  };

export const fetchReceiveAddress =
  (id: string, accountName: string) => async (dispatch: Dispatch) => {
    const address = await postMessage({
      type: MessageTypes.GET_WALLET_RECEIVE_ADDRESS,
      payload: {
        id,
        accountName,
      },
    });
    dispatch({
      type: ActionType.SET_RECEIVE_ADDRESS,
      payload: address,
    });
  };

export const setReceiveAddress = (receiveAddress: string) => {
  return {
    type: ActionType.SET_RECEIVE_ADDRESS,
    payload: receiveAddress,
  };
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
    case ActionType.SET_ACCOUNT_NAMES:
      return {
        ...state,
        accountNames: action.payload,
      };
    case ActionType.SET_CURRENT_ACCOUNT:
      return {
        ...state,
        currentAccount: action.payload,
      };
    // case ActionType.SET_ACCOUNTS_INFO:
    //   return {
    //     ...state,
    //     accounts: action.payload,
    //   };
    case ActionType.SET_ACCOUNT_INFO:
      return {
        ...state,
        accountInfo: action.payload,
        currentAccount: action.payload.name,
      };
    case ActionType.SET_RECEIVE_ADDRESS:
      return {
        ...state,
        receiveAddress: action.payload,
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

export const useAccountNames = () => {
  return useSelector((state: AppRootState) => {
    return state.wallet.accountNames;
  }, deepEqual);
};

export const useAccountInfo = () => {
  return useSelector((state: AppRootState) => {
    return state.wallet.accountInfo;
  }, deepEqual);
};

// export const useWalletAccounts = () => {
//   return useSelector((state: AppRootState) => {
//     return state.wallet.accounts;
//   }, deepEqual);
// };

export const useCurrentAccount = () => {
  return useSelector((state: AppRootState) => {
    return state.wallet.currentAccount;
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

export const useReceiveAddress = () => {
  return useSelector((state: AppRootState) => {
    return state.wallet.receiveAddress;
  }, deepEqual);
};
