import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Dispatch} from "redux";
import {useSelector} from "react-redux";
import {AppRootState} from "@src/ui/store/configureAppStore";
import deepEqual from "fast-deep-equal";

export enum ActionTypes {
  SET_DOMAIN_NAME = 'domains/setDomainName',
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
  owned: boolean;
  ownerCovenantType?: string;
}

const initialState: State = {
  map: {},
  order: [],
  fetching: false,
  offset: 20,
};

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
  dispatch(setDomainNames([]));
  dispatch(setOffset(20));
};

export const fetchDomainName = (name: string) => async (dispatch: Dispatch) => {
  await dispatch(setFetching(true));
  const domain: Domain = await postMessage({
    type: MessageTypes.GET_DOMAIN_NAME,
    payload: name,
  });
  await dispatch(setDomainName(domain));
  await dispatch(setFetching(false));
}

export const fetchDomainNames = () => async (dispatch: Dispatch) => {
  await dispatch(setFetching(true));
  await postMessage({
    type: MessageTypes.GET_DOMAIN_NAMES,
  });
  await dispatch(setFetching(false));
};

export const setDomainName = (domain: Domain) => {
  return {
    type: ActionTypes.SET_DOMAIN_NAME,
    payload: domain,
  };
};

export const setDomainNames = (domains: Domain[]) => {
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
    case ActionTypes.SET_DOMAIN_NAME:
      return {
        ...state,
        map: {
          ...state.map,
          [action.payload.name]: action.payload,
        },
      };
    case ActionTypes.SET_DOMAIN_NAMES:
      return handleSetDomainNames(state, action);
    case ActionTypes.APPEND_DOMAIN_NAMES:
      return handleAppendDomainNames(state, action);
    default:
      return state;
  }
}

function handleSetDomainNames(state: State, action: Action): State {
  return {
    ...state,
    order: action.payload.map((domain: Domain) => domain.name),
    map: action.payload.reduce((map: {[n: string]: Domain}, domain: Domain) => {
      map[domain.name] = domain;
      return map;
    }, []),
  };
}

function handleAppendDomainNames(state: State, action: Action): State {
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
