import React, {ReactElement, ReactNode} from "react";
import "./error-message.scss";

type Props = {
  className?: string;
  children: ReactNode | ReactNode[];
}

export default function ErrorMessage(props: Props): ReactElement {
  const {className = '', children} = props;
  return (
    <small className={`error-message ${className}`}>
      {children}
    </small>
  );
}
