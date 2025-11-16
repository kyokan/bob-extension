import React, {ReactElement, useEffect, useState} from "react";
import "./popup.scss";
import Onboarding from "@src/ui/pages/Onboarding";
import {useDispatch} from "react-redux";
import {
  fetchWallets,
  fetchWalletIDs,
  fetchWalletState,
  useInitialized,
  useWalletState,
  useCurrentAccount,
  fetchAccountNames,
  fetchAccountsInfo,
  fetchReceiveAddress,
} from "@src/ui/ducks/wallet";
import {useLedgerConnect} from "@src/ui/ducks/ledger";
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
import ConfirmTx from "@src/ui/pages/ConfirmTx";
import postMessage from "@src/util/postMessage";
import {useTXQueue} from "@src/ui/ducks/queue";
import {fetchMultiAccountsEnabled, fetchExplorer} from "@src/ui/ducks/app";
import Settings from "@src/ui/pages/Settings";
import DomainPage from "@src/ui/pages/Domain";
import ConfirmLedger from "@src/ui/pages/ConfirmLedger";
import CreateAccount from "@src/ui/pages/CreateAccount";
import AccountInfo from "@src/ui/pages/AccountInfo";

export default function Popup(): ReactElement {
  const dispatch = useDispatch();
  const initialized = useInitialized();
  const currentAccount = useCurrentAccount();
  const {locked, currentWallet} = useWalletState();
  const queuedTXHashes = useTXQueue();
  const ledgerConnect = useLedgerConnect();
  const [loading, setLoading] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);

  const theme = darkTheme ? "theme--dark" : "theme--default";

  useEffect(() => {
    postMessage({type: MessageTypes.POPUP_LOADED});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        postMessage({
          type: MessageTypes.MP_TRACK,
          payload: {
            name: "Screen View",
            data: {
              view: "Home",
            },
          },
        });
        await dispatch(fetchWallets());
        await dispatch(fetchWalletIDs());
        await dispatch(fetchWalletState());
        await dispatch(fetchLatestBlock());
        await dispatch(fetchMultiAccountsEnabled());
        await dispatch(fetchExplorer());
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!locked && currentWallet && currentAccount) {
      (async () => {
        await dispatch(fetchAccountNames(currentWallet));
        await dispatch(fetchAccountsInfo(currentWallet));
        await dispatch(fetchReceiveAddress(currentWallet, currentAccount));
      })();
    }
  }, [currentWallet, currentAccount, locked]);

  useEffect(() => {
    if (!locked && currentWallet) {
      postMessage({type: MessageTypes.CHECK_FOR_RESCAN});
    }
  }, [currentWallet, locked]);

  if (loading) {
    return (
      <div className={`popup__loading ${theme}`}>
        <Icon url={BobMoveIcon} size={4} />
        <small>Initializing...</small>
      </div>
    );
  }

  if (initialized && !locked && !ledgerConnect && queuedTXHashes.length) {
    return (
      <div className={`popup ${theme}`}>
        <AppHeader />
        <ConfirmTx />
      </div>
    );
  }

  if (initialized && !locked && ledgerConnect) {
    return (
      <div className={`popup ${theme}`}>
        <AppHeader />
        <ConfirmLedger />
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className={`popup ${theme}`}>
        <AppHeader />
        <Onboarding />
      </div>
    );
  }

  if (locked) {
    return (
      <div className={`popup ${theme}`}>
        <AppHeader />
        <Switch>
          <Route path="/onboarding">
            <Onboarding />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/settings">
            <Settings />
          </Route>
          <Route>
            <Redirect to="/login" />
          </Route>
        </Switch>
      </div>
    );
  }

  return (
    <div className={`popup ${theme}`}>
      <AppHeader />
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
        <Route path="/create-account">
          <CreateAccount />
        </Route>
        <Route path="/account-info">
          <AccountInfo />
        </Route>
        <Route path="/settings">
          <Settings />
        </Route>
        <Route path="/domains/:name">
          <DomainPage />
        </Route>
        <Route path="/">
          <Home />
        </Route>
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </div>
  );
}
