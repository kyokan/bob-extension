import React, {ReactElement, useState} from "react";
import BobIcon from "../../../static/icons/bob-black-large.png";
import "./login.scss";
import Icon from "@src/ui/components/Icon";
import Button from "@src/ui/components/Button";
import Input from "@src/ui/components/Input";
import {OnboardingModalContent} from "@src/ui/components/OnboardingModal";

type Props = {

}

export default function Login(props: Props): ReactElement {
  const [visible, setVisibility] = useState(false);
  const [password, setPassword] = useState('');
  return (
    <div className="login">
      <div className="login__content">
        <Icon
          className="login__content__logo"
          url={BobIcon}
          size={8}
        />
        <b>Welcome back to Bob!</b>
        <Input
          label="Set password"
          onChange={e => setPassword(e.target.value)}
          value={password}
          type={visible ? 'text' : 'password'}
          fontAwesome={visible ? 'fa-eye' : 'fa-eye-slash'}
          onIconClick={() => setVisibility(!visible)}
        />
      </div>
      <div className="login__footer">
        <Button>
          Unlock Wallet
        </Button>
      </div>
    </div>
  )
}
