import {applyMiddleware, combineReducers, createStore} from "redux";
import {createLogger} from "redux-logger";
import thunk from "redux-thunk";
import app from "@src/ui/ducks/app";
import wallet from "@src/ui/ducks/wallet";
import node from "@src/ui/ducks/node";

const rootReducer = combineReducers({
  app,
  wallet,
  node,
});

export type AppRootState = ReturnType<typeof rootReducer>;

export default function configureAppStore() {
  return createStore(
    rootReducer,
    process.env.NODE_ENV === 'development'
      ? applyMiddleware(thunk, createLogger({
        collapsed: (getState, action = {}) => [''].includes(action.type),
      }))
      : applyMiddleware(thunk),
  );
}
