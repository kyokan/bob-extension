import React, {useEffect, useState} from "react";
import {
  RegularView,
  RegularViewContent,
  RegularViewHeader,
  RegularViewFooter,
} from "@src/ui/components/RegularView";
import {useHistory} from "react-router";
import {useDispatch} from "react-redux";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {fetchWallets, selectAccount} from "@src/ui/ducks/wallet";
import Input from "@src/ui/components/Input";
import Button, {ButtonType} from "@src/ui/components/Button";
import ErrorMessage from "@src/ui/components/ErrorMessage";
import "./create-account.scss";

export default function ReceiveTx() {
  const history = useHistory();
  const dispatch = useDispatch();
  const [accountName, setAccountName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Screen View",
        data: {
          view: "Create Account",
        },
      },
    });
  }, []);

  const onCreateAccount = async () => {
    setErrorMessage("");

    try {
      setIsLoading(true);
      await postMessage({
        type: MessageTypes.CREATE_NEW_WALLET_ACCOUNT,
        payload: accountName,
      });
      await dispatch(fetchWallets());
      await dispatch(selectAccount(accountName));
      history.push("/");
    } catch (e: any) {
      setIsLoading(false);
      setErrorMessage(e.message);
    }

    setIsLoading(false);
  };

  return (
    <RegularView className="create-account">
      <RegularViewHeader onClose={() => history.push("/")}>
        Create Account
      </RegularViewHeader>
      <RegularViewContent>
        <Input
          label="Account Name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
      </RegularViewContent>

      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      <RegularViewFooter>
        <Button
          onClick={() => onCreateAccount()}
          disabled={isLoading}
          loading={isLoading}
        >
          Create Account
        </Button>
      </RegularViewFooter>
    </RegularView>
  );
}
