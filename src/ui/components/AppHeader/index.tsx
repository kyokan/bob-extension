import React, {ReactElement, useEffect, useState} from "react";
import BobIcon from "../../../static/icons/bob-black.png";
import "./app-header.scss";
import Icon from "@src/ui/components/Icon";
import {useHistory} from "react-router";
import WalletMenu from "@src/ui/components/WalletMenu";

export default function AppHeader(): ReactElement {
  const history = useHistory();

  return (
    <div className="app-header">
      <div className="app-header__l">
        <Icon
          url={BobIcon} size={2.5}
        />
      </div>
      <div className="app-header__r">
        <WalletMenu />
      </div>
    </div>
  );
}
