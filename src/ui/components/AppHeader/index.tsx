import React, {ReactElement, useEffect, useState} from "react";
import BobIcon from "../../../static/icons/bob-black.png";
import BobMoveIcon from "../../../static/icons/bob-moves.gif";
import "./app-header.scss";
import Icon from "@src/ui/components/Icon";
import WalletMenu from "@src/ui/components/WalletMenu";
import {useBobMoving} from "@src/ui/ducks/app";
import classNames from "classnames";

export default function AppHeader(): ReactElement {
  const isBobMoving = useBobMoving();

  return (
    <div className="app-header">
      <div className="app-header__l">
        <Icon
          className={classNames('app-header__bob-icon', {
            'app-header__bob-icon--moving': isBobMoving,
          })}
          url={BobIcon}
          size={2.5}
        />
        <Icon
          className={classNames('app-header__bob-move-icon', {
            'app-header__bob-move-icon--moving': isBobMoving,
          })}
          url={BobMoveIcon}
          size={2.625}
        />
      </div>
      <div className="app-header__r">
        <WalletMenu />
      </div>
    </div>
  );
}
