import React, {ChangeEventHandler, ReactElement} from 'react';
import c from 'classnames';
import './index.scss';
import Icon from "@src/ui/components/Icon";

type Props = {
  checked: boolean;
  onChange: ChangeEventHandler;
  className?: string;
  disabled?: boolean;
}

export default function Checkbox(props: Props): ReactElement {
  const { className, checked, onChange, disabled } = props;

  return (
    <div className={c('checkbox', className, {
      'checkbox--checked': checked,
    })}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <Icon fontAwesome="fa-check" />
    </div>
  );
}
