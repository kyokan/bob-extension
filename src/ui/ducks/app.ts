import {useSelector} from "react-redux";
import deepEqual from "fast-deep-equal";
import {AppRootState} from "@src/ui/store/configureAppStore";

export enum ActionType {
  SET_BOB_MOVING = 'app/setBobMoving',
  SET_BOB_MESSAGE = 'app/setBobMessage',
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
};

const initialState: State = {
  isBobMoving: false,
  bobMessage: '',
};

export const setBobMoving = (moving: boolean) => {
  return {
    type: ActionType.SET_BOB_MOVING,
    payload: moving,
  };
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
    default:
      return state;
  }
}

export const useBobMoving = () => {
  return useSelector((state: AppRootState) => {
    return state.app.isBobMoving;
  }, deepEqual)
};

export const useBobMessage = () => {
  return useSelector((state: AppRootState) => {
    return state.app.bobMessage;
  }, deepEqual)
};
