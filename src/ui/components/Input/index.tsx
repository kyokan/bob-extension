import React, {InputHTMLAttributes, MouseEventHandler} from "react";

import "./index.scss";
import Icon from "../Icon";
import classNames from "classnames";

type Props = {
  label?: string;
  errorMessage?: string;
  fontAwesome?: string;
  url?: string;
  onIconClick?: MouseEventHandler;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: Props) {
  const {
    fontAwesome,
    url,
    size = 1,
    onIconClick,
    label,
    errorMessage,
    className,
    ...inputProps
  } = props;

  return (
    <div className={classNames(`input-group`, className)}>
      { label && <div className="input-group__label">{label}</div> }
      <div className="input-group__group">
        <input
          className="input"
          title={label}
          {...inputProps}
        />
        {
          (!!url || !!fontAwesome) && (
            <Icon
              fontAwesome={fontAwesome}
              url={url}
              size={size}
              onClick={onIconClick}
            />
          )
        }
      </div>
      { errorMessage && <div className="input-group__error-message">{errorMessage}</div> }
    </div>
  )
}
