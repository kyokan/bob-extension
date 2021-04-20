import React, {ReactElement, useEffect, useState} from "react";
import "./popup.scss";
import Onboarding from "@src/ui/pages/Onboarding";
import {useDispatch} from "react-redux";
import {fetchWallets, fetchWalletState, useInitialized, useWalletState} from "@src/ui/ducks/wallet";
import AppHeader from "@src/ui/components/AppHeader";
import Login from "@src/ui/pages/Login";
import {Redirect, Route, Switch} from "react-router";
import BobMoveIcon from "@src/static/icons/bob-moves.gif";
import Icon from "@src/ui/components/Icon";
import Home from "@src/ui/pages/Home";
import {fetchLatestBlock} from "@src/ui/ducks/node";
import SendTx from "@src/ui/pages/SendTx";
import ReceiveTx from "@src/ui/pages/ReceiveTx";
import MessageTypes from "@src/util/messageTypes";
import {usePendingTXs} from "@src/ui/ducks/pendingTXs";
import ConfirmTx from "@src/ui/pages/ConfirmTx";
import postMessage from "@src/util/postMessage";

export default function Popup (): ReactElement {
  const dispatch = useDispatch();
  const initialized = useInitialized();
  const { locked, currentWallet } = useWalletState();
  const [loading, setLoading] = useState(true);
  const pendingTXHashes = usePendingTXs();

  useEffect(() => {
    (async () => {
      try {
        const now = Date.now();

        await dispatch(fetchWallets());
        await dispatch(fetchWalletState());
        await dispatch(fetchLatestBlock());
        await postMessage({
          type: MessageTypes.UPDATE_TX_QUEUE,
        });
        await postMessage({ type: MessageTypes.GET_PENDING_TRANSACTIONS });
        await new Promise(r => setTimeout(r, Math.min(1000, 1000 - (Date.now() - now))));
        setLoading(false);
      } catch (e) {
        console.error(e)
      }
    })();
  }, []);

  useEffect(() => {
    if (!locked && currentWallet) {
      postMessage({ type: MessageTypes.CHECK_FOR_RESCAN });
    }
  }, [currentWallet, locked]);

  if (loading) {
    return (
      <div className="popup__loading">
        <Icon url={BobMoveIcon} size={4} />
        <small>Initializing...</small>
      </div>
    );
  }

  if (initialized && !locked && pendingTXHashes.length) {
    return (
      <div className="popup">
        <AppHeader/>
        <ConfirmTx />
      </div>
    );
  }

  return (
    <div className="popup">
      { !initialized && <Onboarding /> }
      { initialized && <AppHeader />}
      { initialized && locked && (
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
      { initialized && !locked && (
        <Switch>
          <Route path="/onboarding">
            <Onboarding />
          </Route>
          <Route path="/receive">
            <ReceiveTx />
          </Route>
          <Route path="/send">
            <SendTx />
          </Route>
          <Route path="/">
            <Home />
          </Route>
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      )}
    </div>
  )
};
