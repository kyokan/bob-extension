import React, {Component, MouseEventHandler} from "react";
import c from "classnames";
import './icon.scss';

type Props = {
  url?: string;
  fontAwesome?: string;
  className?: string;
  size?: number;
  onClick?: MouseEventHandler;
  disabled?: boolean;
}

export default class Icon extends Component<Props> {
  render() {
    const {
      url,
      size = 0.75,
      className = '',
      disabled,
      fontAwesome,
      onClick,
    } = this.props;

    return (
        <div
          className={c('icon', className, {
            'icon--disabled': disabled,
            'icon--clickable': onClick,
          })}
          style={{
            backgroundImage: url ? `url(js/${url})` : undefined,
            width: !fontAwesome ? `${size}rem` : undefined,
            height: !fontAwesome ? `${size}rem` : undefined,
            fontSize: fontAwesome && `${size}rem`,
          }}
          onClick={onClick}
        >
          {fontAwesome && <i className={`fas ${fontAwesome}`}></i>}
        </div>
      )
  }
}
