import React, {ReactElement, useCallback, useEffect, useState} from "react";
import {useHistory} from "react-router";
import Icon from "@src/ui/components/Icon";
import "./account-menu.scss";

export default function AccountMenu(): ReactElement {
  const history = useHistory();
  const [isOpen, setOpen] = useState(false);

  return (
    <div className="account-menu" onClick={() => setOpen(!isOpen)}>
      <Icon fontAwesome="fa-ellipsis-v" solid={true} size={1} />
      {isOpen && (
        <div className="account-menu__overlay" onClick={() => setOpen(false)} />
      )}
      {isOpen && (
        <div className="account-menu__menu">
          <div
            className="account-menu__menu__row"
            onClick={() => history.push("/account-info")}
          >
            <Icon fontAwesome="fa-user-circle" solid={false} size={1} />
            <div className="account-menu__menu__row__name">Account info</div>
          </div>

          <div
            className="account-menu__menu__row"
            onClick={() => history.push("/account-info")}
          >
            <Icon fontAwesome="fa-edit" size={1} />
            <div className="account-menu__menu__row__name">Rename account</div>
          </div>
        </div>
      )}
    </div>
  );
}
