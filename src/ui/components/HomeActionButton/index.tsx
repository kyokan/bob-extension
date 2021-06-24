import React, {MouseEventHandler, ReactElement, useCallback, useEffect, useState} from "react";
import classNames from "classnames";
import Icon from "@src/ui/components/Icon";
import {useHistory} from "react-router";
import "./home-action-btn.scss";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {useDomainByName} from "@src/ui/ducks/domains";

type Props = {
  color: 'blue' | 'orange' | 'green';
  text: string;
  fontAwesome: string;
  onClick: MouseEventHandler;
  disabled?: boolean;
}

export function HomeActionButton(props: Props): ReactElement {
  const {
    color,
    fontAwesome,
    onClick,
    text,
    disabled,
  } = props;

  return (
    <div
      className={classNames("home-action-btn", {
        'home-action-btn--blue': color === 'blue',
        'home-action-btn--orange': color === 'orange',
        'home-action-btn--green': color === 'green',
        'home-action-btn--disabled': disabled,
      })}
      onClick={onClick}
    >
      <Icon fontAwesome={fontAwesome} size={1.25} />
      <small>{text}</small>
    </div>
  )
}

export function SendButton(): ReactElement {
  const history = useHistory();

  return (
    <HomeActionButton
      color="blue"
      text="Send"
      fontAwesome="fa-paper-plane"
      onClick={() => history.push('/send')}
    />
  )
}

export function ReceiveButton(): ReactElement {
  const history = useHistory();

  return (
    <HomeActionButton
      color="blue"
      text="Receive"
      fontAwesome="fa-qrcode"
      onClick={() => history.push('/receive')}
    />
  )
}

export function RevealButton(): ReactElement {
  const [tx, setTx] = useState(null);

  const sendReveal = useCallback(async () => {
    try {
      if (!tx) {
        return;
      }
      await postMessage({
        type: MessageTypes.ADD_TX_QUEUE,
        payload: tx,
      });
    } catch (e) {
      console.log(e);
    }
  }, [tx]);


  useEffect(() => {
    (async () => {
      try {
        const resp = await postMessage({
          type: MessageTypes.CREATE_REVEAL,
        });
        setTx(resp);
      } catch (e) {
        setTx(null);
      }
    })();
  }, []);

  return (
    <HomeActionButton
      color="orange"
      text="Reveal"
      fontAwesome="fa-eye"
      onClick={sendReveal}
      disabled={!tx}
    />
  )
}

export function RedeemButton(props: { name: string }): ReactElement {
  const domain = useDomainByName(props.name);

  const sendTx = useCallback(async () => {
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_REDEEM,
        payload: { name: props.name },
      });

      if (!tx) {
        return;
      }

      await postMessage({
        type: MessageTypes.ADD_TX_QUEUE,
        payload: tx,
      });
    } catch (e) {
      console.log(e);
    }
  }, [props.name]);


  return (
    <HomeActionButton
      color="orange"
      text="Redeem"
      fontAwesome="fa-coins"
      onClick={sendTx}
      disabled={!!domain?.ownerCovenantType}
    />
  )
}

export function RegisterButton(props: { name: string }): ReactElement {
  const domain = useDomainByName(props.name);

  const sendTx = useCallback(async () => {
    try {
      const tx = await postMessage({
        type: MessageTypes.CREATE_UPDATE,
        payload: { name: props.name, data: { records: [] } },
      });

      if (!tx) {
        return;
      }

      await postMessage({
        type: MessageTypes.ADD_TX_QUEUE,
        payload: tx,
      });
    } catch (e) {
      console.log(e);
    }
  }, [props.name]);

  return (
    <HomeActionButton
      color="orange"
      text="Register"
      fontAwesome="fa-cash-register"
      onClick={sendTx}
      disabled={domain?.ownerCovenantType !== 'REVEAL'}
    />
  )
}

export function RenewButton(): ReactElement {

  return (
    <HomeActionButton
      color="green"
      text="Renew"
      fontAwesome="fa-undo"
      onClick={() => null}
    />
  )
}

export function TransferButton(): ReactElement {
  return (
    <HomeActionButton
      color="green"
      text="Transfer"
      fontAwesome="fa-exchange-alt"
      onClick={() => null}
    />
  )
}

export function FinalizeButton(): ReactElement {
  return (
    <HomeActionButton
      color="green"
      text="Finalize"
      fontAwesome="fa-receipt"
      onClick={() => null}
    />
  )
}
