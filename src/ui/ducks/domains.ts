import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {Dispatch} from "redux";
import {useSelector} from "react-redux";
import {AppRootState} from "@src/ui/store/configureAppStore";
import deepEqual from "fast-deep-equal";

export enum ActionTypes {
  SET_DOMAIN_NAMES = 'domains/setDomainNames',
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
};

export const fetchDomainNames = () => async (dispatch: Dispatch) => {
  const names = await postMessage({ type: MessageTypes.GET_DOMAIN_NAMES });
  dispatch(setDomainNames(names));
};

export const setDomainNames = (domains: any) => {
  return {
    type: ActionTypes.SET_DOMAIN_NAMES,
    payload: domains,
  };
};

export default function domains(state = initialState, action: Action): State {
  switch (action.type) {
    case ActionTypes.SET_DOMAIN_NAMES:
      return {
        ...state,
        order: action.payload.map((domain: Domain) => domain.name),
        map: action.payload.reduce((map: {[n: string]: Domain}, domain: Domain) => {
          map[domain.name] = domain;
          return map;
        }, []),
      };
    default:
      return state;
  }
}

export const useDomainNames = (): string[] => {
  return useSelector((state: AppRootState) => {
    return state.domains.order;
  }, deepEqual)
};

export const useDomainByName = (name: string): Domain | undefined => {
  return useSelector((state: AppRootState) => {
    return state.domains.map[name];
  }, deepEqual)
};
