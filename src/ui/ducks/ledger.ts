import {useSelector} from "react-redux";
import deepEqual from "fast-deep-equal";
import {AppRootState} from "@src/ui/store/configureAppStore";

export enum ActionType {
  LEDGER_CONNECT_SHOW = "ledger/ledgerConnectShow",
  LEDGER_CONFIRMED = "ledger/ledgerConfirmed",
  LEDGER_CONNECT_HIDE = "ledger/ledgerConnectHide",
  LEDGER_CONNECT_ERR = "ledger/ledgerConnectErr",
}

type Action = {
  type: ActionType;
  payload?: any;
  error?: boolean;
  meta?: any;
};

type State = {
  isShowingLedgerModal: boolean;
  hasConfirmed: boolean;
  errMessage: string;
};

const initialState: State = {
  isShowingLedgerModal: false,
  hasConfirmed: false,
  errMessage: "",
};

export function ledgerConnectShow() {
  console.log("show");
  return {
    type: ActionType.LEDGER_CONNECT_SHOW,
    payload: {
      isShowingLedgerModal: true,
    },
  };
}

export function ledgerConnectHide() {
  console.log("hide");
  return {
    type: ActionType.LEDGER_CONNECT_HIDE,
    payload: {
      isShowingLedgerModal: false,
    },
  };
}

export function ledgerConfirmed(hasConfirmed: boolean) {
  console.log("confirmed");
  return {
    type: ActionType.LEDGER_CONFIRMED,
    payload: hasConfirmed,
  };
}

export function ledgerConnectErr(errMessage: string) {
  console.log("error");
  return {
    type: ActionType.LEDGER_CONNECT_ERR,
    payload: errMessage,
  };
}

export default function ledger(state = initialState, action: Action): State {
  const {type, payload} = action;

  switch (type) {
    case ActionType.LEDGER_CONNECT_SHOW:
      return {
        ...state,
        isShowingLedgerModal: payload.isShowingLedgerModal,
      };
    case ActionType.LEDGER_CONFIRMED:
      return {
        ...state,
        hasConfirmed: payload.hasConfirmed,
      };
    case ActionType.LEDGER_CONNECT_HIDE:
      return {
        ...state,
        isShowingLedgerModal: payload.isShowingLedgerModal,
      };
    case ActionType.LEDGER_CONNECT_ERR:
      return {
        ...state,
        errMessage: payload,
      };
    default:
      return state;
  }
}

export const useLedgerConnect = () => {
  return useSelector((state: AppRootState) => {
    return state.ledger.isShowingLedgerModal;
  }, deepEqual);
};

export const useLedgerConfirm = () => {
  return useSelector((state: AppRootState) => {
    return state.ledger.hasConfirmed;
  }, deepEqual);
};

export const useLedgerErr = () => {
  return useSelector((state: AppRootState) => {
    return state.ledger.errMessage;
  }, deepEqual);
};
