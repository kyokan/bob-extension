import React, {ButtonHTMLAttributes, ReactElement} from "react";
import classNames from "classnames";
import "./button.scss";
import Icon from "@src/ui/components/Icon";
import {Loader} from "@src/ui/components/Loader";

export enum ButtonType {
  primary,
  secondary,
}

export type ButtonProps = {
  className?: string;
  loading?: boolean;
  btnType?: ButtonType;
  small?: boolean;
  tiny?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button (props: ButtonProps): ReactElement {
  const {
    className,
    loading,
    children,
    btnType = ButtonType.primary,
    small,
    tiny,
    ...btnProps
  } = props;

  return (
    <button
      className={classNames('button', className, {
        'button--small': small,
        'button--tiny': tiny,
        'button--loading': loading,
        'button--primary': btnType === ButtonType.primary,
        'button--secondary': btnType === ButtonType.secondary,
      })}
      {...btnProps}
    >
      { loading && <Loader className="button__loader" size={2} /> }
      { !loading && children }
    </button>
  )
}
