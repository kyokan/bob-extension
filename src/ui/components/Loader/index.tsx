import React, {ReactElement} from "react";
import LoadingIcon from "@src/static/icons/loader.svg";
import LoadingLightGrayIcon from "@src/static/icons/loader-lightgray.svg";
import "./index.scss";

type Props = {
  className?: string;
  size?: number;
}

export function Loader(props: Props): ReactElement {
  const {size = 1, className = ''} = props;
  return (
    <div
      className={`loader ${className}`}
      style={{
        backgroundImage: `url(${LoadingLightGrayIcon})`,
        height: `${size}rem`,
        width: `${size}rem`,
      }}
    />
  )
}
