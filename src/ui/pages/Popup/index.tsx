import React, {ReactElement, useEffect} from "react";
import "./popup.scss";
import Onboarding from "@src/ui/pages/Onboarding";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";

export default function Popup (): ReactElement {
  useEffect(() => {
    (async () => {
      const mnemonic = await postMessage({
        type: MessageTypes.GENERATE_NEW_MNEMONIC,
      });
      console.log(mnemonic)
    })();
  });
  return (
    <div className="popup">
      <Onboarding />
    </div>
  )
};
