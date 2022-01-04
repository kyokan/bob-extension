import React, { ReactElement, useCallback, useEffect, useState } from "react";
import BobIcon from "../../../static/icons/bob-black-large.png";
import "./login.scss";
import Icon from "@src/ui/components/Icon";
import Button from "@src/ui/components/Button";
import Input from "@src/ui/components/Input";
import { useDispatch } from "react-redux";
import { unlockWallet } from "@src/ui/ducks/wallet";
import ErrorMessage from "@src/ui/components/ErrorMessage";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";

type Props = {};

export default function Login(props: Props): ReactElement {
  const [visible, setVisibility] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Screen View",
        data: {
          view: "Login",
        },
      },
    });
  }, []);

  const onUnlockWallet = useCallback(async () => {
    setLoading(true);
    try {
      await dispatch(unlockWallet(password));
    } catch (e) {
      setErrorMessage("Wrong password.");
    }

    setLoading(false);
  }, [password]);

  return (
    <div className="login">
      <div className="login__content">
        <div>
          <Icon className="login__content__logo" url={BobIcon} size={8} />
          <b>Welcome back to Bob!</b>
        </div>
      </div>
      <div className="login__footer">
        <Input
          label="Set password"
          onChange={(e) => {
            setErrorMessage("");
            setPassword(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter" || e.key === "NumpadEnter") {
              onUnlockWallet();
            }
          }}
          value={password}
          type={visible ? "text" : "password"}
          fontAwesome={visible ? "fa-eye" : "fa-eye-slash"}
          onIconClick={() => setVisibility(!visible)}
        />
        <ErrorMessage>{errorMessage}</ErrorMessage>
        <Button onClick={onUnlockWallet} loading={loading} disabled={loading}>
          Unlock Wallet
        </Button>
      </div>
    </div>
  );
}
