import React, {ReactElement, useEffect, useState, useRef, useCallback} from "react";
import {fetchWalletBalance, useCurrentWallet, useWalletBalance} from "@src/ui/ducks/wallet";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import Identicon from "@src/ui/components/Identicon";
import {useDispatch} from "react-redux";
import {formatNumber, fromDollaryDoos} from "@src/util/number";
import "./home.scss";
import {ReceiveButton, RedeemButton, RevealButton, SendButton} from "@src/ui/components/HomeActionButton";
import classNames from "classnames";
import {setBobMoving} from "@src/ui/ducks/app";
import {fetchTransactions} from "@src/ui/ducks/transactions";
import Transactions from "@src/ui/components/Transactions";
import debounce from 'lodash.debounce';

export default function Home(): ReactElement {
  const dispatch = useDispatch();
  const currentWallet = useCurrentWallet();
  const [tab, setTab] = useState<'domains'|'activities'>('activities');
  const { spendable, lockedUnconfirmed } = useWalletBalance();
  const [currentAddress, setCurrentAddress] = useState('');
  const listElement = useRef<HTMLDivElement>(null);
  const [fixHeader, setFixHeader] = useState(false);

  useEffect(() => {
    (async function onHomeMount() {
      try {
        await dispatch(fetchWalletBalance());
        await dispatch(fetchTransactions());
        await postMessage({
          type: MessageTypes.CHECK_FOR_RESCAN,
        });
        const address = await postMessage({
          type: MessageTypes.GET_WALLET_RECEIVE_ADDRESS,
          payload: {
            id: currentWallet,
            depth: 0,
          },
        });
        setCurrentAddress(address);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [currentWallet]);

  const _onScroll = useCallback(e => {
    if (!listElement.current) return;
    const {y} = listElement.current.getBoundingClientRect();
    if (y <= 66) {
      setFixHeader(true);
    } else {
      setFixHeader(false);
    }
  }, [listElement]);
  const onScroll = debounce(_onScroll, 5, { leading: true });

  return (
    <div
      className={classNames('home', {
        'home--fixed-header': fixHeader,
      })}
      onScroll={onScroll}
    >
      <div className="home__top">
        <Identicon value={currentAddress} />
        <div className="home__account-info">
          <small className="home__account-info__label">
            {currentWallet}
          </small>
          <div className="home__account-info__spendable">
            {`${formatNumber(fromDollaryDoos(spendable))} HNS`}
          </div>
          <small className="home__account-info__locked">
            {!!lockedUnconfirmed && `+${formatNumber(fromDollaryDoos(lockedUnconfirmed))} HNS locked up`}
          </small>
        </div>
      </div>
      <div className="home__actions">
        <SendButton />
        <ReceiveButton />
        <RevealButton />
        <RedeemButton />
      </div>
      <div
        className="home__list"
        ref={listElement}
      >
        <div className="home__list__header">
          <div
            className={classNames("home__list__header__tab", {
              'home__list__header__tab--selected': tab === 'domains',
            })}
            onClick={() => setTab('domains')}
          >
            Domains
          </div>
          <div
            className={classNames("home__list__header__tab", {
              'home__list__header__tab--selected': tab === 'activities',
            })}
            onClick={() => setTab('activities')}
          >
            Activities
          </div>
        </div>
        <div className="home__list__content">
          {tab === 'activities' ? <Transactions/> : null}
        </div>
      </div>
    </div>
  );
}
