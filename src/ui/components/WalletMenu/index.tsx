import React, {ReactElement, useEffect, useState} from "react";
import Identicon from "@src/ui/components/Identicon";
import {useWalletIDs} from "@src/ui/ducks/wallet";
import {useHistory} from "react-router";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import "./wallet-menu.scss";
import Icon from "@src/ui/components/Icon";

export default function WalletMenu(): ReactElement {
  const walletIDs = useWalletIDs();
  const history = useHistory();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    (async function onAppHeaderMount() {
      const walletAddresses = [];
      for (const walletID of walletIDs) {
        const response = await postMessage({
          type: MessageTypes.GET_WALLET_RECEIVE_ADDRESS,
          payload: {
            id: walletID,
            depth: 0,
          },
        });
        walletAddresses.push(response);
      }
      setAddresses(walletAddresses);
    })();
  }, [walletIDs.join(',')]);

  return (
    <div
      className="wallet-menu"
      onClick={() => setOpen(!isOpen)}
    >
      <Identicon value={addresses[0] }/>
      {
        isOpen && (
          <div className="wallet-menu__menu">
            {addresses.map((address, i) => {
              return (
                <div className="wallet-menu__menu__row">
                  <Identicon value={address} />
                  <div className="wallet-menu__menu__row__name">
                    {walletIDs[i]}
                  </div>
                </div>
              );
            })}
            <div
              className="wallet-menu__menu__row"
              onClick={() => history.push('/onboarding')}
            >
              <Icon fontAwesome="fa-plus" size={1.5} />
              <div className="wallet-menu__menu__row__name">
                Add New Wallet
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}
