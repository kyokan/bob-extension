import React, {ReactElement, useEffect} from "react";
import "./popup.scss";
import Onboarding from "@src/ui/pages/Onboarding";
import {useDispatch} from "react-redux";
import {fetchWallets, useCurrentWallet, useInitialized, useWalletIDs} from "@src/ui/ducks/wallet";
import AppHeader from "@src/ui/components/AppHeader";
import Login from "@src/ui/pages/Login";
import {Redirect, Route, Switch} from "react-router";

export default function Popup (): ReactElement {
  const dispatch = useDispatch();
  const walletIDs = useWalletIDs();
  const initialized = useInitialized();
  const currentWallet = useCurrentWallet();

  useEffect(() => {
    (async () => {
      await dispatch(fetchWallets());
    })();
  });

  return (
    <div className="popup">
      { !initialized && <Onboarding /> }
      { initialized && <AppHeader />}
      { initialized && !currentWallet && (
        <Switch>
          <Route path="/onboarding">
            <Onboarding />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          <Route>
            <Redirect to="/login" />
          </Route>
        </Switch>
      )}
      { initialized && !!currentWallet && (
        <Switch>
          <Route path="/onboarding">
            <Onboarding />
          </Route>
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      )}
    </div>
  )
};
