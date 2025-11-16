import React from "react";
import {RegularView, RegularViewContent, RegularViewHeader} from "@src/ui/components/RegularView";
import {
  useReceiveAddress,
} from "@src/ui/ducks/wallet";
import {useHistory} from "react-router";
import Input from "@src/ui/components/Input";
import copy from "copy-to-clipboard";
import QRCode from 'qrcode.react';
import "./receive.scss";

export default function ReceiveTx() {
  const address = useReceiveAddress();
  const history = useHistory();

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
