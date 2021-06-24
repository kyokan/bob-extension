import React, {ReactElement, useEffect} from "react";
import "./domains.scss";
import {
  setOffset,
  useDomainByName,
  useDomainFetching,
  useDomainNames,
  useDomainOffset
} from "@src/ui/ducks/domains";
import {heightToMoment} from "@src/util/number";
import Name from "@src/ui/components/Name";
import {useDispatch} from "react-redux";
import {Loader} from "@src/ui/components/Loader";
import {useHistory} from "react-router";
const Network = require("hsd/lib/protocol/network");
const networkType = process.env.NETWORK_TYPE || 'main';

export default function Domains(): ReactElement {
  const offset = useDomainOffset();
  const domains = useDomainNames(offset);
  const fetching = useDomainFetching();
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(setOffset(20));
    }
  }, []);

  return (
    <div className="domains">
      {domains.map((name) => <DomainRow key={name} name={name} />)}
      {fetching && <Loader size={3} />}
      {!domains.length && !fetching && <div className="domains__empty">No domains</div>}
    </div>
  );
}

export function DomainRow(props: {name: string}): ReactElement {
  const domain = useDomainByName(props.name);
  const network = Network.get(networkType);
  const history = useHistory();

  if (!domain) return <></>;

  const expiry = heightToMoment(domain.renewal + network.names.renewalWindow).format('YYYY-MM-DD');

  return (
    <div
      className="domain"
      onClick={() => history.push(`/domains/${props.name}`)}
    >
      <div className="domain__info">
        <div className="domain__info__name">
          <Name name={domain.name} />
          {
            ['REGISTER', 'FINALIZE', 'RENEW', 'UPDATE'].includes(domain?.ownerCovenantType || '') && (
              <div className="domain__info__name__status">
                Registered
              </div>
            )
          }
        </div>
        <div className="domain__info__expiry">
          {`Expired on ${expiry}`}
        </div>
      </div>
      <div className="domain__actions">
        <div className="domain__actions__action">

        </div>
      </div>
    </div>
  );
}
