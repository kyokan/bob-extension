import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Dispatch} from "redux";
import {useSelector} from "react-redux";
import {AppRootState} from "@src/ui/store/configureAppStore";
import deepEqual from "fast-deep-equal";

export enum ActionTypes {
  SET_DOMAIN_NAMES = 'domains/setDomainNames',
  APPEND_DOMAIN_NAMES = 'domains/appendDomainNames',
  SET_FETCHING = 'domains/setFetching',
  SET_OFFSET = 'domains/setOffset',
}

type Action = {
  type: ActionTypes;
  payload?: any;
  meta?: any;
  error?: boolean;
}

type State = {
  order: string[];
  map: {
    [name: string]: Domain;
  };
  offset: number,
  fetching: boolean;
}

type Domain = {
  claimed: number;
  data: string;
  expired: boolean;
  height: number;
  highest: number;
  name: string;
  nameHash: string;
  owner: {
    hash: string;
    index: number;
  };
  registered: boolean;
  renewal: number;
  renewals: number;
  revoked: number;
  transfer: number;
  value: number;
  weak: boolean;
}

const initialState: State = {
  map: {},
  order: [],
  fetching: false,
  offset: 20,
};

let getNameNonce = 0;

export const setFetching = (fetching: boolean) => ({
  type: ActionTypes.SET_FETCHING,
  payload: fetching,
});

export const setOffset = (offset: number) => {
  return {
    type: ActionTypes.SET_OFFSET,
    payload: offset,
  }
};

export const resetDomains = () => async (dispatch: Dispatch) => {
  await postMessage({ type: MessageTypes.RESET_DOMAINS, payload: getNameNonce });
  getNameNonce = await postMessage({ type: MessageTypes.GET_TX_NONCE });
  dispatch(setDomainNames([]));
  dispatch(setOffset(20));
};

export const fetchDomainNames = () => async (dispatch: Dispatch) => {
  await dispatch(setFetching(true));
  getNameNonce = await postMessage({ type: MessageTypes.GET_NAME_NONCE });
  await postMessage({
    type: MessageTypes.GET_DOMAIN_NAMES,
    payload: {
      nonce: getNameNonce,
    },
  });
  await dispatch(setFetching(false));
};

export const setDomainNames = (domains: any) => {
  return {
    type: ActionTypes.SET_DOMAIN_NAMES,
    payload: domains,
  };
};

export default function domains(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionTypes.SET_FETCHING:
      return {
        ...state,
        fetching: action.payload,
      };
    case ActionTypes.SET_OFFSET:
      return {
        ...state,
        offset: action.payload > state.order.length
          ? Math.max(20, state.order.length)
          : action.payload,
      };
    case ActionTypes.SET_DOMAIN_NAMES:
      return {
        ...state,
        order: action.payload.map((domain: Domain) => domain.name),
        map: action.payload.reduce((map: {[n: string]: Domain}, domain: Domain) => {
          map[domain.name] = domain;
          return map;
        }, []),
      };
    case ActionTypes.APPEND_DOMAIN_NAMES:
      return handleAppendDomainNames(state, action);
    default:
      return state;
  }
}

function handleAppendDomainNames(state: State, action: Action): State {
  if (getNameNonce !== action.meta.nonce) {
    return state;
  }

  return {
    ...state,
    order: [
      ...state.order,
      ...action.payload.map((domain: Domain) => domain.name),
    ],
    map: {
      ...state.map,
      ...action.payload.reduce((map: {[h: string]: Domain}, domain: Domain) => {
        map[domain.name] = domain;
        return map;
      }, {}),
    },
  };
}

export const useDomainFetching = (): boolean => {
  return useSelector((state: AppRootState) => {
    return state.domains.fetching;
  }, deepEqual);
};

export const useDomainOffset = (): number => {
  return useSelector((state: AppRootState) => {
    return state.domains.offset;
  }, deepEqual);
};

export const useDomainNames = (offset: number): string[] => {
  return useSelector((state: AppRootState) => {
    return state.domains.order.slice(0, offset);
  }, deepEqual)
};

export const useDomainByName = (name: string): Domain | undefined => {
  return useSelector((state: AppRootState) => {
    return state.domains.map[name];
  }, deepEqual)
};
