import React, {ButtonHTMLAttributes, ReactElement} from "react";
import classNames from "classnames";
import "./button.scss";

export enum ButtonType {
  primary,
  secondary,
}

type Props = {
  className?: string;
  loading?: boolean;
  btnType?: ButtonType;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button (props: Props): ReactElement {
  const {
    className,
    loading,
    children,
    btnType = ButtonType.primary,
    ...btnProps
  } = props;

  return (
    <button
      className={classNames('button', className, {
        'button--loading': loading,
        'button--primary': btnType === ButtonType.primary,
        'button--secondary': btnType === ButtonType.secondary,
      })}
      {...btnProps}
    >
      { loading && <div className="button__loader" /> }
      {children}
    </button>
  )
}
