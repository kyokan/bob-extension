import React, {
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  fetchWallets,
  fetchWalletIDs,
  fetchWalletState,
  fetchWalletBalance,
  useWalletBalance,
  useCurrentWallet,
  useCurrentAccount,
  useAccountNames,
  useAccountInfo,
  useReceiveAddress,
} from "@src/ui/ducks/wallet";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import Identicon from "@src/ui/components/Identicon";
import {useDispatch} from "react-redux";
import {formatNumber, fromDollaryDoos} from "@src/util/number";
import truncString from "@src/util/truncString";
import "./home.scss";
import {
  ReceiveButton,
  RedeemButton,
  RevealButton,
  SendButton,
} from "@src/ui/components/HomeActionButton";
import classNames from "classnames";
import copy from "copy-to-clipboard";
import Icon from "@src/ui/components/Icon";
import {
  fetchTransactions,
  resetTransactions,
  setOffset as setTXOffset,
  useTXOffset,
} from "@src/ui/ducks/transactions";
import Transactions from "@src/ui/components/Transactions";
import {
  fetchDomainNames,
  useDomainOffset,
  resetDomains,
  setOffset as setDomainOffset,
} from "@src/ui/ducks/domains";
import Domains from "@src/ui/components/Domains";
import {fetchTXQueue} from "@src/ui/ducks/queue";
import {useLocation} from "react-router";
import queryString from "querystring";
import HandshakeSymbol from "@src/ui/components/HandshakeSymbol";
import AccountMenu from "@src/ui/components/AccountMenu";

export default function Home(): ReactElement {
  const dispatch = useDispatch();
  const txOffset = useTXOffset();
  const domainOffset = useDomainOffset();
  const currentWallet = useCurrentWallet();
  const currentAddress = useReceiveAddress();
  const loc = useLocation();
  const parsed = queryString.parse(loc.search.slice(1));
  const [tab, setTab] = useState<"domains" | "activity">(
    (parsed.defaultTab as any) || "activity"
  );
  const {spendable, lockedUnconfirmed} = useWalletBalance();
  const listElement = useRef<HTMLDivElement>(null);
  const pageElement = useRef<HTMLDivElement>(null);
  const [fixHeader, setFixHeader] = useState(false);

  console.log("currentAddress:", currentAddress);

  const currentAccount = useCurrentAccount();
  console.log("currentAccount:", currentAccount);

  const accountNames = useAccountNames();
  console.log("accountNames:", accountNames);

  const accountInfo = useAccountInfo();
  console.log("accountInfo:", accountInfo);

  const isDefault = currentAccount === "default";

  useEffect(() => {
    return () => {
      (async function onHomeUnmount() {
        dispatch(resetTransactions());
        dispatch(resetDomains());
      })();
    };
  }, []);

  useEffect(() => {
    (async function onHomeMount() {
      try {
        await dispatch(fetchWalletBalance());

        // const address = await postMessage({
        //   type: MessageTypes.GET_WALLET_RECEIVE_ADDRESS,
        //   payload: {
        //     id: currentWallet,
        //     accountName: currentAccount,
        //   },
        // });
        // setCurrentAddress(address);

        await dispatch(fetchTXQueue());
        dispatch(fetchTransactions());
        dispatch(fetchDomainNames());
      } catch (e) {
        console.error(e);
      }
    })();
  }, [currentWallet]);

  const _onScroll = useCallback(
    async (e) => {
      if (!listElement.current || !pageElement.current) return;

      const {y} = listElement.current.getBoundingClientRect();
      if (y <= 60) {
        setFixHeader(true);
      } else {
        setFixHeader(false);
      }

      const {scrollTop, scrollHeight, offsetHeight} = pageElement.current;
      if ((scrollTop + offsetHeight) / scrollHeight > 0.8) {
        if (tab === "activity") {
          dispatch(setTXOffset(txOffset + 20));
        } else {
          dispatch(setDomainOffset(domainOffset + 20));
        }
      }
    },
    [listElement, pageElement, tab, txOffset, domainOffset]
  );

  return (
    <div
      className={classNames("home", {
        "home--fixed-header": fixHeader,
      })}
      ref={pageElement}
      onScroll={_onScroll}
    >
      <div className="home__account">
        <div className="home__account-info">
          <span className="home__account-info__label">
            {currentAccount == "default" || currentAccount == ""
              ? currentWallet
              : currentAccount}
          </span>
          <span
            className="home__account-info__address"
            onClick={() => copy(currentAddress)}
          >
            <small>{truncString(currentAddress, 6, 4)}</small>
            <Icon
              fontAwesome="fa-copy"
              solid={false}
              size={0.65}
              onClick={() => copy(currentAddress)}
            />
          </span>
        </div>
        {!isDefault && (
          <div className="home__account-util">
            <AccountMenu />
          </div>
        )}
      </div>

      <div className="home__wallet">
        {/* <Identicon value={currentAddress} /> */}
        <div className="home__wallet-info">
          {/* <small className="home__wallet-info__label">{currentWallet}</small> */}
          <div className="home__wallet-info__spendable">
            {formatNumber(fromDollaryDoos(spendable))}
          </div>
          <div className="hns">
            <div className="hns__symbol">
              <HandshakeSymbol fill="black" size={1.25} />
            </div>
            hns
          </div>
          {/* <small className="home__wallet-info__locked"> */}
          {/* {!!lockedUnconfirmed && `+${formatNumber(fromDollaryDoos(lockedUnconfirmed))} HNS locked up`} */}
          {/* </small> */}
        </div>
      </div>
      <div className="home__actions">
        <SendButton />
        <ReceiveButton />
        <RevealButton />
      </div>

      <div className="home__list" ref={listElement}>
        <div className="home__list__header">
          <div
            className={classNames("home__list__header__tab", {
              "home__list__header__tab--selected": tab === "domains",
            })}
            onClick={() => setTab("domains")}
          >
            Domains
          </div>
          <div
            className={classNames("home__list__header__tab", {
              "home__list__header__tab--selected": tab === "activity",
            })}
            onClick={() => setTab("activity")}
          >
            Activity
          </div>
        </div>
        <div className="home__list__content">
          {tab === "activity" ? <Transactions /> : <Domains />}
        </div>
      </div>
    </div>
  );
}
