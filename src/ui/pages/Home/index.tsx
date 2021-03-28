import React, {ReactElement, useEffect, useState} from "react";
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

export default function Home(): ReactElement {
  const dispatch = useDispatch();
  const currentWallet = useCurrentWallet();
  const [tab, setTab] = useState<'domains'|'activities'>('activities');
  const { spendable, lockedUnconfirmed } = useWalletBalance();
  const [currentAddress, setCurrentAddress] = useState('');

  useEffect(() => {
    (async function onHomeMount() {
      try {
        dispatch(setBobMoving(true));
        const address = await postMessage({
          type: MessageTypes.GET_WALLET_RECEIVE_ADDRESS,
          payload: {
            id: currentWallet,
            depth: 0,
          },
        });
        setCurrentAddress(address);
        await dispatch(fetchWalletBalance());
        await postMessage({
          type: MessageTypes.FULL_RESCAN,
        });
      } catch (e) {
        console.error(e);
      }

      dispatch(setBobMoving(false));
    })();
  }, [currentWallet]);

  return (
    <div className="home">
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
            {!!lockedUnconfirmed && `+${formatNumber(fromDollaryDoos(spendable))} HNS locked up`}
          </small>
        </div>
      </div>
      <div className="home__actions">
        <SendButton />
        <ReceiveButton />
        <RevealButton />
        <RedeemButton />
      </div>
      <div className="home__list">
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

        </div>
      </div>
    </div>
  );
}
