import React, {ReactElement, useEffect, useState} from "react";
import "./name.scss";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import punycode from 'punycode';

type Props = {
  hash?: string;
  name?: string;
}

export default function Name(props: Props): ReactElement {
  const {name, hash} = props;
  const [domain, setDomain] = useState('');

  useEffect(() => {
    (async function onNameMount() {
      const {result} = await postMessage({
        type: MessageTypes.GET_NAME_BY_HASH,
        payload: hash,
      });

      try {
        const unicode = punycode.toUnicode(result);

        if (unicode !== result) {
          setDomain(`${unicode}/ (${result})`);
          return;
        }
      } catch(e) {}

      setDomain(`${result}/`);
    })();
  }, [hash]);

  return (
    <div className="name" title={domain || name}>
      {domain || name}
    </div>
  )
}
