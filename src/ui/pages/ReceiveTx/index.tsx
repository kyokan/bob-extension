import React, {useEffect, useState} from "react";
import {RegularView, RegularViewContent, RegularViewFooter, RegularViewHeader} from "@src/ui/components/RegularView";
import {useHistory} from "react-router";
import Button, {ButtonType} from "@src/ui/components/Button";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import Input from "@src/ui/components/Input";
import copy from "copy-to-clipboard";
import QRCode from 'qrcode.react';
import "./receive.scss";

export default function ReceiveTx() {
  const history = useHistory();
  const [address, setAddress] = useState('');

  useEffect(() => {
    (async function() {
      const resp = await postMessage({
        type: MessageTypes.GET_WALLET_RECEIVE_ADDRESS,
        payload: {},
      });
      setAddress(resp);
    })();
  }, []);

  return (
    <RegularView className="receive">
      <RegularViewHeader
        onClose={() => history.push('/')}
      >
        Receive HNS
      </RegularViewHeader>
      <RegularViewContent>
        <div className="receive__qr-code">
          <QRCode value={address} />
        </div>
        <Input
          label="Receive Address"
          value={address}
          fontAwesome="fa-copy"
          onIconClick={() => copy(address)}
          spellCheck={false}
        />
      </RegularViewContent>
    </RegularView>
  )
}
