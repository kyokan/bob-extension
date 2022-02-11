import React, {useEffect, useState} from "react";
import QRCode from "qrcode.react";
import copy from "copy-to-clipboard";
import {useHistory} from "react-router";
import {useDispatch} from "react-redux";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {
  fetchWallets,
  useCurrentAccount,
  useReceiveAddress,
} from "@src/ui/ducks/wallet";
import Input from "@src/ui/components/Input";
import {
  RegularView,
  RegularViewContent,
  RegularViewHeader,
  RegularViewFooter,
} from "@src/ui/components/RegularView";
import Identicon from "@src/ui/components/Identicon";
import Button, {ButtonType} from "@src/ui/components/Button";
import Icon from "@src/ui/components/Icon";
import ErrorMessage from "@src/ui/components/ErrorMessage";
import "./account-info.scss";

export default function ReceiveTx() {
  const dispatch = useDispatch();
  const address = useReceiveAddress();
  const currentAccount = useCurrentAccount();
  const history = useHistory();
  const [rename, setRename] = useState(currentAccount);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isDefault = currentAccount === "default";

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Screen View",
        data: {
          view: "Account Info",
        },
      },
    });
  }, []);

  useEffect(() => {
    setRename(currentAccount);
  }, [currentAccount]);

  const onRenameAccount = async () => {
    setErrorMessage("");

    if (rename === currentAccount) {
      setIsEditable(!isEditable);
      return;
    }

    try {
      setIsLoading(true);
      await postMessage({
        type: MessageTypes.RENAME_ACCOUNT,
        payload: {
          currentName: currentAccount,
          rename,
        },
      });
      dispatch(fetchWallets());
    } catch (e: any) {
      setIsLoading(false);
      setErrorMessage(e.message);
    }

    setIsLoading(false);
    setIsEditable(!isEditable);
  };

  return (
    <RegularView className="account-info">
      <RegularViewHeader onClose={() => history.push("/")}>
        Account Info
      </RegularViewHeader>

      <div className="account-info__row account-info__row--full-width">
        <Identicon className="account-info__identicon" value={address} />

        {!isEditable ? (
          <div className="account-info__name">
            {currentAccount}
            {!isDefault && (
              <div
                className="account-info__name__icon"
                onClick={() => setIsEditable(!isEditable)}
              >
                <Icon fontAwesome="fa-edit" size={1} />
              </div>
            )}
          </div>
        ) : (
          <div className="account-info__name account-info__name--editable">
            <Input
              // label="Account Name"
              defaultValue={currentAccount}
              onChange={(e) => setRename(e.target.value)}
              fontAwesome="fa-check"
              onIconClick={onRenameAccount}
              disabled={isLoading}
            />
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
          </div>
        )}
      </div>

      <RegularViewContent>
        <div className="account-info__row">
          <div className="account-info__qr-code">
            <QRCode value={address} />
          </div>
        </div>

        <div className="account-info__row">
          <Input
            // label="Receive Address"
            value={address}
            onChange={() => null}
            fontAwesome="fa-copy"
            onIconClick={() => copy(address)}
            spellCheck={false}
          />
        </div>
      </RegularViewContent>

      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      {/* <RegularViewFooter>
        <a
          href={`https://blockexplorer.com/address/${address}`}
          target="_blank"
        >
          <Button
          // disabled={isLoading}
          // loading={isLoading}
          >
            Block Explorer
          </Button>
        </a>
      </RegularViewFooter> */}
    </RegularView>
  );
}
