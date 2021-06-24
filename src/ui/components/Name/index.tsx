import React, {MouseEventHandler, ReactElement, useEffect, useState} from "react";
import "./name.scss";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import punycode from 'punycode';

type Props = {
  hash?: string;
  name?: string;
  onClick?: MouseEventHandler;
  slash?: boolean;
}

export default function Name(props: Props): ReactElement {
  const {name, hash, slash} = props;
  const [domain, setDomain] = useState('');

  useEffect(() => {
    (async function onNameMount() {
      let value = name;

      if (!value) {
        const {result} = await postMessage({
          type: MessageTypes.GET_NAME_BY_HASH,
          payload: hash,
        });
        value = result;
      }

      try {
        const unicode = punycode.toUnicode(value as string);

        if (unicode !== value) {
          setDomain(`${unicode}`);
          return;
        }
      } catch(e) {}

      setDomain(`${value}`);
    })();
  }, [hash, name]);

  return (
    <div className="name" title={domain} onClick={props.onClick}>
      {domain}{slash ? '/' : ''}
    </div>
  )
}
