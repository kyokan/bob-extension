import React, {ChangeEventHandler, ReactElement} from "react";
import "./switch-button.scss";
import classNames from "classnames";

type Props = {
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
}

export default function SwitchButton(props: Props): ReactElement {
  return (
    <div className={classNames("switch-button", props.className)}>
      <input type="checkbox" onChange={props.onChange} checked={props.checked}/>
      <span className="slider round" />
    </div>
  );
}
