import React, {ReactElement, useCallback, useEffect, useState} from "react";
import Identicon from "@src/ui/components/Identicon";
import {
  lockWallet,
  selectWallet,
  useCurrentWallet,
  useWallets,
  useWalletState,
} from "@src/ui/ducks/wallet";
import {useHistory} from "react-router";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import "./wallet-menu.scss";
import Icon from "@src/ui/components/Icon";
import {useDispatch} from "react-redux";

export default function WalletMenu(): ReactElement {
  const wallets = useWallets();
  const walletIDs = wallets.map((wallet) => wallet.wid);
  const history = useHistory();
  const dispatch = useDispatch();
  const {currentWallet, locked} = useWalletState();
  const [addresses, setAddresses] = useState<
    {address: string; watchOnly: boolean}[]
  >([]);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    (async function onAppHeaderMount() {
      const walletAddresses = [];
      for (const wallet of wallets) {
        const wid = wallet.wid;
        const response = await postMessage({
          type: MessageTypes.GET_WALLET_RECEIVE_ADDRESS,
          payload: {
            id: wid,
            depth: 0,
          },
        });
        if (wid === currentWallet) {
          setCurrentAddress(response);
        }
        walletAddresses.push({address: response, watchOnly: wallet.watchOnly});
      }
      setAddresses(walletAddresses);
    })();
  }, [walletIDs.join(","), currentWallet]);

  const onSelectWallet = useCallback((id: string) => {
    dispatch(selectWallet(id));
  }, []);

  return (
    <div className="wallet-menu" onClick={() => setOpen(!isOpen)}>
      <Identicon value={currentAddress} />
      {isOpen && (
        <div className="wallet-menu__overlay" onClick={() => setOpen(false)} />
      )}
      {isOpen && (
        <div className="wallet-menu__menu">
          {addresses.map((address, i) => {
            return (
              <div
                key={address.address}
                className="wallet-menu__menu__row"
                onClick={() => onSelectWallet(walletIDs[i])}
              >
                <Identicon value={address.address} />
                <div className="wallet-menu__menu__row__name">
                  {walletIDs[i]}
                  {address.watchOnly && (
                    <div className="wallet-menu__menu__pill">Ledger</div>
                  )}
                </div>
              </div>
            );
          })}
          <div className="wallet-menu__menu__divider" />
          <div
            className="wallet-menu__menu__row"
            onClick={() => history.push("/onboarding")}
          >
            <Icon fontAwesome="fa-plus" size={1} />
            <div className="wallet-menu__menu__row__name">Add New Wallet</div>
          </div>
          {!locked && (
            <div
              className="wallet-menu__menu__row"
              onClick={() => dispatch(lockWallet())}
            >
              <Icon fontAwesome="fa-lock" size={1} />
              <div className="wallet-menu__menu__row__name">Lock Wallet</div>
            </div>
          )}
          <div
            className="wallet-menu__menu__row"
            onClick={() => history.push("/settings")}
          >
            <Icon fontAwesome="fa-cog" size={1} />
            <div className="wallet-menu__menu__row__name">Settings</div>
          </div>
        </div>
      )}
    </div>
  );
}
