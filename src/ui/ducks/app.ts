import {useSelector} from "react-redux";
import {ThunkDispatch} from "redux-thunk";
import deepEqual from "fast-deep-equal";
import {AppRootState} from "@src/ui/store/configureAppStore";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";

export enum ActionType {
  SET_BOB_MOVING = "app/setBobMoving",
  SET_BOB_MESSAGE = "app/setBobMessage",
  SET_MULTI_ACCOUNTS_ENABLED = "app/setMultiAccountsEnabled",
}

type Action = {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
};

type State = {
  isBobMoving: boolean;
  bobMessage: string;
  multiAccountsEnabled: boolean;
};

const initialState: State = {
  isBobMoving: false,
  bobMessage: "",
  multiAccountsEnabled: false,
};

export const setBobMoving = (moving: boolean) => {
  return {
    type: ActionType.SET_BOB_MOVING,
    payload: moving,
  };
};

export const setMultiAccountsEnabled = (enabled: boolean) => {
  return {
    type: ActionType.SET_MULTI_ACCOUNTS_ENABLED,
    payload: enabled,
  };
};

export const fetchMultiAccountsEnabled =
  () => async (dispatch: ThunkDispatch<AppRootState, any, Action>) => {
    const enabled = await postMessage({
      type: MessageTypes.GET_MULTI_ACCOUNTS_ENABLED,
    });
    dispatch(setMultiAccountsEnabled(enabled as boolean));
  };

export default function app(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_BOB_MOVING:
      return {
        ...state,
        isBobMoving: action.payload,
      };
    case ActionType.SET_BOB_MESSAGE:
      return {
        ...state,
        bobMessage: action.payload,
      };
    case ActionType.SET_MULTI_ACCOUNTS_ENABLED:
      return {
        ...state,
        multiAccountsEnabled: action.payload,
      };
    default:
      return state;
  }
}

export const useBobMoving = () => {
  return useSelector((state: AppRootState) => {
    return state.app.isBobMoving;
  }, deepEqual);
};

export const useBobMessage = () => {
  return useSelector((state: AppRootState) => {
    return state.app.bobMessage;
  }, deepEqual);
};

export const useMultiAccountsEnabled = () => {
  return useSelector((state: AppRootState) => {
    return state.app.multiAccountsEnabled;
  }, deepEqual);
};
