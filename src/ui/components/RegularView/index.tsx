import React, {MouseEventHandler, ReactElement, ReactNode} from "react";
import Icon from "@src/ui/components/Icon";
import "./regular-view.scss";
import classNames from "classnames";

type Props = {
  children: ReactNode | ReactNode[];
  className?: string;
}

export function RegularView(props: Props): ReactElement {
  return (
    <div className={classNames("regular-view", props.className)}>
      {props.children}
    </div>
  );
}

type HeaderProps = {
  children: ReactNode | ReactNode[];
  onClose?: MouseEventHandler;
  actionText?: string;
  actionIcon?: ReactNode;
}

export function RegularViewHeader(props: HeaderProps): ReactElement {
  const {
    children,
    onClose,
    actionText,
  } = props;
  let actionEl: ReactNode | null = null;

  if (typeof onClose !== 'undefined') {
    actionEl = actionText
      ? (
        <div
          className="regular-view__action"
          onClick={onClose}
        >
          {actionText}
        </div>
      )
      : (
        <Icon
          fontAwesome="fa-times"
          onClick={onClose}
          size={1.25}
        />
      )
  }

  return (
    <div
      className="regular-view__header"
    >
      <div className="regular-view__header__l">
        {children}
      </div>
      <div className="regular-view__header__r">
        {actionEl}
      </div>
    </div>
  );
}

type ContentProps = {
  children: ReactNode | ReactNode[];
}

export function RegularViewContent(props: ContentProps): ReactElement {
  return (
    <div className="regular-view__content">
      {props.children}
    </div>
  )
}

type FooterProps = {
  children: ReactNode | ReactNode[];
}

export function RegularViewFooter(props: FooterProps): ReactElement {
  return (
    <div className="regular-view__footer">
      {props.children}
    </div>
  )
}
