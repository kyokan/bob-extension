import React, {ChangeEventHandler, ReactElement} from 'react';
import c from 'classnames';
import './index.scss';
import Icon from "@src/ui/components/Icon";

type Props = {
  className?: string;
  checked: boolean;
  disabled?: boolean;
  id?: string;
  onChange: ChangeEventHandler;
}

export default function Checkbox(props: Props): ReactElement {
  const { className, checked, disabled, id, onChange } = props;

  return (
    <div className={c('checkbox', className, {
      'checkbox--checked': checked,
    })}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        id={id}
      />
      <Icon fontAwesome="fa-check" />
    </div>
  );
}
