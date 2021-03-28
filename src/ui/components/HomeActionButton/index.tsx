import React, {MouseEventHandler, ReactElement} from "react";
import classNames from "classnames";
import Icon from "@src/ui/components/Icon";
import {useHistory} from "react-router";
import "./home-action-btn.scss";

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
  return (
    <HomeActionButton
      color="orange"
      text="Reveal"
      fontAwesome="fa-eye"
      onClick={() => null}
      disabled
    />
  )
}

export function RedeemButton(): ReactElement {
  return (
    <HomeActionButton
      color="orange"
      text="Redeem"
      fontAwesome="fa-coins"
      onClick={() => null}
      disabled
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
