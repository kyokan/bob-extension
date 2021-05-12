import {applyMiddleware, combineReducers, createStore} from "redux";
import {createLogger} from "redux-logger";
import thunk from "redux-thunk";
import app from "@src/ui/ducks/app";
import wallet from "@src/ui/ducks/wallet";
import node from "@src/ui/ducks/node";
import transactions from "@src/ui/ducks/transactions";
import domains from "@src/ui/ducks/domains";
import queue from "@src/ui/ducks/queue";

const rootReducer = combineReducers({
  app,
  wallet,
  node,
  transactions,
  domains,
  queue,
});

export type AppRootState = ReturnType<typeof rootReducer>;

export default function configureAppStore() {
  return createStore(
    rootReducer,
    process.env.NODE_ENV !== 'production'
      ? applyMiddleware(thunk, createLogger({
        collapsed: (getState, action = {}) => [''].includes(action.type),
      }))
      : applyMiddleware(thunk),
  );
}
