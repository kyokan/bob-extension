import React, {OptionHTMLAttributes, ReactElement, SelectHTMLAttributes} from "react";
import "./select.scss";
import classNames from "classnames";

type Props = {
  label?: string;
  errorMessage?: string;
  options: OptionProps[];
  className?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

type OptionProps = {
  value?: string | number | null;
} & OptionHTMLAttributes<HTMLOptionElement>;

export default function Select(props: Props): ReactElement {
  const {
    label,
    errorMessage,
    className,
    options,
    ...selectOptions
  } = props;
  return (
    <div className={classNames(`select-group`, className)}>
      { label && <div className="select-group__label">{label}</div> }
      <select {...selectOptions}>
        {options.map(optionsProps => (
          <option
            key={optionsProps.value}
            {...optionsProps}
          />
        ))}
      </select>
      { errorMessage && <div className="select-group__error-message">{errorMessage}</div> }
    </div>
  )
}
