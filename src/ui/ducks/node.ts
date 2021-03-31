import {Dispatch} from "redux";
import {useSelector} from "react-redux";
import deepEqual from "fast-deep-equal";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {AppRootState} from "@src/ui/store/configureAppStore";

enum ActionType {
  SET_INFO = 'handshake/setInfo',
}

type Action<payload> = {
  type: ActionType;
  payload: payload;
  meta?: any;
  error?: any;
}

type State = {
  hash: string;
  height: number;
  time: number;
}

const initialState: State = {
  hash: '',
  height: -1,
  time: -1,
};

export const setInfo = (hash: string, height: number, time: number): Action<{hash: string; height: number; time: number}> => {
  return {
    type: ActionType.SET_INFO,
    payload: {
      hash,
      height,
      time,
    },
  };
};

export const fetchLatestBlock = () => async (dispatch: Dispatch, getState: () => { app: { apiHost: string; apiKey: string} }) => {
  const block = await postMessage({ type: MessageTypes.GET_LATEST_BLOCK });

  const {hash, height, time} = block;

  dispatch(setInfo(hash, height, time));
};

export default function handshakeReducer(state = initialState, action: Action<any>): State {
  switch (action.type) {
    case ActionType.SET_INFO:
      return {
        hash: action.payload.hash,
        height: action.payload.height,
        time: action.payload.time,
      };
    default:
      return state;
  }
}

export const useHandshakeInfo = () => {
  return useSelector((state: AppRootState): State => {
    return state.node;
  }, deepEqual);
};

export const useCurrentBlockHeight = () => {
  return useSelector((state: AppRootState): number => {
    return state.node.height;
  }, deepEqual);
};

export const useCurrentBlocktime = () => {
  return useSelector((state: AppRootState): Date => {
    const {time} = state.node;
    return new Date(time * 1000);
  }, deepEqual);
};
