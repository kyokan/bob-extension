import React, {ReactElement, useCallback} from "react";
import ReactTooltip from "react-tooltip";
import BobIcon from "../../../static/icons/bob-black.png";
import BobMoveIcon from "../../../static/icons/bob-moves.gif";
import "./app-header.scss";
import Icon from "@src/ui/components/Icon";
import WalletMenu from "@src/ui/components/WalletMenu";
import {useBobMessage, useBobMoving} from "@src/ui/ducks/app";
import classNames from "classnames";
import {useWalletState} from "@src/ui/ducks/wallet";
import {useCurrentBlockHeight} from "@src/ui/ducks/node";
import {getExplorerUrl} from "@src/util/explorer";
import {useExplorer} from "@src/ui/ducks/app";

export default function AppHeader(): ReactElement {
  const {rescanning} = useWalletState();
  const bobMessage = useBobMessage();
  const bobMoving = useBobMoving();
  const currentBlockHeight = useCurrentBlockHeight();
  const explorer = useExplorer();

  const handleBlockClick = useCallback(() => {
    window.open(
      getExplorerUrl(explorer, "block", String(currentBlockHeight)),
      "_blank"
    );
  }, [explorer, currentBlockHeight]);

  return (
    <>
      <div className="app-header">
        <div className="app-header__l">
          <div data-for="bob-message" data-tip>
            <Icon
              className={classNames("app-header__bob-icon", {
                "app-header__bob-icon--moving": rescanning || bobMoving,
              })}
              url={BobIcon}
              size={2.5}
            />
            <Icon
              className={classNames("app-header__bob-move-icon", {
                "app-header__bob-move-icon--moving": rescanning || bobMoving,
              })}
              url={BobMoveIcon}
              size={2.625}
            />
          </div>
        </div>
        <div className="app-header__m">
          <div
            className="app-header__block-height"
            onClick={handleBlockClick}
          >
            <div className="app-header__block-height__label">
              Current Block:
            </div>
            <div className="app-header__block-height__value">
              {currentBlockHeight}
            </div>
          </div>
        </div>
        <div className="app-header__r">
          <WalletMenu />
        </div>
      </div>
      <ReactTooltip
        id="bob-message"
        place="bottom"
        type="light"
        getContent={() => bobMessage || "Welcome back!"}
      />
    </>
  );
}
