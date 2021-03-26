import React, {ReactElement} from "react";
import "./popup.scss";
import Onboarding from "@src/ui/pages/Onboarding";

export default function Popup (): ReactElement {
  return (
    <div className="popup">
      <Onboarding />
    </div>
  )
};
